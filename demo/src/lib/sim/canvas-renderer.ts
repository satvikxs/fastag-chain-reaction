import {
  CELL_METERS,
  GEOFENCE_CELLS,
  LANE_COUNT,
  ROAD_LENGTH,
  TOLL_CELL,
  type SimSnapshot,
  type Vehicle,
} from "./traffic-sim";

type DrawOpts = {
  withApp: boolean;
  label: string;
  accent: string;
  alpha: number;
  prev: SimSnapshot | null;
  panelId: "good" | "bad";
};

// lerpPos
function lerpPos(v: Vehicle, prev: SimSnapshot | null, alpha: number): number {
  if (!prev || alpha >= 1) return v.position;
  const old = prev.vehicles.find((p) => p.id === v.id);
  if (!old) return v.position;
  return old.position + (v.position - old.position) * alpha;
}

// speedColor
function speedColor(v: number): string {
  if (v <= 0) return "#E63946";
  if (v <= 1) return "#F4A261";
  if (v <= 3) return "#F4D35E";
  return "#06A77D";
}

// drawHighwayPanel
export function drawHighwayPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  snap: SimSnapshot,
  opts: DrawOpts,
) {
  ctx.clearRect(0, 0, w, h);

  const pad = 12;
  const hudH = 44;
  const chartH = 52;
  const roadTop = hudH + 8;
  const roadH = h - roadTop - chartH - pad;
  const viewStart = Math.max(0, TOLL_CELL - 900);
  const viewEnd = ROAD_LENGTH + 40;
  const viewLen = viewEnd - viewStart;

  const toX = (cell: number) => pad + ((cell - viewStart) / viewLen) * (w - pad * 2);
  const tollX = toX(TOLL_CELL);
  const roadW = w - pad * 2;

  drawSky(ctx, w, roadTop);
  drawTerrain(ctx, w, roadTop, roadH, pad);

  // road base
  ctx.fillStyle = "#1e2229";
  ctx.fillRect(pad, roadTop, roadW, roadH);

  const laneH = roadH / LANE_COUNT;
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    const y = roadTop + lane * laneH;
    drawLaneSurface(ctx, pad, y, roadW, laneH, lane);

    if (opts.withApp && snap.geofenceActive) {
      const gx = toX(TOLL_CELL - GEOFENCE_CELLS);
      ctx.fillStyle = "rgba(6,167,125,0.1)";
      ctx.fillRect(gx, y, tollX - gx, laneH);
      ctx.strokeStyle = "rgba(6,167,125,0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + laneH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (snap.blocked && lane === snap.stallLane) {
      drawQueueHeat(ctx, snap, lane, toX, y, laneH, opts.alpha, opts.prev);
    }
  }

  drawKmMarkers(ctx, pad, roadTop, roadH, roadW, viewStart, viewLen);
  drawTollPlaza(ctx, tollX, roadTop, w - tollX - pad, roadH, snap);

  for (const v of snap.vehicles) {
    drawVehicle(ctx, v, lerpPos(v, opts.prev, opts.alpha), toX, roadTop, laneH, snap, opts);
  }

  drawHud(ctx, w, hudH, snap, opts);
  drawQueueChart(ctx, pad, h - chartH - pad / 2, roadW, chartH - 8, snap, opts.panelId);
}

