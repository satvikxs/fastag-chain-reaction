"use client";

import { useCallback, useRef, useState } from "react";
import {
  createRng,
  stepSim,
  CELL_METERS,
  STEP_SECONDS,
  TOLL_CELL,
  LANE_COUNT,
  type SimEngine,
  type SimSnapshot,
} from "@/lib/sim/traffic-sim";

export const LANE_WIDTH = 3.8;
export const TOLL_Z = TOLL_CELL * CELL_METERS;
export const START_CELLS = TOLL_CELL - 42;
export const WORLD_Z_OFFSET = START_CELLS * CELL_METERS;
export const TOLL_Z_LOCAL = (TOLL_CELL - START_CELLS) * CELL_METERS;
export const GEOFENCE_CELLS_GAME = 40;
const GAME_VMAX = 3;
const GAME_ROAD_END_CELLS = TOLL_CELL + 360;

// toLocalZ
export function toLocalZ(cellPos: number): number {
  return cellPos * CELL_METERS - WORLD_Z_OFFSET;
}

const SIM_DT_MS = STEP_SECONDS * 1000;
const DEFAULT_PLAYBACK_SPEED = 2;
const MAX_FRAME_DT_MS = 100;
const MAX_STEPS_PER_FRAME = 5;
const CAR_COLORS = [
  "#e8e8e8", "#1c1c1e", "#f5f0e0", "#7a1a1a",
  "#1a3a6e", "#d4a017", "#2a5230", "#4a3728",
  "#c0c0c0", "#0d47a1", "#b71c1c", "#f5f5f5",
];

export type Car3D = {
  id: number;
  x: number;
  z: number;
  speed: number;
  lane: number;
  isPlayer: boolean;
  color: string;
};

export type GamePhase =
  | "driving"
  | "approaching"
  | "scanning"
  | "declined"
  | "waiting"
  | "notification"
  | "recharging"
  | "approved"
  | "cleared";

export type GameFrameData = {
  cars: Car3D[];
  playerZ: number;
  playerSpeed: number;
  blocked: boolean;
  geofenceActive: boolean;
  stallLane: number | null;
  phase: GamePhase;
  distToToll: number;
};

export type GameHud = {
  playerSpeed: number;
  blocked: boolean;
  timeSec: number;
  queueLength: number;
  geofenceActive: boolean;
  withApp: boolean;
  running: boolean;
  speed: number;
  carsThrough: number;
  fuelWasted: number;
  phase: GamePhase;
  distToToll: number;
  waitSeconds: number;
};

// createGameEngine
// Without-app scenario: pack lots of cars behind the player so the chain
// reaction queue is clearly visible when the player's FASTag is declined.
function createGameEngine(withApp: boolean): SimEngine {
  // Each lane gets a different population so the middle lane (player's lane)
  // has the longest tail of cars to visualize a real chain reaction.
  const counts = withApp ? [22, 28, 22] : [34, 64, 34];
  const spacing = withApp ? 7 : 4;
  const PLAYER_LANE = 1;
  const playerIndexInLane = counts[PLAYER_LANE]! - 1;
  const playerId = PLAYER_LANE * 1000 + playerIndexInLane;

  return {
    lanes: Array.from({ length: LANE_COUNT }, (_, lane) => {
      const n = counts[lane]!;
      const sp = lane === PLAYER_LANE ? spacing : spacing + 1;
      return {
        positions: Array.from({ length: n }, (_, i) => START_CELLS - (n - 1 - i) * sp + lane),
        velocities: Array.from({ length: n }, () => GAME_VMAX),
        blockedUntil: -1,
        stallTriggered: false,
        canStall: !withApp && lane === PLAYER_LANE,
        lane,
        nextId: lane * 1000 + n,
        ids: Array.from({ length: n }, (_, i) => lane * 1000 + i),
      };
    }),
    timeStep: 0,
    carsThrough: 0,
    fuelWasted: 0,
    withApp,
    seed: 7,
    geofenceTriggered: false,
    roadEnd: GAME_ROAD_END_CELLS,
    playerId,
    maxVelocity: GAME_VMAX,
    geofenceCells: GEOFENCE_CELLS_GAME,
  };
}

const defaultFrame: GameFrameData = {
  cars: [],
  playerZ: 0,
  playerSpeed: 80,
  blocked: false,
  geofenceActive: false,
  stallLane: null,
  phase: "driving",
  distToToll: TOLL_Z_LOCAL,
};

