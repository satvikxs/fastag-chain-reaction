"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { Pause, Play, RotateCcw, Repeat } from "lucide-react";
import { useGameSim, TOLL_Z_LOCAL, LANE_WIDTH, type GameHud, type GameFrameData } from "@/hooks/use-game-sim";
import { VEHICLE } from "@/lib/demo/constants";
import { PhoneStatusBar } from "@/components/demo/phone-frame";
import { Scene3D } from "./scene-3d";

// GtaView
export function GtaView() {
  const { tick, frameData, hud, reset, toggleScenario, setSpeed, toggleRunning } = useGameSim();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#040d1a]">
      <Canvas
        camera={{ fov: 65, near: 0.5, far: 800, position: [0, 3, -8] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
        className="absolute inset-0"
      >
        <Scene3D tick={tick} frameRef={frameData} />
      </Canvas>

      {/* vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.6)_100%)]" />

      {/* toll distance indicator */}
      <TollDistanceSign hud={hud} />

      {/* FASTag scanning overlay */}
      <ScanOverlay hud={hud} />

      {/* decline overlay */}
      <DeclineOverlay hud={hud} />

      {/* waiting impact counter */}
      <ImpactCounter hud={hud} />

      {/* with-app notifications */}
      <AppNotification hud={hud} />

      {/* approved overlay */}
      <ApprovedOverlay hud={hud} />

      {/* controls */}
      <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
        {[2, 4, 6].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={`size-9 rounded-lg text-[11px] font-bold transition-transform active:scale-[0.96] ${
              hud.speed === s ? "bg-amber-500 text-black" : "bg-black/40 text-white/70 backdrop-blur"
            }`}
          >
            {s}x
          </button>
        ))}
        <button
          type="button"
          onClick={toggleRunning}
          className="flex size-9 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur transition-transform active:scale-[0.96]"
        >
          {hud.running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex size-9 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur transition-transform active:scale-[0.96]"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={toggleScenario}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-[11px] font-extrabold text-black transition-transform active:scale-[0.96]"
        >
          <Repeat className="size-3" />
          {hud.withApp ? "WITHOUT APP" : "WITH APP"}
        </button>
      </div>

      {/* scenario badge */}
      <div className="absolute left-4 top-4 z-30">
        <div
          className={`rounded-lg px-3 py-1.5 text-xs font-extrabold backdrop-blur ${
            hud.withApp
              ? "border border-green-500/30 bg-green-950/60 text-green-400"
              : "border border-red-500/30 bg-red-950/60 text-red-400"
          }`}
        >
          {hud.withApp ? "WITH OUR APP" : "WITHOUT APP"}
        </div>
      </div>

      {/* speedometer */}
      <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-center">
        <span className="text-5xl font-extrabold tabular-nums text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
          {Math.round(hud.playerSpeed)}
        </span>
        <span className="ml-1 text-sm font-bold text-white/35">km/h</span>
      </div>

      {/* minimap */}
      <Minimap frameData={frameData} />

      {/* phone */}
      <PhoneOverlay hud={hud} />
    </div>
  );
}

// TollDistanceSign
function TollDistanceSign({ hud }: { hud: GameHud }) {
  if (hud.phase !== "approaching" && hud.phase !== "driving") return null;
  if (hud.distToToll > 280 || hud.distToToll < 15) return null;

  const dist =
    hud.distToToll >= 1000
      ? `${(hud.distToToll / 1000).toFixed(1)} km`
      : `${Math.round(hud.distToToll)} m`;

  return (
    <div className="absolute left-1/2 top-20 z-30 -translate-x-1/2">
      <div className="rounded-xl border border-white/10 bg-[#006838]/90 px-6 py-3 text-center backdrop-blur-sm">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">LAKHANPUR TOLL PLAZA</div>
        <div className="text-[10px] text-yellow-300/70">लखनपुर टोल प्लाज़ा</div>
        <div className="mt-1 text-2xl font-extrabold tabular-nums text-white">{dist}</div>
        <div className="mt-0.5 text-[9px] text-white/50">FASTag Speed Maintained</div>
      </div>
    </div>
  );
}