// drawSky
function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0d2847");
  g.addColorStop(0.55, "#1a4a6e");
  g.addColorStop(1, "#2d5a3d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// drawTerrain
function drawTerrain(ctx: CanvasRenderingContext2D, w: number, top: number, roadH: number, pad: number) {
  ctx.fillStyle = "#2a5235";
  ctx.fillRect(0, top, w, roadH + 80);

  ctx.fillStyle = "rgba(20,45,30,0.7)";
  ctx.beginPath();
  ctx.moveTo(0, top);
  for (let x = 0; x <= w; x += 40) {
    ctx.lineTo(x, top - 18 - Math.sin(x * 0.012) * 22);
  }
  ctx.lineTo(w, top);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.font = "600 9px system-ui";
  ctx.fillText("NH-44 · Jammu → Pathankot", pad + 4, top + roadH + 28);
}

// drawLaneSurface
function drawLaneSurface(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lane: number,
) {
  ctx.fillStyle = lane === 1 ? "#262b34" : "#1e2229";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + w, y + 2);
  ctx.stroke();

  if (lane < LANE_COUNT - 1) {
    ctx.strokeStyle = "rgba(244,211,94,0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// drawKmMarkers
function drawKmMarkers(
  ctx: CanvasRenderingContext2D,
  pad: number,
  top: number,
  h: number,
  w: number,
  viewStart: number,
  viewLen: number,
) {
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "500 8px 'JetBrains Mono', monospace";
  for (let km = 6; km <= 13; km += 1) {
    const cell = (km * 1000) / CELL_METERS;
    if (cell < viewStart || cell > viewStart + viewLen) continue;
    const x = pad + ((cell - viewStart) / viewLen) * w;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + h);
    ctx.stroke();
    ctx.fillText(`${km}`, x + 3, top + h + 14);
  }
}

// drawQueueHeat
function drawQueueHeat(
  ctx: CanvasRenderingContext2D,
  snap: SimSnapshot,
  lane: number,
  toX: (c: number) => number,
  y: number,
  laneH: number,
  alpha: number,
  prev: SimSnapshot | null,
) {
  for (const v of snap.vehicles) {
    if (v.lane !== lane || v.velocity > 1) continue;
    const p = lerpPos(v, prev, alpha);
    if (p < TOLL_CELL - 400) continue;
    const cx = toX(p);
    const intensity = 1 - (TOLL_CELL - p) / 400;
    ctx.fillStyle = `rgba(230,57,70,${0.04 + intensity * 0.12})`;
    ctx.fillRect(cx - 10, y + 2, 20, laneH - 4);
  }
}

// drawVehicle
function drawVehicle(
  ctx: CanvasRenderingContext2D,
  v: Vehicle,
  pos: number,
  toX: (c: number) => number,
  roadTop: number,
  laneH: number,
  snap: SimSnapshot,
  opts: DrawOpts,
) {
  const cx = toX(pos);
  const cy = roadTop + v.lane * laneH + laneH / 2;
  const isTruck = v.isLead && v.lane === 1;
  const w = isTruck ? 28 : 20;
  const h = isTruck ? 14 : 10;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(0, h / 2 + 2, w / 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = speedColor(v.velocity);
  ctx.strokeStyle = v.isLead ? "#FAFAF7" : "rgba(0,0,0,0.3)";
  ctx.lineWidth = v.isLead ? 2 : 1;
  roundRect(ctx, -w / 2, -h / 2, w, h, isTruck ? 2 : 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  roundRect(ctx, -w / 2 + 3, -h / 2 + 2, w * 0.35, h - 4, 1);
  ctx.fill();

  if (v.isLead && v.lane === 1) {
    ctx.fillStyle = opts.withApp ? "#06A77D" : "#E63946";
    ctx.beginPath();
    ctx.arc(w / 2 - 4, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (snap.blocked && v.isLead && v.lane === snap.stallLane && v.velocity <= 0) {
    ctx.fillStyle = "#E63946";
    ctx.font = "700 7px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("STOP", 0, -h);
    ctx.textAlign = "left";
  }

  ctx.restore();
}

// drawTollPlaza
function drawTollPlaza(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  snap: SimSnapshot,
) {
  ctx.fillStyle = "#0f2d52";
  ctx.fillRect(x, y - 6, w + 8, h + 12);

  ctx.fillStyle = "#0B2545";
  ctx.fillRect(x + 2, y - 4, w + 4, 14);
  ctx.fillStyle = "#FAFAF7";
  ctx.font = "800 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("LAKHANPUR TOLL PLAZA", x + (w + 4) / 2, y + 6);

  const boothH = h / 6;
  for (let i = 0; i < 6; i++) {
    const by = y + 12 + i * boothH;
    const stalled = snap.blocked && i === 3;
    ctx.fillStyle = stalled ? "#fde8ea" : "#eef1f6";
    ctx.fillRect(x + 4, by, w, boothH - 2);

    const light = stalled ? "#E63946" : i === 3 ? "#06A77D" : "#94a3b8";
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(x + 12, by + boothH / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x + 18, by + boothH - 4);
    ctx.rotate(stalled ? 0.05 : -1.1);
    ctx.fillStyle = stalled ? "#c1121f" : "#64748b";
    ctx.fillRect(0, 0, w - 24, 3);
    ctx.restore();
  }

  ctx.textAlign = "left";
}

const queueHistory: Record<"good" | "bad", number[]> = { good: [], bad: [] };
const MAX_HISTORY = 120;

// drawQueueChart
function drawQueueChart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  snap: SimSnapshot,
  panelId: "good" | "bad",
) {
  const history = queueHistory[panelId];
  history.push(snap.queueLength);
  if (history.length > MAX_HISTORY) history.shift();

  ctx.fillStyle = "rgba(11,37,69,0.75)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();

  ctx.fillStyle = "rgba(250,250,247,0.5)";
  ctx.font = "600 8px system-ui";
  ctx.fillText("Queue depth (2 km zone)", x + 10, y + 14);

  const maxQ = Math.max(20, ...history, snap.queueLength);
  const innerX = x + 10;
  const innerW = w - 20;
  const innerY = y + 20;
  const innerH = h - 28;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(innerX, innerY + innerH);
  ctx.lineTo(innerX + innerW, innerY + innerH);
  ctx.stroke();

  if (history.length < 2) return;

  ctx.beginPath();
  for (let i = 0; i < history.length; i++) {
    const q = history[i]!;
    const px = innerX + (i / (MAX_HISTORY - 1)) * innerW;
    const py = innerY + innerH - (q / maxQ) * innerH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = snap.blocked ? "#E63946" : "#06A77D";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.lineTo(innerX + innerW, innerY + innerH);
  ctx.lineTo(innerX, innerY + innerH);
  ctx.closePath();
  ctx.fillStyle = snap.blocked ? "rgba(230,57,70,0.15)" : "rgba(6,167,125,0.12)";
  ctx.fill();
}

// drawHud
function drawHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  hudH: number,
  snap: SimSnapshot,
  opts: DrawOpts,
) {
  ctx.fillStyle = "rgba(11,37,69,0.92)";
  roundRect(ctx, 12, 6, w - 24, hudH - 8, 10);
  ctx.fill();

  ctx.fillStyle = opts.accent;
  ctx.font = "800 11px system-ui";
  ctx.fillText(opts.label.toUpperCase(), 24, 26);

  ctx.fillStyle = "rgba(250,250,247,0.7)";
  ctx.font = "500 10px 'JetBrains Mono', monospace";
  ctx.fillText(
    `T+${snap.timeSec}s · ${snap.carsThrough} cleared · ${snap.avgSpeedKmh.toFixed(0)} km/h avg · Q${snap.queueLength}`,
    24,
    40,
  );

  if (snap.blocked) {
    ctx.fillStyle = "#E63946";
    ctx.font = "800 10px system-ui";
    ctx.textAlign = "right";
    ctx.fillText("FASTag DECLINED · 90s MANUAL PAYMENT", w - 24, 28);
    ctx.textAlign = "left";
  } else if (snap.geofenceActive) {
    ctx.fillStyle = "#06A77D";
    ctx.font = "800 10px system-ui";
    ctx.textAlign = "right";
    ctx.fillText("GEOFENCE · UPI RECHARGE OK", w - 24, 28);
    ctx.textAlign = "left";
  }
}

// roundRect
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// resetChartHistory
export function resetChartHistory() {
  queueHistory.good.length = 0;
  queueHistory.bad.length = 0;
}