// useGameSim
export function useGameSim() {
  const engRef = useRef(createGameEngine(false));
  const rngRef = useRef(createRng(7));
  const curSnap = useRef<SimSnapshot | null>(null);
  const prevCarZ = useRef(new Map<number, number>());
  const accum = useRef(0);
  const lastNow = useRef(0);
  const frameData = useRef<GameFrameData>(defaultFrame);

  const withAppRef = useRef(false);
  const speedRef = useRef(DEFAULT_PLAYBACK_SPEED);
  const runningRef = useRef(true);
  const lastHudMs = useRef(0);

  const phaseRef = useRef<GamePhase>("driving");
  const blockStartSec = useRef(0);
  const scanStartSec = useRef(0);
  const notifyStartSec = useRef(0);
  const approvedStartSec = useRef(0);
  const displayPlayerZ = useRef(0);
  const displayPlayerSpeed = useRef(80);

  const [hud, setHud] = useState<GameHud>({
    playerSpeed: 80,
    blocked: false,
    timeSec: 0,
    queueLength: 0,
    geofenceActive: false,
    withApp: false,
    running: true,
    speed: DEFAULT_PLAYBACK_SPEED,
    carsThrough: 0,
    fuelWasted: 0,
    phase: "driving",
    distToToll: defaultFrame.distToToll,
    waitSeconds: 0,
  });

  // setPhase
  const setPhase = useCallback((next: GamePhase) => {
    const cur = phaseRef.current;
    if (cur === next || cur === "cleared") return;
    const order: GamePhase[] = [
      "driving", "approaching", "notification", "recharging",
      "scanning", "declined", "waiting", "approved", "cleared",
    ];
    const curIdx = order.indexOf(cur);
    const nextIdx = order.indexOf(next);
    if (next === "cleared" || nextIdx > curIdx) phaseRef.current = next;
  }, []);

  // advancePhase
  const advancePhase = useCallback(
    (dist: number, snap: SimSnapshot, speed: number) => {
      const t = snap.timeSec;
      const cur = phaseRef.current;
      if (cur === "cleared") return;

      if (withAppRef.current && !engRef.current.geofenceTriggered && dist <= GEOFENCE_CELLS_GAME * CELL_METERS) {
        engRef.current.geofenceTriggered = true;
      }

      if (snap.blocked && !withAppRef.current) {
        if (blockStartSec.current === 0) blockStartSec.current = t;
        setPhase(t - blockStartSec.current < 2.5 ? "declined" : "waiting");
        return;
      }

      if (!snap.blocked && blockStartSec.current > 0) {
        setPhase("cleared");
        return;
      }

      if (withAppRef.current && snap.geofenceActive) {
        if (notifyStartSec.current === 0) notifyStartSec.current = t;
        const e = t - notifyStartSec.current;
        if (e < 3) { setPhase("notification"); return; }
        if (e < 6) { setPhase("recharging"); return; }
      }

      if (dist < 35 && dist > 0 && speed < 90) {
        if (scanStartSec.current === 0) scanStartSec.current = t;
        const e = t - scanStartSec.current;
        if (e < 2.5) { setPhase("scanning"); return; }
        if (withAppRef.current && approvedStartSec.current === 0) {
          approvedStartSec.current = t;
          setPhase("approved");
          return;
        }
        if (withAppRef.current && approvedStartSec.current > 0 && t - approvedStartSec.current > 3) {
          setPhase("cleared");
          return;
        }
      }

      if (dist < 250 && dist > 0) setPhase("approaching");
      else if (cur === "driving" || cur === "approaching") setPhase("driving");
    },
    [setPhase],
  );

  // buildCars
  const buildCars = useCallback((snap: SimSnapshot, alpha: number, simFrameSec: number): { cars: Car3D[]; playerZ: number; playerSpeed: number } => {
    const cars: Car3D[] = [];
    const playerId = engRef.current.playerId;
    let rawPlayerZ = displayPlayerZ.current;
    let playerSpeed = displayPlayerSpeed.current;
    let foundPlayer = false;

    for (const v of snap.vehicles) {
      const prevZ = prevCarZ.current.get(v.id);
      const curZ = toLocalZ(v.position);
      const z = prevZ !== undefined ? prevZ + (curZ - prevZ) * alpha : curZ;
      const isP = v.id === playerId;

      cars.push({
        id: v.id,
        x: (v.lane - 1) * LANE_WIDTH,
        z,
        speed: v.velocity,
        lane: v.lane,
        isPlayer: isP,
        color: isP ? "#f0f0f0" : CAR_COLORS[v.id % CAR_COLORS.length]!,
      });

      if (isP) {
        foundPlayer = true;
        rawPlayerZ = z;
        playerSpeed = v.velocity * CELL_METERS * 3.6;
      }
    }

    if (foundPlayer) {
      displayPlayerZ.current = Math.max(displayPlayerZ.current, rawPlayerZ);
      displayPlayerSpeed.current = playerSpeed;
    } else if (displayPlayerSpeed.current > 1) {
      displayPlayerZ.current += (displayPlayerSpeed.current / 3.6) * simFrameSec;
    }

    return { cars, playerZ: displayPlayerZ.current, playerSpeed: displayPlayerSpeed.current };
  }, []);

  // tick
  const tick = useCallback(
    (nowMs: number): GameFrameData => {
      if (!runningRef.current) return frameData.current;

      if (!lastNow.current) lastNow.current = nowMs;
      const frameDt = Math.min(Math.max(nowMs - lastNow.current, 0), MAX_FRAME_DT_MS);
      lastNow.current = nowMs;
      accum.current += frameDt * speedRef.current;

      let steps = 0;
      while (accum.current >= SIM_DT_MS && steps < MAX_STEPS_PER_FRAME) {
        prevCarZ.current.clear();
        if (curSnap.current) {
          for (const v of curSnap.current.vehicles) {
            prevCarZ.current.set(v.id, toLocalZ(v.position));
          }
        }
        curSnap.current = stepSim(engRef.current, rngRef.current);
        accum.current -= SIM_DT_MS;
        steps++;
      }

      if (steps === MAX_STEPS_PER_FRAME && accum.current >= SIM_DT_MS) {
        accum.current = SIM_DT_MS - 1;
      }

      if (!curSnap.current) {
        curSnap.current = stepSim(engRef.current, rngRef.current);
        for (const v of curSnap.current.vehicles) {
          prevCarZ.current.set(v.id, toLocalZ(v.position));
        }
      }

      const snap = curSnap.current;
      const alpha = accum.current / SIM_DT_MS;
      const simFrameSec = (frameDt * speedRef.current) / 1000;
      const { cars, playerZ, playerSpeed } = buildCars(snap, alpha, simFrameSec);
      const distToToll = Math.max(0, TOLL_Z_LOCAL - playerZ);

      advancePhase(distToToll, snap, playerSpeed);

      frameData.current = {
        cars,
        playerZ,
        playerSpeed,
        blocked: snap.blocked,
        geofenceActive: snap.geofenceActive || engRef.current.geofenceTriggered,
        stallLane: snap.stallLane,
        phase: phaseRef.current,
        distToToll,
      };

      if (nowMs - lastHudMs.current > 200) {
        lastHudMs.current = nowMs;
        const waitSeconds = snap.blocked && blockStartSec.current > 0 ? snap.timeSec - blockStartSec.current : 0;
        setHud({
          playerSpeed,
          blocked: snap.blocked,
          timeSec: snap.timeSec,
          queueLength: snap.queueLength,
          geofenceActive: snap.geofenceActive || engRef.current.geofenceTriggered,
          withApp: withAppRef.current,
          running: runningRef.current,
          speed: speedRef.current,
          carsThrough: snap.carsThrough,
          fuelWasted: snap.fuelWasted,
          phase: phaseRef.current,
          distToToll,
          waitSeconds: Math.max(0, waitSeconds),
        });
      }

      return frameData.current;
    },
    [advancePhase, buildCars],
  );

  // resetInternal
  const resetInternal = useCallback(() => {
    engRef.current = createGameEngine(withAppRef.current);
    rngRef.current = createRng(7);
    curSnap.current = null;
    prevCarZ.current.clear();
    accum.current = 0;
    lastNow.current = 0;
    phaseRef.current = "driving";
    blockStartSec.current = 0;
    scanStartSec.current = 0;
    notifyStartSec.current = 0;
    approvedStartSec.current = 0;
    displayPlayerZ.current = 0;
    displayPlayerSpeed.current = 80;
    frameData.current = { ...defaultFrame };
  }, []);

  const reset = useCallback(() => {
    resetInternal();
    setHud((h) => ({ ...h, phase: "driving", distToToll: defaultFrame.distToToll, waitSeconds: 0 }));
  }, [resetInternal]);

  const toggleScenario = useCallback(() => {
    withAppRef.current = !withAppRef.current;
    resetInternal();
    setHud((h) => ({ ...h, withApp: withAppRef.current, phase: "driving", distToToll: defaultFrame.distToToll, waitSeconds: 0 }));
  }, [resetInternal]);

  const setSpeed = useCallback((s: number) => {
    speedRef.current = s;
    setHud((h) => ({ ...h, speed: s }));
  }, []);

  const toggleRunning = useCallback(() => {
    runningRef.current = !runningRef.current;
    setHud((h) => ({ ...h, running: runningRef.current }));
  }, []);

  return { tick, frameData, hud, reset, toggleScenario, setSpeed, toggleRunning };
}