// ScanOverlay
function ScanOverlay({ hud }: { hud: GameHud }) {
  if (hud.phase !== "scanning") return null;
  return (
    <div className="absolute left-1/2 top-14 z-40 -translate-x-1/2">
      <div className="rounded-xl border border-purple-500/30 bg-[#1a1a2e]/90 px-6 py-2.5 text-center backdrop-blur-md">
        <div className="text-sm font-extrabold text-purple-400">Reading FASTag… JK-02-AB-1234</div>
      </div>
    </div>
  );
}

// DeclineOverlay
function DeclineOverlay({ hud }: { hud: GameHud }) {
  if (hud.phase !== "declined") return null;
  return (
    <div className="absolute left-1/2 top-14 z-40 w-[min(420px,calc(100%-2rem))] -translate-x-1/2">
      <div className="rounded-xl border-2 border-red-500/50 bg-red-950/92 px-5 py-3 text-center backdrop-blur-md">
        <div className="text-2xl font-extrabold text-red-400">✕ FASTag DECLINED</div>
        <div className="mt-1 text-sm text-white/70">Balance ₹45 · Toll ₹185 · Shortfall ₹140</div>
        <div className="mt-1 text-[11px] text-red-300/60">Proceed to manual payment · Boom stays down</div>
      </div>
    </div>
  );
}

// ImpactCounter
function ImpactCounter({ hud }: { hud: GameHud }) {
  if (hud.phase !== "waiting") return null;

  const waitSec = hud.waitSeconds;
  const personSeconds = hud.queueLength * waitSec;
  const fuelCost = Math.round(hud.queueLength * waitSec * 0.4);
  const co2 = (hud.queueLength * waitSec * 0.002).toFixed(1);

  return (
    <div className="absolute left-1/2 top-14 z-40 w-[min(520px,calc(100%-2rem))] -translate-x-1/2">
      <div className="rounded-xl border border-red-500/30 bg-[#1a0a0a]/92 px-4 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-extrabold uppercase tracking-wider text-red-400">
            ⚠ Chain Reaction — FASTag Declined
          </div>
          <div className="tabular-nums text-sm font-bold text-red-300">
            {waitSec}s waiting · {hud.queueLength} cars stuck
          </div>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-2">
          <ImpactStat label="Queue" value={String(hud.queueLength)} icon="🚗" danger />
          <ImpactStat label="Time lost" value={personSeconds.toLocaleString("en-IN")} icon="⏱" danger />
          <ImpactStat label="Fuel cost" value={`₹${fuelCost.toLocaleString("en-IN")}`} icon="⛽" danger />
          <ImpactStat label="CO₂" value={`${co2}kg`} icon="💨" danger />
        </div>

        <div className="mt-2 text-center text-[11px] text-white/50">
          ₹140 shortfall → 90s manual payment → everyone behind you waits
        </div>
      </div>
    </div>
  );
}

// ImpactStat
function ImpactStat({
  label,
  value,
  icon,
  danger,
}: {
  label: string;
  value: string;
  icon: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/4 px-2 py-1.5 text-center">
      <div className="text-[9px] text-white/40">{icon}</div>
      <div className={`text-sm font-extrabold tabular-nums ${danger ? "text-red-400" : "text-green-400"}`}>
        {value}
      </div>
      <div className="text-[8px] text-white/30">{label}</div>
    </div>
  );
}

