export const CELL_METERS = 7.5;
export const ROAD_LENGTH = 1800;
export const STEP_SECONDS = 1;
export const VMAX = 5;
export const P_SLOW = 0.15;
export const N_VEHICLES = 200;
export const LANE_COUNT = 3;
export const TOLL_CELL = ROAD_LENGTH - 5;
export const STOP_DURATION = 45;
export const QUEUE_RADIUS_CELLS = 270;
export const GEOFENCE_CELLS = Math.round(5000 / CELL_METERS);

export type Vehicle = {
  id: number;
  lane: number;
  position: number;
  velocity: number;
  isLead: boolean;
};

export type SimSnapshot = {
  vehicles: Vehicle[];
  queueLength: number;
  avgSpeedKmh: number;
  blocked: boolean;
  timeSec: number;
  carsThrough: number;
  fuelWasted: number;
  stallLane: number | null;
  geofenceActive: boolean;
};

export type LaneEngine = {
  positions: number[];
  velocities: number[];
  blockedUntil: number;
  stallTriggered: boolean;
  canStall: boolean;
  lane: number;
  nextId: number;
  ids: number[];
};

export type SimEngine = {
  lanes: LaneEngine[];
  timeStep: number;
  carsThrough: number;
  fuelWasted: number;
  withApp: boolean;
  seed: number;
  geofenceTriggered: boolean;
  roadEnd: number;
  playerId: number;
  maxVelocity?: number;
  geofenceCells?: number;
};

// mulberry32
export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// createLane
function createLane(lane: number, spacing: number): LaneEngine {
  const positions: number[] = [];
  const velocities: number[] = [];
  const ids: number[] = [];
  const offset = lane * 2;
  for (let i = 0; i < N_VEHICLES; i++) {
    positions.push(i * spacing + offset);
    velocities.push(VMAX);
    ids.push(lane * N_VEHICLES + i);
  }
  return {
    positions,
    velocities,
    blockedUntil: -1,
    stallTriggered: false,
    canStall: lane === 1,
    lane,
    nextId: lane * N_VEHICLES + N_VEHICLES,
    ids,
  };
}

// createSim
export function createSim(withApp: boolean, seed = 7): SimEngine {
  const spacing = 7;
  return {
    lanes: Array.from({ length: LANE_COUNT }, (_, lane) => createLane(lane, spacing)),
    timeStep: 0,
    carsThrough: 0,
    fuelWasted: 0,
    withApp,
    seed,
    geofenceTriggered: false,
    roadEnd: ROAD_LENGTH,
    playerId: LANE_COUNT * N_VEHICLES + N_VEHICLES - 1,
    maxVelocity: VMAX,
    geofenceCells: GEOFENCE_CELLS,
  };
}

// queueLength
function queueLength(lanes: LaneEngine[]): number {
  let count = 0;
  for (const lane of lanes) {
    for (let i = 0; i < lane.positions.length; i++) {
      const p = lane.positions[i]!;
      const v = lane.velocities[i]!;
      if (p >= TOLL_CELL - QUEUE_RADIUS_CELLS && p < TOLL_CELL && v <= 1) count++;
    }
  }
  return count;
}

// avgSpeedKmh
function avgSpeedKmh(lanes: LaneEngine[]): number {
  let sum = 0;
  let n = 0;
  for (const lane of lanes) {
    for (const v of lane.velocities) {
      sum += v;
      n++;
    }
  }
  if (n === 0) return 0;
  return (sum / n) * (CELL_METERS / STEP_SECONDS) * 3.6;
}

