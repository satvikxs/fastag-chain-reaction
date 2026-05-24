"use client";

import type { RefObject } from "react";
import { AlertTriangle, Pause, Play, RotateCcw, Zap } from "lucide-react";
import { AppLogo } from "@/components/demo/phone-frame";
import { useDemoAudio } from "@/hooks/use-demo-audio";
import { useTrafficSimulator } from "@/hooks/use-traffic-simulator";

// HighwayGame
export function HighwayGame() {
  const { withCanvas, withoutCanvas, hud, reset, toggleRunning, setSpeed } = useTrafficSimulator();
  const audio = useDemoAudio(true);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#051225]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(244,162,97,0.12),transparent_55%)]" />
      <div className="grain-overlay pointer-events-none absolute inset-0" />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/6 px-5 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <AppLogo size={40} />
          <div>
            <h1 className="font-display text-balance text-lg font-extrabold text-canvas lg:text-xl">
              Lakhanpur Toll · Live Traffic Simulation
            </h1>
            <p className="text-xs text-canvas/55">
              3-lane NH-44 · Nagel–Schreckenberg physics · 200 vehicles per lane
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`min-h-10 min-w-10 rounded-lg px-3 text-xs font-bold transition-transform active:scale-[0.96] ${
                hud.speed === s ? "bg-accent text-[#1A0F00]" : "bg-white/10 text-canvas"
              }`}
            >
              {s}x
            </button>
          ))}
          <button
            type="button"
            onClick={toggleRunning}
            className="flex min-h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 text-sm font-semibold text-canvas transition-transform active:scale-[0.96]"
          >
            {hud.running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {hud.running ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              audio.unlock();
              reset();
            }}
            className="flex min-h-10 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-extrabold text-[#1A0F00] transition-transform active:scale-[0.96]"
          >
            <RotateCcw className="size-4" />
            Reset
          </button>
        </div>
      </header>

      {hud.event ? (
        <div className="relative z-10 mx-5 mt-3 flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 py-2.5 lg:mx-8">
          <AlertTriangle className="size-4 shrink-0 text-accent" />
          <p className="text-sm font-semibold text-canvas">{hud.event}</p>
        </div>
      ) : null}

      <section className="relative z-10 px-5 py-3 lg:px-8">
        <p className="font-display text-balance text-lg font-extrabold text-canvas md:text-xl">
          Same highway. Same traffic. One dead FASTag on lane 4.
        </p>
        <p className="mt-1 max-w-3xl text-pretty text-sm text-canvas/50">
          Left panel: geofence warns 5 km out, driver recharges, boom stays up. Right panel: low balance,
          90-second manual payment, shockwave ripples back through 600 vehicles.
        </p>
      </section>

      <main className="relative z-10 grid flex-1 grid-cols-1 gap-3 px-3 pb-4 lg:grid-cols-2 lg:gap-4 lg:px-6">
        <SimPanel canvasRef={withCanvas} snap={hud.withApp} variant="good" />
        <SimPanel canvasRef={withoutCanvas} snap={hud.withoutApp} variant="bad" />
      </main>

      <footer className="relative z-10 grid grid-cols-2 gap-3 px-3 pb-6 lg:gap-4 lg:px-6">
        <StatCard
          title="With app"
          queue={hud.withApp.queueLength}
          cleared={hud.withApp.carsThrough}
          fuel="₹0 idling cost"
          tone="good"
          note={hud.withApp.geofenceActive ? "Geofence cleared · lane 4 green" : "Traffic at cruise speed"}
        />
        <StatCard
          title="Without app"
          queue={hud.withoutApp.queueLength}
          cleared={hud.withoutApp.carsThrough}
          fuel={`₹${Math.max(hud.withoutApp.fuelWasted * 12, 0).toLocaleString("en-IN")} idling cost`}
          tone="bad"
          note={hud.withoutApp.blocked ? "Lane 4 blocked · wave spreading 2 km upstream" : "Lead truck approaching toll…"}
        />
      </footer>
    </div>
  );
}

type SimPanelProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  snap: { queueLength: number; avgSpeedKmh: number; blocked: boolean; carsThrough: number };
  variant: "good" | "bad";
};

// SimPanel
function SimPanel({ canvasRef, snap, variant }: SimPanelProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl shadow-[0_28px_70px_-24px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)] ${
        variant === "good" ? "ring-1 ring-success/35" : "ring-1 ring-danger/35"
      }`}
    >
      <canvas ref={canvasRef} className="block h-[min(58vh,520px)] w-full bg-[#142818]" />
      <div className="flex items-center justify-between bg-[#0B2545] px-4 py-2.5">
        <div className="flex items-center gap-2">
          {variant === "good" ? (
            <Zap className="size-4 text-success" strokeWidth={2.5} />
          ) : (
            <span className="font-mono-data text-sm font-bold text-danger">!</span>
          )}
          <span className="text-[11px] font-bold uppercase tracking-wide text-canvas/75">
            {variant === "good" ? "Flow maintained" : "Chain reaction active"}
          </span>
        </div>
        <span className="font-mono-data text-[11px] tabular-nums text-canvas/65">
          {snap.carsThrough} through · {snap.avgSpeedKmh.toFixed(0)} km/h
        </span>
      </div>
    </div>
  );
}

// StatCard
function StatCard({
  title,
  queue,
  cleared,
  fuel,
  tone,
  note,
}: {
  title: string;
  queue: number;
  cleared: number;
  fuel: string;
  tone: "good" | "bad";
  note: string;
}) {
  return (
    <div
      className={`rounded-xl p-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)] ${
        tone === "good" ? "bg-success/10 ring-1 ring-success/25" : "bg-danger/10 ring-1 ring-danger/25"
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-canvas/55">{title}</div>
      <div className="mt-1 flex items-baseline gap-4">
        <div>
          <span className={`font-mono-data text-3xl font-extrabold tabular-nums ${tone === "good" ? "text-success" : "text-danger"}`}>
            {queue}
          </span>
          <span className="ml-1.5 text-xs text-canvas/60">queued</span>
        </div>
        <div>
          <span className="font-mono-data text-lg font-bold tabular-nums text-canvas/80">{cleared}</span>
          <span className="ml-1 text-xs text-canvas/55">cleared</span>
        </div>
      </div>
      <div className="mt-1 font-mono-data text-sm tabular-nums text-canvas/80">{fuel}</div>
      <div className="mt-2 text-xs text-canvas/50">{note}</div>
    </div>
  );
}