// AppNotification
function AppNotification({ hud }: { hud: GameHud }) {
  if (hud.phase !== "notification" && hud.phase !== "recharging") return null;

  return (
    <div className="absolute left-1/2 top-14 z-40 w-[min(420px,calc(100%-2rem))] -translate-x-1/2">
      <div className="rounded-xl border border-amber-500/30 bg-[#1a1400]/92 px-4 py-3 text-center backdrop-blur-md">
        {hud.phase === "notification" && (
          <>
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
              FASTag Chain Reaction Alert
            </div>
            <div className="mt-1 text-sm font-bold text-white">Low balance · Auto-recharging ₹200 via UPI</div>
          </>
        )}
        {hud.phase === "recharging" && (
          <>
            <div className="text-xs font-extrabold uppercase tracking-wider text-green-400">Recharge Complete</div>
            <div className="mt-1 text-sm font-bold text-green-400">✓ ₹200 added · Balance ₹245 · Clear passage</div>
          </>
        )}
      </div>
    </div>
  );
}

// ApprovedOverlay
function ApprovedOverlay({ hud }: { hud: GameHud }) {
  if (hud.phase !== "approved") return null;
  return (
    <div className="absolute left-1/2 top-14 z-40 -translate-x-1/2">
      <div className="rounded-xl border-2 border-green-500/50 bg-green-950/92 px-6 py-2.5 text-center backdrop-blur-md">
        <div className="text-lg font-extrabold text-green-400">✓ FASTag APPROVED — Boom opening</div>
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
    const S = 130;

    const timer = setInterval(() => {
      if (!frameData.current) return;
      const { cars, playerZ } = frameData.current;
      ctx.clearRect(0, 0, S, S);

      ctx.save();
      ctx.beginPath();
      ctx.arc(65, 65, 63, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = "#152a1e";
      ctx.fillRect(0, 0, S, S);

      ctx.fillStyle = "#2d3340";
      ctx.fillRect(48, 0, 34, S);

      for (const car of cars) {
        if (car.isPlayer) continue;
        const dy = ((car.z - playerZ) / 2000) * S;
        const cy = 65 - dy;
        if (cy < 0 || cy > S) continue;
        const cx = 65 + (car.x / LANE_WIDTH) * 10;
        ctx.fillStyle = car.speed > 2 ? "#06A77D" : car.speed > 0 ? "#F4A261" : "#E63946";
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      const tollDy = ((TOLL_Z_LOCAL - playerZ) / 2000) * S;
      const tollCy = 65 - tollDy;
      if (tollCy > 0 && tollCy < S) {
        ctx.fillStyle = "rgba(230,57,70,0.5)";
        ctx.fillRect(38, tollCy - 1, 54, 2);
      }

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(65, 61);
      ctx.lineTo(62, 69);
      ctx.lineTo(68, 69);
      ctx.fill();

      ctx.restore();
    }, 80);

    return () => clearInterval(timer);
  }, [frameData]);

  return (
    <canvas
      ref={canvasRef}
      width={130}
      height={130}
      className="absolute bottom-6 left-5 z-30 rounded-full border border-white/8 shadow-[0_0_30px_rgba(0,0,0,0.6)]"
    />
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
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">Currently Driving</div>
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
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">FASTag Balance</div>
                <div className={`font-mono-data mt-0.5 text-xl font-extrabold tabular-nums ${balance < 100 ? "text-danger" : "text-success"}`}>₹{balance}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">Next Toll</div>
                <div className="mt-0.5 text-xs font-bold text-highway">{VEHICLE.toll} · <span className="font-mono-data">{distance}</span></div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="rounded-md border border-[#C9A93B] bg-[#F4D35E] px-2 py-0.5 font-mono-data text-[9px] font-extrabold text-highway">{VEHICLE.reg}</div>
              <div className="text-[10px] font-semibold text-highway-2/70">{status}</div>
            </div>
            {hud.blocked && !hud.withApp ? (
              <div className="mt-2 rounded-lg bg-danger px-2 py-1.5 text-center text-[10px] font-extrabold text-white">FASTag declined · boom closed</div>
            ) : null}
            {paid ? (
              <div className="mt-2 rounded-lg bg-success px-2 py-1.5 text-center text-[10px] font-extrabold text-white">TAG READ · ₹{VEHICLE.tollFee} debited</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
