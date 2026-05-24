"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRng,
  createSim,
  resetSim,
  stepSim,
  type SimEngine,
  type SimSnapshot,
} from "@/lib/sim/traffic-sim";
import { drawHighwayPanel, resetChartHistory } from "@/lib/sim/canvas-renderer";

const STEPS_PER_FRAME = 2;
const HUD_MS = 350;
const LERP_MS = 180;

type HudState = {
  withApp: SimSnapshot;
  withoutApp: SimSnapshot;
  running: boolean;
  speed: number;
  event: string | null;
};

const emptySnap: SimSnapshot = {
  vehicles: [],
  queueLength: 0,
  avgSpeedKmh: 0,
  blocked: false,
  timeSec: 0,
  carsThrough: 0,
  fuelWasted: 0,
  stallLane: null,
  geofenceActive: false,
};

// useTrafficSimulator
export function useTrafficSimulator() {
  const withRef = useRef<SimEngine>(createSim(true));
  const withoutRef = useRef<SimEngine>(createSim(false));
  const rngWith = useRef(createRng(7));
  const rngWithout = useRef(createRng(7));
  const withCanvas = useRef<HTMLCanvasElement>(null);
  const withoutCanvas = useRef<HTMLCanvasElement>(null);
  const runningRef = useRef(true);
  const speedRef = useRef(1);
  const prevWith = useRef<SimSnapshot>(emptySnap);
  const prevWithout = useRef<SimSnapshot>(emptySnap);
  const lastStepAt = useRef(performance.now());
  const stallPlayed = useRef(false);
  const snapRef = useRef<HudState>({
    withApp: emptySnap,
    withoutApp: emptySnap,
    running: true,
    speed: 1,
    event: null,
  });
  const [hud, setHud] = useState<HudState>(snapRef.current);
  const lastHud = useRef(0);

  const reset = useCallback(() => {
    withRef.current = resetSim(true, 7);
    withoutRef.current = resetSim(false, 7);
    rngWith.current = createRng(7);
    rngWithout.current = createRng(7);
    prevWith.current = emptySnap;
    prevWithout.current = emptySnap;
    stallPlayed.current = false;
    resetChartHistory();
    snapRef.current = { ...snapRef.current, event: null, withApp: emptySnap, withoutApp: emptySnap };
    setHud(snapRef.current);
  }, []);

  const toggleRunning = useCallback(() => {
    runningRef.current = !runningRef.current;
    snapRef.current = { ...snapRef.current, running: runningRef.current };
    setHud(snapRef.current);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
    snapRef.current = { ...snapRef.current, speed };
    setHud(snapRef.current);
  }, []);

  useEffect(() => {
    let frame = 0;

    const loop = (now: number) => {
      const alpha = Math.min(1, (now - lastStepAt.current) / LERP_MS);

      if (runningRef.current && document.visibilityState === "visible") {
        const steps = STEPS_PER_FRAME * speedRef.current;
        let withSnap = snapRef.current.withApp;
        let withoutSnap = snapRef.current.withoutApp;

        for (let s = 0; s < steps; s++) {
          prevWith.current = withSnap;
          prevWithout.current = withoutSnap;
          withSnap = stepSim(withRef.current, rngWith.current);
          withoutSnap = stepSim(withoutRef.current, rngWithout.current);
        }

        lastStepAt.current = now;

        let event = snapRef.current.event;
        if (withoutSnap.blocked && !stallPlayed.current) {
          stallPlayed.current = true;
          event = "Stalled FASTag on lane 4 — shockwave forming";
        }
        if (withSnap.geofenceActive && !snapRef.current.withApp.geofenceActive) {
          event = "Geofence fired 5 km out — UPI recharge complete";
        }

        snapRef.current = {
          ...snapRef.current,
          withApp: withSnap,
          withoutApp: withoutSnap,
          event,
        };

        if (now - lastHud.current >= HUD_MS) {
          lastHud.current = now;
          setHud({ ...snapRef.current });
        }
      }

      drawCanvas(
        withCanvas.current,
        snapRef.current.withApp,
        prevWith.current,
        alpha,
        {
          withApp: true,
          geofenceActive: snapRef.current.withApp.geofenceActive,
          label: "With FASTag Chain Reaction",
          accent: "#06A77D",
          panelId: "good",
        },
      );

      drawCanvas(
        withoutCanvas.current,
        snapRef.current.withoutApp,
        prevWithout.current,
        alpha,
        {
          withApp: false,
          geofenceActive: false,
          label: "Without our app",
          accent: "#E63946",
          panelId: "bad",
        },
      );

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return {
    withCanvas,
    withoutCanvas,
    hud,
    reset,
    toggleRunning,
    setSpeed,
  };
}

type DrawMeta = {
  withApp: boolean;
  geofenceActive: boolean;
  label: string;
  accent: string;
  panelId: "good" | "bad";
};

// drawCanvas
function drawCanvas(
  el: HTMLCanvasElement | null,
  snap: SimSnapshot,
  prev: SimSnapshot,
  alpha: number,
  meta: DrawMeta,
) {
  if (!el) return;
  const ctx = el.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = el.getBoundingClientRect();
  withElSize(el, rect, dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawHighwayPanel(ctx, rect.width, rect.height, snap, {
    withApp: meta.withApp,
    label: meta.label,
    accent: meta.accent,
    alpha,
    prev: prev.vehicles.length > 0 ? prev : null,
    panelId: meta.panelId,
  });
}

const sizeCache = new WeakMap<HTMLCanvasElement, { w: number; h: number }>();

// withElSize
function withElSize(el: HTMLCanvasElement, rect: DOMRect, dpr: number) {
  const w = Math.floor(rect.width * dpr);
  const h = Math.floor(rect.height * dpr);
  const cached = sizeCache.get(el);
  if (!cached || cached.w !== w || cached.h !== h) {
    el.width = w;
    el.height = h;
    sizeCache.set(el, { w, h });
  }
}
