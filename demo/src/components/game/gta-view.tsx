"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, RotateCcw, Repeat } from "lucide-react";
import { useGameSim, TOLL_Z_LOCAL, LANE_WIDTH, type GameHud, type GameFrameData } from "@/hooks/use-game-sim";
import { VEHICLE } from "@/lib/demo/constants";
import { PhoneStatusBar } from "@/components/demo/phone-frame";
import { Scene3D } from "./scene-3d";

const cardEnter = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.22, ease: [0.22, 0.84, 0.42, 1] as [number, number, number, number] },
};

// GtaView
export function GtaView() {
  const { tick, frameData, hud, reset, toggleScenario, setSpeed, toggleRunning } = useGameSim();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#040d1a] font-sans antialiased">
      <Canvas
        camera={{ fov: 62, near: 0.5, far: 1100, position: [0, 3, -8] }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, powerPreference: "high-performance", stencil: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.18;
        }}
        className="absolute inset-0"
      >
        <AdaptiveDpr pixelated />
        <Scene3D tick={tick} frameRef={frameData} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.62)_100%)]" />

      <TopBar hud={hud} toggleScenario={toggleScenario} />
      <ControlBar hud={hud} setSpeed={setSpeed} toggleRunning={toggleRunning} reset={reset} />

      <TollDistanceSign hud={hud} />
      <ScanOverlay hud={hud} />
      <DeclineOverlay hud={hud} />
      <ImpactCounter hud={hud} />
      <AppNotification hud={hud} />
      <ApprovedOverlay hud={hud} />

      <Speedometer hud={hud} />
      <Minimap frameData={frameData} />
      <PhoneOverlay hud={hud} />
    </div>
  );
}

// TopBar
function TopBar({ hud, toggleScenario }: { hud: GameHud; toggleScenario: () => void }) {
  return (
    <div className="absolute left-4 top-4 z-30 flex items-center gap-2">
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md ${
          hud.withApp
            ? "border-emerald-400/30 bg-emerald-950/60 text-emerald-300"
            : "border-rose-400/30 bg-rose-950/60 text-rose-300"
        }`}
      >
        <span className={`size-1.5 rounded-full ${hud.withApp ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" : "bg-rose-400 shadow-[0_0_8px_rgba(244,114,182,0.7)]"} animate-pulse`} />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em]">
          {hud.withApp ? "Chain Reaction Guard ON" : "No Protection"}
        </span>
      </div>
      <button
        type="button"
        onClick={toggleScenario}
        className="flex items-center gap-1.5 rounded-full bg-amber-500/95 px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-950 shadow-[0_8px_24px_-8px_rgba(245,158,11,0.6)] transition-transform hover:scale-[1.02] active:scale-[0.97]"
      >
        <Repeat className="size-3" />
        {hud.withApp ? "Try without app" : "Try with app"}
      </button>
    </div>
  );
}

// ControlBar
function ControlBar({
  hud,
  setSpeed,
  toggleRunning,
  reset,
}: {
  hud: GameHud;
  setSpeed: (s: number) => void;
  toggleRunning: () => void;
  reset: () => void;
}) {
  return (
    <div className="absolute right-4 top-4 z-30 flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/55 p-1 backdrop-blur-md">
      {[2, 4, 6].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setSpeed(s)}
          className={`min-w-[34px] rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums transition ${
            hud.speed === s
              ? "bg-amber-500 text-zinc-950"
              : "text-zinc-300 hover:bg-white/8"
          }`}
        >
          {s}x
        </button>
      ))}
      <div className="mx-0.5 h-5 w-px bg-white/10" />
      <button
        type="button"
        onClick={toggleRunning}
        className="flex size-8 items-center justify-center rounded-full text-zinc-200 transition hover:bg-white/8 active:scale-95"
        aria-label={hud.running ? "Pause" : "Play"}
      >
        {hud.running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={reset}
        className="flex size-8 items-center justify-center rounded-full text-zinc-200 transition hover:bg-white/8 active:scale-95"
        aria-label="Reset"
      >
        <RotateCcw className="size-3.5" />
      </button>
    </div>
  );
}

