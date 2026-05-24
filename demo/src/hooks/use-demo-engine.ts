"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALERT_DISTANCE_KM,
  DEMO_TOTAL_SECONDS,
  ROAD_WIDTH,
  ROAD_WIDTH_SMALL,
  START_DISTANCE_KM,
} from "@/lib/demo/constants";
import type { DemoAction, DemoState } from "@/lib/demo/types";
import { advanceDistance, speedMultiplier } from "@/lib/demo/utils";

const initialState: DemoState = {
  t: 0,
  distance: START_DISTANCE_KM,
  scene: "drive",
  alertFired: false,
  balanceCheckStarted: false,
  ctaTapped: false,
  upiTapped: false,
  arrived: false,
  disasterShown: false,
  hornFired: false,
  done: false,
  soundOn: true,
  selectedAmount: 500,
  selectedUpi: "Google Pay",
  scrollOffset: 0,
  alertAt: null,
  sheetAt: null,
  balanceCheckAt: null,
};

const RENDER_INTERVAL_MS = 120;

// demoReducer
function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "reset":
      return { ...initialState, soundOn: state.soundOn };
    case "toggle-sound":
      return { ...state, soundOn: !state.soundOn };
    case "skip-to-alert":
      return {
        ...state,
        distance: ALERT_DISTANCE_KM,
        alertFired: true,
        alertAt: state.t,
      };
    case "open-sheet":
      if (state.ctaTapped) return state;
      return { ...state, ctaTapped: true, sheetAt: state.t };
    case "complete-balance-check":
      return { ...state, ctaTapped: true, sheetAt: state.t, scene: "drive" };
    case "tap-upi":
      if (state.upiTapped) return state;
      return { ...state, upiTapped: true, selectedUpi: action.upi };
    case "go-success":
      return { ...state, scene: "success" };
    case "go-toll":
      return { ...state, scene: "toll" };
    case "go-stat":
      return { ...state, scene: "stat", done: true };
    case "set-arrived":
      return { ...state, arrived: true, disasterShown: true };
    case "tick": {
      const dt = action.dt;
      let next: DemoState = { ...state, t: Math.min(DEMO_TOTAL_SECONDS, state.t + dt) };

      const pausedScenes: DemoState["scene"][] = ["success", "toll", "stat"];
      const shouldAdvance = !next.arrived && next.distance > 0 && !pausedScenes.includes(next.scene);

      if (shouldAdvance) {
        next.distance = advanceDistance(next.distance, dt);
        const km = Math.max(0, next.distance);
        next.scrollOffset += 120 * speedMultiplier(km) * dt;
      }

      if (next.scene === "drive" && !next.alertFired && next.distance <= ALERT_DISTANCE_KM) {
        next.alertFired = true;
        next.alertAt = next.t;
      }

      if (next.scene === "drive" && next.alertFired && !next.balanceCheckStarted) {
        const anchor = next.alertAt ?? next.t;
        if (next.t - anchor > 1.2) {
          next.balanceCheckStarted = true;
          next.balanceCheckAt = next.t;
          next.scene = "balance-check";
        }
      }

      return next;
    }
    default:
      return state;
  }
}

// isDiscreteChange
function isDiscreteChange(prev: DemoState, next: DemoState): boolean {
  return (
    prev.scene !== next.scene ||
    prev.alertFired !== next.alertFired ||
    prev.balanceCheckStarted !== next.balanceCheckStarted ||
    prev.ctaTapped !== next.ctaTapped ||
    prev.upiTapped !== next.upiTapped ||
    prev.arrived !== next.arrived ||
    prev.disasterShown !== next.disasterShown ||
    prev.done !== next.done ||
    prev.soundOn !== next.soundOn
  );
}

// isVisibleChange
function isVisibleChange(prev: DemoState, next: DemoState): boolean {
  if (Math.floor(prev.t * 2) !== Math.floor(next.t * 2)) return true;
  if (Math.round(prev.distance * 10) !== Math.round(next.distance * 10)) return true;
  if (Math.round(prev.scrollOffset / 16) !== Math.round(next.scrollOffset / 16)) return true;
  return false;
}

type EngineCallbacks = {
  onAlert: () => void;
  onBalanceCheck: () => void;
  onOpenSheet: () => void;
  onUpiTap: (upi: string) => void;
  onSuccess: () => void;
  onToll: () => void;
  onStat: () => void;
  onDisaster: () => void;
  onHorn: () => void;
};