// stepLane
function stepLane(lane: LaneEngine, timeStep: number, rng: () => number, roadEnd: number, maxVelocity: number): number {
  const { positions, velocities } = lane;
  const n = positions.length;
  if (n === 0) return 0;

  if (lane.canStall && !lane.stallTriggered) {
    const leadPos = positions[n - 1]!;
    if (leadPos >= TOLL_CELL - 1) {
      lane.stallTriggered = true;
      lane.blockedUntil = timeStep + STOP_DURATION;
    }
  }

  const gaps = new Array<number>(n);
  for (let i = 0; i < n - 1; i++) {
    gaps[i] = positions[i + 1]! - positions[i]! - 1;
  }
  gaps[n - 1] = roadEnd * 2;

  const blocking = lane.canStall && timeStep <= lane.blockedUntil;
  if (blocking) {
    for (let i = 0; i < n; i++) {
      if (positions[i]! < TOLL_CELL) {
        gaps[i] = Math.min(gaps[i]!, TOLL_CELL - positions[i]! - 1);
      }
    }
  }

  const nextPos: number[] = [];
  const nextVel: number[] = [];
  const nextIds: number[] = [];
  let passed = 0;

  for (let i = 0; i < n; i++) {
    let v = Math.min(velocities[i]! + 1, maxVelocity);
    v = Math.min(v, gaps[i]!);
    if (v > 0 && rng() < P_SLOW) v -= 1;
    // toll approach slowdown
    const d = TOLL_CELL - positions[i]!;
    if (d > 0 && d < 25) v = Math.min(v, Math.max(1, Math.floor(d / 5)));
    const p = positions[i]! + v;
    if (p < roadEnd) {
      nextPos.push(p);
      nextVel.push(v);
      nextIds.push(lane.ids[i]!);
    } else {
      passed++;
    }
  }

  lane.positions = nextPos;
  lane.velocities = nextVel;
  lane.ids = nextIds;
  return passed;
}

// stepSim
export function stepSim(engine: SimEngine, rng: () => number): SimSnapshot {
  if (engine.withApp && !engine.geofenceTriggered) {
    const center = engine.lanes[1]!;
    const lead = center.positions[center.positions.length - 1];
    if (lead !== undefined && lead >= TOLL_CELL - (engine.geofenceCells ?? GEOFENCE_CELLS)) {
      engine.geofenceTriggered = true;
    }
  }

  let passed = 0;
  const maxVelocity = engine.maxVelocity ?? VMAX;
  for (const lane of engine.lanes) {
    if (engine.withApp) {
      lane.canStall = false;
    }
    passed += stepLane(lane, engine.timeStep, rng, engine.roadEnd, maxVelocity);
  }

  engine.timeStep += 1;
  engine.carsThrough += passed;

  const blocked = engine.lanes.some((l) => l.canStall && engine.timeStep <= l.blockedUntil);
  if (blocked) {
    for (const lane of engine.lanes) {
      engine.fuelWasted += lane.velocities.filter((v) => v <= 1).length * 0.35;
    }
  }

  return snapshot(engine);
}

// snapshot
function snapshot(engine: SimEngine): SimSnapshot {
  const vehicles: Vehicle[] = [];
  for (const lane of engine.lanes) {
    const n = lane.positions.length;
    for (let i = 0; i < n; i++) {
      vehicles.push({
        id: lane.ids[i]!,
        lane: lane.lane,
        position: lane.positions[i]!,
        velocity: lane.velocities[i]!,
        isLead: i === n - 1,
      });
    }
  }

  const stallLane = engine.lanes.find((l) => l.stallTriggered)?.lane ?? null;

  return {
    vehicles,
    queueLength: queueLength(engine.lanes),
    avgSpeedKmh: avgSpeedKmh(engine.lanes),
    blocked: engine.lanes.some((l) => l.canStall && engine.timeStep <= l.blockedUntil),
    timeSec: engine.timeStep * STEP_SECONDS,
    carsThrough: engine.carsThrough,
    fuelWasted: Math.round(engine.fuelWasted),
    stallLane,
    geofenceActive: engine.withApp && engine.geofenceTriggered,
  };
}

// resetSim
export function resetSim(withApp: boolean, seed = 7): SimEngine {
  return createSim(withApp, seed);
}