// TollDistanceSign
function TollDistanceSign({ hud }: { hud: GameHud }) {
  const visible = (hud.phase === "approaching" || hud.phase === "driving") && hud.distToToll <= 280 && hud.distToToll >= 15;
  const dist = hud.distToToll >= 1000 ? `${(hud.distToToll / 1000).toFixed(1)} km` : `${Math.round(hud.distToToll)} m`;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div {...cardEnter} className="absolute left-1/2 top-20 z-30 -translate-x-1/2">
          <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#006838]/92 px-7 py-3 text-center shadow-[0_18px_42px_-18px_rgba(0,0,0,0.7)] backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">Lakhanpur Toll Plaza</div>
            <div className="mt-0.5 text-[10px] font-semibold text-amber-200/80">लखनपुर टोल प्लाज़ा</div>
            <div className="mt-1.5 font-mono text-3xl font-extrabold tabular-nums tracking-tight text-white">{dist}</div>
            <div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/55">FASTag electronic toll</div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ScanOverlay
function ScanOverlay({ hud }: { hud: GameHud }) {
  return (
    <AnimatePresence>
      {hud.phase === "scanning" ? (
        <motion.div {...cardEnter} className="absolute left-1/2 top-14 z-40 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border border-violet-400/40 bg-[#1a1a2e]/92 px-5 py-2.5 backdrop-blur-md">
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/50" />
              <span className="relative block size-2 rounded-full bg-violet-300" />
            </div>
            <span className="font-mono text-[12.5px] font-bold tracking-wide text-violet-200">
              Reading FASTag <span className="text-violet-100/80">JK 02 AB 1234</span>
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// DeclineOverlay
function DeclineOverlay({ hud }: { hud: GameHud }) {
  return (
    <AnimatePresence>
      {hud.phase === "declined" ? (
        <motion.div {...cardEnter} className="absolute left-1/2 top-14 z-40 w-[min(440px,calc(100%-2rem))] -translate-x-1/2">
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/50 bg-rose-950/94 backdrop-blur-md">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-rose-500 via-rose-300 to-rose-500" />
            <div className="px-5 py-3.5 text-center">
              <div className="font-display text-[22px] font-extrabold tracking-tight text-rose-200">FASTag declined</div>
              <div className="mt-1.5 grid grid-cols-3 gap-2 text-left">
                <KV label="Balance" value="₹45" />
                <KV label="Toll" value="₹185" />
                <KV label="Short" value="₹140" danger />
              </div>
              <div className="mt-2 text-[10.5px] font-semibold tracking-wide text-rose-200/70">
                Proceed to manual payment booth. Boom stays down.
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// KV
function KV({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/25 px-2 py-1.5">
      <div className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</div>
      <div className={`font-mono mt-0.5 text-base font-extrabold tabular-nums ${danger ? "text-rose-300" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

// ImpactCounter
function ImpactCounter({ hud }: { hud: GameHud }) {
  const visible = hud.phase === "waiting";
  const waitSec = hud.waitSeconds;
  const personSeconds = hud.queueLength * waitSec;
  const fuelCost = Math.round(hud.queueLength * waitSec * 0.4);
  const co2 = (hud.queueLength * waitSec * 0.002).toFixed(1);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div {...cardEnter} className="absolute left-1/2 top-14 z-40 w-[min(560px,calc(100%-2rem))] -translate-x-1/2">
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/35 bg-[#140707]/94 backdrop-blur-md">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600" />
            <div className="flex items-center justify-between gap-3 border-b border-white/6 px-4 pb-2 pt-3">
              <div className="flex items-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.7)]" />
                <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-rose-300">
                  Chain reaction in progress
                </span>
              </div>
              <span className="font-mono text-xs font-bold tabular-nums text-rose-200/80">
                {waitSec}s blocked, {hud.queueLength} cars stuck
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 p-3">
              <ImpactStat label="Queue" value={String(hud.queueLength)} />
              <ImpactStat label="Person sec" value={personSeconds.toLocaleString("en-IN")} />
              <ImpactStat label="Fuel loss" value={`₹${fuelCost.toLocaleString("en-IN")}`} />
              <ImpactStat label="CO₂" value={`${co2} kg`} />
            </div>
            <div className="border-t border-white/6 px-4 py-2 text-center text-[10.5px] tracking-wide text-white/55">
              ₹140 shortfall triggers a 90 second manual payment. Everyone behind waits.
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ImpactStat
function ImpactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.035] px-2 py-2 text-center">
      <div className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</div>
      <div className="font-mono mt-1 text-base font-extrabold tabular-nums text-rose-300">{value}</div>
    </div>
  );
}

// AppNotification
function AppNotification({ hud }: { hud: GameHud }) {
  const isNotify = hud.phase === "notification";
  const isRecharge = hud.phase === "recharging";

  return (
    <AnimatePresence>
      {isNotify || isRecharge ? (
        <motion.div {...cardEnter} className="absolute left-1/2 top-14 z-40 w-[min(440px,calc(100%-2rem))] -translate-x-1/2">
          <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-[#161002]/94 backdrop-blur-md">
            <div className={`absolute inset-x-0 top-0 h-[3px] ${isRecharge ? "bg-gradient-to-r from-emerald-500 via-emerald-300 to-emerald-500" : "bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500"}`} />
            <div className="px-5 py-3 text-center">
              {isNotify ? (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                    Chain reaction guard
                  </div>
                  <div className="mt-1.5 text-sm font-bold text-white">
                    Low balance detected. Auto recharging ₹200 via UPI.
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                    Recharge complete
                  </div>
                  <div className="mt-1.5 text-sm font-bold text-emerald-200">
                    ₹200 added, balance ₹245, clear passage ahead.
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ApprovedOverlay
function ApprovedOverlay({ hud }: { hud: GameHud }) {
  return (
    <AnimatePresence>
      {hud.phase === "approved" ? (
        <motion.div {...cardEnter} className="absolute left-1/2 top-14 z-40 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-full border border-emerald-400/50 bg-emerald-950/94 px-5 py-2 backdrop-blur-md">
            <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
            <span className="font-mono text-sm font-bold tracking-wide text-emerald-200">
              FASTag approved, boom opening
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// Speedometer
function Speedometer({ hud }: { hud: GameHud }) {
  const speed = Math.round(hud.playerSpeed);
  const stopped = speed < 2;
  return (
    <div className="absolute bottom-7 left-1/2 z-30 -translate-x-1/2 text-center">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">Speed</div>
      <div className="flex items-baseline justify-center gap-1">
        <span
          className={`font-display tabular-nums drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)] ${
            stopped ? "text-rose-300" : "text-white"
          }`}
          style={{ fontSize: "56px", fontWeight: 800, lineHeight: 1 }}
        >
          {speed}
        </span>
        <span className="font-mono text-xs font-semibold tracking-wider text-white/40">km/h</span>
      </div>
    </div>
  );
}

// Minimap
function Minimap({ frameData }: { frameData: React.RefObject<GameFrameData> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const S = 148;

    const timer = setInterval(() => {
      if (!frameData.current) return;
      const { cars, playerZ } = frameData.current;
      ctx.clearRect(0, 0, S, S);

      ctx.save();
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
      ctx.clip();

      const g = ctx.createRadialGradient(S / 2, S / 2, 8, S / 2, S / 2, S / 2);
      g.addColorStop(0, "#1b2a22");
      g.addColorStop(1, "#0c1310");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);

      // Road body
      ctx.fillStyle = "#2a313b";
      ctx.fillRect(S / 2 - 22, 0, 44, S);

      // Lane separators
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      for (let y = 0; y < S; y += 7) ctx.fillRect(S / 2 - 7.5, y, 1, 3.5);
      for (let y = 0; y < S; y += 7) ctx.fillRect(S / 2 + 6.5, y, 1, 3.5);

      for (const car of cars) {
        if (car.isPlayer) continue;
        const dy = ((car.z - playerZ) / 2000) * S;
        const cy = S / 2 - dy;
        if (cy < -4 || cy > S + 4) continue;
        const cx = S / 2 + (car.x / LANE_WIDTH) * 10;
        ctx.fillStyle = car.speed > 2 ? "#34d399" : car.speed > 0 ? "#fbbf24" : "#f87171";
        ctx.beginPath();
        ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      const tollDy = ((TOLL_Z_LOCAL - playerZ) / 2000) * S;
      const tollCy = S / 2 - tollDy;
      if (tollCy > -4 && tollCy < S + 4) {
        ctx.fillStyle = "rgba(248,113,113,0.55)";
        ctx.fillRect(S / 2 - 26, tollCy - 1.5, 52, 3);
        ctx.fillStyle = "#fca5a5";
        ctx.font = "bold 8px ui-monospace, monospace";
        ctx.fillText("TOLL", S / 2 - 11, tollCy - 4);
      }

      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(S / 2, S / 2 - 5);
      ctx.lineTo(S / 2 - 4, S / 2 + 4);
      ctx.lineTo(S / 2 + 4, S / 2 + 4);
      ctx.fill();

      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();
    }, 70);

    return () => clearInterval(timer);
  }, [frameData]);

  return (
    <div className="absolute bottom-6 left-5 z-30 rounded-full p-[1.5px] bg-gradient-to-br from-white/20 via-white/5 to-transparent shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7)]">
      <canvas ref={canvasRef} width={148} height={148} className="block rounded-full" />
    </div>
  );
}

// PhoneOverlay
function PhoneOverlay({ hud }: { hud: GameHud }) {
  const recharged = hud.withApp && (hud.phase === "recharging" || hud.phase === "approved" || hud.phase === "cleared");
  const paid = hud.withApp && (hud.phase === "approved" || hud.phase === "cleared");
  const balance = recharged ? VEHICLE.balanceAfter - (paid ? VEHICLE.tollFee : 0) : VEHICLE.balanceStart;
  const distance = hud.distToToll >= 1000 ? `${(hud.distToToll / 1000).toFixed(1)} km` : `${Math.round(hud.distToToll)} m`;
  const status = paid ? "Tag read" : recharged ? "Recharge complete" : hud.withApp ? "Low balance alert" : "No app alert";

  return (
    <div className="absolute bottom-5 right-5 z-30 hidden w-[230px] sm:block">
      <div className="relative h-[460px] rounded-[38px] bg-[#0B0E14] p-2 shadow-[0_22px_55px_-20px_rgba(0,0,0,0.75),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="pointer-events-none absolute inset-[5px] rounded-[32px] border border-white/[0.07]" />
        <div className="absolute left-1/2 top-2 z-[60] flex h-6 w-[92px] -translate-x-1/2 items-center justify-center gap-1.5 rounded-[18px] bg-[#0B0E14]">
          <div className="size-1.5 rounded-full bg-[#1a1f2b]" />
          <div className="h-1 w-8 rounded bg-[#1a1f2b]" />
          <div className="size-1.5 rounded-full bg-[#1a1f2b]" />
        </div>

        <div className="relative h-full overflow-hidden rounded-[30px] bg-white text-highway">
          <PhoneStatusBar compact />

          <div className="absolute inset-x-0 top-9 h-[215px] overflow-hidden bg-[#e9f1e8]">
            <div className="absolute left-1/2 top-0 h-full w-[76px] -translate-x-1/2 bg-[#4a4f55]">
              <div className="mx-auto h-full w-px bg-white/55 [background-image:linear-gradient(to_bottom,#fff_0_14px,transparent_14px_28px)]" />
            </div>
            <div className="absolute left-1/2 top-[52%] h-9 w-9 -translate-x-1/2 rounded-md bg-[#0B2545] shadow-sm">
              <div className="mx-auto mt-1.5 h-3 w-5 rounded-sm bg-[#7FB3D5]" />
              <div className="mx-auto mt-1 h-1.5 w-7 rounded bg-[#13315C]" />
            </div>
            <div className="absolute right-8 top-8 h-10 w-12 rounded-sm bg-[#00703c] shadow-sm">
              <div className="mx-auto mt-2 h-1.5 w-9 rounded bg-white" />
              <div className="mx-auto mt-1 h-1.5 w-7 rounded bg-[#ffd84d]" />
            </div>
            {hud.geofenceActive ? <div className="pulse-ring absolute left-1/2 top-[52%] size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-success" /> : null}
          </div>

          <div className="absolute bottom-3 left-2.5 right-2.5 rounded-[18px] border border-highway/5 bg-white/95 p-3 shadow-[0_10px_26px_-16px_rgba(15,23,42,0.28)] backdrop-blur-md">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">Currently driving</div>
                <div className="font-display mt-0.5 text-xs font-extrabold text-highway">{VEHICLE.route}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">Speed</div>
                <div className="font-mono-data mt-0.5 text-xs font-extrabold tabular-nums text-highway">
                  {Math.round(hud.playerSpeed)} <span className="font-semibold">km/h</span>
                </div>
              </div>
            </div>
            <div className="my-2 h-px bg-highway/10" />
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">FASTag balance</div>
                <div className={`font-mono-data mt-0.5 text-xl font-extrabold tabular-nums ${balance < 100 ? "text-danger" : "text-success"}`}>₹{balance}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">Next toll</div>
                <div className="mt-0.5 text-xs font-bold text-highway">
                  {VEHICLE.toll}, <span className="font-mono-data">{distance}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="rounded-md border border-[#C9A93B] bg-[#F4D35E] px-2 py-0.5 font-mono-data text-[9px] font-extrabold text-highway">{VEHICLE.reg}</div>
              <div className="text-[10px] font-semibold text-highway-2/70">{status}</div>
            </div>
            {hud.blocked && !hud.withApp ? (
              <div className="mt-2 rounded-lg bg-danger px-2 py-1.5 text-center text-[10px] font-extrabold text-white">
                FASTag declined, boom closed
              </div>
            ) : null}
            {paid ? (
              <div className="mt-2 rounded-lg bg-success px-2 py-1.5 text-center text-[10px] font-extrabold text-white">
                Tag read, ₹{VEHICLE.tollFee} debited
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