// useDemoEngine
export function useDemoEngine(callbacks: EngineCallbacks) {
  const stateRef = useRef<DemoState>(initialState);
  const renderedRef = useRef<DemoState>(initialState);
  const lastRenderAtRef = useRef(0);
  const pausedRef = useRef(false);
  const [state, setState] = useState<DemoState>(initialState);
  const callbacksRef = useRef(callbacks);
  const firedRef = useRef({
    alert: false,
    balanceCheck: false,
    sheet: false,
    upi: false,
    success: false,
    toll: false,
    stat: false,
    disaster: false,
    horn: false,
  });

  callbacksRef.current = callbacks;

  const publish = useCallback((next: DemoState, force = false) => {
    stateRef.current = next;
    const now = performance.now();
    const prev = renderedRef.current;
    const shouldRender =
      force || isDiscreteChange(prev, next) || (now - lastRenderAtRef.current >= RENDER_INTERVAL_MS && isVisibleChange(prev, next));

    if (shouldRender) {
      renderedRef.current = next;
      lastRenderAtRef.current = now;
      setState(next);
    }
  }, []);

  const apply = useCallback(
    (action: DemoAction) => {
      publish(demoReducer(stateRef.current, action), true);
    },
    [publish],
  );

  const resetFired = useCallback(() => {
    firedRef.current = {
      alert: false,
      balanceCheck: false,
      sheet: false,
      upi: false,
      success: false,
      toll: false,
      stat: false,
      disaster: false,
      horn: false,
    };
  }, []);

  const reset = useCallback(() => {
    resetFired();
    apply({ type: "reset" });
  }, [apply, resetFired]);

  const skipToAlert = useCallback(() => {
    resetFired();
    firedRef.current.alert = true;
    apply({ type: "skip-to-alert" });
    callbacksRef.current.onAlert();
  }, [apply, resetFired]);

  const openSheet = useCallback(() => {
    apply({ type: "open-sheet" });
    callbacksRef.current.onOpenSheet();
  }, [apply]);

  const tapUpi = useCallback(
    (upi: string) => {
      if (stateRef.current.upiTapped) return;
      firedRef.current.upi = true;
      apply({ type: "tap-upi", upi });
      callbacksRef.current.onUpiTap(upi);
      window.setTimeout(() => {
        if (!firedRef.current.success) {
          firedRef.current.success = true;
          apply({ type: "go-success" });
          callbacksRef.current.onSuccess();
        }
      }, 1800);
    },
    [apply],
  );

  const toggleSound = useCallback(() => apply({ type: "toggle-sound" }), [apply]);

  useEffect(() => {
    const onVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    let handle = 0;
    let last = performance.now();

    const loop = (now: number) => {
      if (pausedRef.current) {
        last = now;
        handle = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const prev = stateRef.current;
      const s = demoReducer(prev, { type: "tick", dt });
      publish(s);

      if (s.alertFired && !firedRef.current.alert) {
        firedRef.current.alert = true;
        callbacksRef.current.onAlert();
      }

      if (s.balanceCheckStarted && s.scene === "balance-check" && !firedRef.current.balanceCheck) {
        firedRef.current.balanceCheck = true;
        callbacksRef.current.onBalanceCheck();
      }

      if (
        s.scene === "balance-check" &&
        s.balanceCheckAt !== null &&
        s.t - s.balanceCheckAt > 2.2 &&
        !firedRef.current.sheet
      ) {
        firedRef.current.sheet = true;
        apply({ type: "complete-balance-check" });
        callbacksRef.current.onOpenSheet();
      }

      const current = stateRef.current;

      if (
        current.scene === "drive" &&
        current.ctaTapped &&
        !current.upiTapped &&
        current.sheetAt !== null &&
        current.t - current.sheetAt > 2.5 &&
        !firedRef.current.upi
      ) {
        firedRef.current.upi = true;
        apply({ type: "tap-upi", upi: "Google Pay" });
        callbacksRef.current.onUpiTap("Google Pay");
        window.setTimeout(() => {
          if (!firedRef.current.success) {
            firedRef.current.success = true;
            apply({ type: "go-success" });
            callbacksRef.current.onSuccess();
          }
        }, 1800);
      }

      const live = stateRef.current;
      const readyForArrival = live.scene === "success" || (live.scene === "drive" && live.upiTapped);

      if (!live.arrived && live.distance <= 0 && readyForArrival) {
        apply({ type: "set-arrived" });
        if (!firedRef.current.horn) {
          firedRef.current.horn = true;
          callbacksRef.current.onHorn();
        }
        if (!firedRef.current.disaster) {
          firedRef.current.disaster = true;
          callbacksRef.current.onDisaster();
        }
        if (!firedRef.current.toll) {
          firedRef.current.toll = true;
          window.setTimeout(() => {
            apply({ type: "go-toll" });
            callbacksRef.current.onToll();
            window.setTimeout(() => {
              if (!firedRef.current.stat) {
                firedRef.current.stat = true;
                apply({ type: "go-stat" });
                callbacksRef.current.onStat();
              }
            }, 3400);
          }, 600);
        }
      }

      if (!live.arrived && live.distance <= 0 && live.scene === "drive" && !live.upiTapped) {
        apply({ type: "set-arrived" });
        if (!firedRef.current.horn) {
          firedRef.current.horn = true;
          callbacksRef.current.onHorn();
        }
        if (!firedRef.current.disaster) {
          firedRef.current.disaster = true;
          callbacksRef.current.onDisaster();
        }
        if (!firedRef.current.upi) {
          firedRef.current.upi = true;
          apply({ type: "tap-upi", upi: "Google Pay" });
        }
        if (!firedRef.current.success) {
          firedRef.current.success = true;
          apply({ type: "go-success" });
          callbacksRef.current.onSuccess();
        }
      }

      handle = requestAnimationFrame(loop);
    };

    handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
  }, [apply, publish]);

  return {
    state,
    reset,
    skipToAlert,
    openSheet,
    tapUpi,
    toggleSound,
    roadWidths: { main: ROAD_WIDTH, alt: ROAD_WIDTH_SMALL },
  };
}
