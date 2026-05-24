"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { DEMO_STEPS, SCENE_ORDER } from "@/lib/demo/constants";
import type { DemoScene } from "@/lib/demo/types";

type DemoTimelineProps = {
  scene: DemoScene;
  progress: number;
  timeLabel: string;
};

// DemoTimeline
export function DemoTimeline({ scene, progress, timeLabel }: DemoTimelineProps) {
  const activeIdx = SCENE_ORDER.indexOf(scene);

  return (
    <div className="w-full max-w-2xl">
        <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-success via-accent to-canvas transition-[width] duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

      <div className="mt-4 grid grid-cols-5 gap-1">
        {DEMO_STEPS.map((step, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-300 ${
                  done
                    ? "bg-success text-white shadow-[0_0_16px_-2px_rgba(6,167,125,0.6)]"
                    : active
                      ? "bg-accent text-[#1A0F00] shadow-[0_0_20px_-2px_rgba(244,162,97,0.7)]"
                      : "border border-white/15 bg-white/[0.04] text-canvas/40"
                }`}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : step.short}
              </div>
              <span
                className={`hidden text-[10px] font-semibold uppercase tracking-wide sm:block ${
                  active ? "text-canvas" : done ? "text-success/80" : "text-canvas/35"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-canvas/60">{timeLabel}</p>
    </div>
  );
}

type LiveMetricsProps = {
  distance: number;
  alertFired: boolean;
  disasterShown: boolean;
  scene: DemoScene;
};

// LiveMetrics
export function LiveMetrics({ distance, alertFired, disasterShown, scene }: LiveMetricsProps) {
  const inGeofence = distance <= 5;
  const carsAtRisk = disasterShown ? 71 : Math.max(0, Math.round((5 - Math.min(distance, 5)) * 14));

  return (
    <div className="grid w-full max-w-3xl grid-cols-3 gap-3">
      <MetricCard
        label="Distance to toll"
        value={`${distance.toFixed(1)} km`}
        tone={distance <= 1 ? "warn" : "neutral"}
      />
      <MetricCard
        label="Geofence"
        value={inGeofence ? "ACTIVE · 5 km" : "Standby"}
        tone={inGeofence ? "good" : "neutral"}
        pulse={alertFired && scene === "drive"}
      />
      <MetricCard
        label="Queue risk"
        value={disasterShown ? "71 cars" : `${carsAtRisk} cars`}
        tone={disasterShown ? "bad" : carsAtRisk > 20 ? "warn" : "good"}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  pulse,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad" | "neutral";
  pulse?: boolean;
}) {
  const tones = {
    good: "border-success/25 bg-success/[0.08] text-success",
    warn: "border-accent/30 bg-accent/[0.08] text-accent",
    bad: "border-danger/30 bg-danger/[0.10] text-danger",
    neutral: "border-white/10 bg-white/[0.04] text-canvas",
  };

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 backdrop-blur-sm transition-shadow ${tones[tone]} ${pulse ? "shadow-[0_0_24px_-4px_rgba(244,162,97,0.4)]" : ""}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">{label}</div>
      <div className="font-mono-data mt-0.5 text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}

// VsDivider
export function VsDivider() {
  return (
    <div className="hidden flex-col items-center justify-center gap-3 self-center lg:flex">
      <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
      <div className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xs font-extrabold tracking-widest text-canvas/50 backdrop-blur-sm">
        VS
      </div>
      <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
    </div>
  );
}

// StagePlatform
export function StagePlatform({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-x-8 -bottom-6 top-1/2 rounded-[40px] bg-gradient-to-b from-white/[0.04] to-transparent blur-xl" />
      <div className="pointer-events-none absolute -inset-x-4 bottom-0 h-24 rounded-full bg-success/10 blur-3xl" />
      {children}
    </div>
  );
}
