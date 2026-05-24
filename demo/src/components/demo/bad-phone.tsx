"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { VEHICLE } from "@/lib/demo/constants";
import { easeOutQuad } from "@/lib/demo/utils";
import { HighwayMap } from "./highway-map";
import { PhoneStatusBar } from "./phone-frame";

type BadPhoneProps = {
  distance: number;
  scrollOffset: number;
  roadWidth: number;
  disasterShown: boolean;
};

// BadPhone
export function BadPhone({ distance, scrollOffset, roadWidth, disasterShown }: BadPhoneProps) {
  const [stuckCount, setStuckCount] = useState(1);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    if (!disasterShown) {
      setStuckCount(1);
      setShowFinal(false);
      return;
    }

    const start = performance.now();
    const duration = 12000;
    const id = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / duration);
      setStuckCount(Math.round(1 + (71 - 1) * easeOutQuad(p)));
      if (p >= 1) {
        window.clearInterval(id);
        setShowFinal(true);
      }
    }, 200);

    return () => window.clearInterval(id);
  }, [disasterShown]);

  return (
    <>
      <PhoneStatusBar compact />
      <div className="absolute inset-0">
        <HighwayMap distance={distance} scrollOffset={scrollOffset} roadWidth={roadWidth} compact />

        <div className="absolute bottom-3 left-2.5 right-2.5 rounded-2xl border border-highway/5 bg-white/95 p-3 backdrop-blur-md">
          <div className="mb-1.5 flex items-start justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">Driving</div>
              <div className="font-display mt-0.5 text-xs font-extrabold text-highway">Srinagar → Jammu</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">Speed</div>
              <div className="font-mono-data mt-0.5 text-xs font-extrabold text-highway">
                82 <span className="font-semibold">km/h</span>
              </div>
            </div>
          </div>
          <div className="my-1.5 h-px bg-highway/10" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">FASTag</div>
              <div className="font-mono-data mt-0.5 text-lg font-extrabold text-highway">₹47</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-highway-2/70">Next Toll</div>
              <div className="font-display mt-0.5 text-xs font-bold text-highway">
                {VEHICLE.toll} · <span className="font-mono-data">{distance.toFixed(1)}</span> km
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] italic text-highway-2/60">No alerts. No app.</div>
        </div>

        <AnimatePresence>
          {disasterShown ? (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0.05, 0.3, 1] }}
              className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-gradient-to-b from-danger to-[#BE2634] px-[18px] pb-[18px] pt-[60px] text-white"
            >
              <div className="text-center text-base font-extrabold">✕ Tag Declined</div>
              <div className="mb-4 text-center text-xs opacity-90">Manual Payment Required</div>

              <div className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-85">Cars stuck behind you</div>
                <div className="font-mono-data stuck-counter mt-1 text-[64px] font-extrabold leading-none tabular-nums">{stuckCount}</div>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-1 px-1">
                {Array.from({ length: Math.min(stuckCount, 32) }).map((_, i) => (
                  <div key={i} className="size-1.5 rounded-sm bg-white/40" style={{ opacity: 0.25 + (i / 32) * 0.75 }} />
                ))}
              </div>

              <div className="disaster-stats mt-3 rounded-xl border border-white/20 bg-black/20 p-3 text-[10px] font-semibold leading-relaxed">
                <div>Avg delay per driver: <span className="font-mono-data">3.1 min</span></div>
                <div>Estimated fuel wasted: <span className="font-mono-data">₹4,260</span></div>
                <div>Ambulance stuck: <span className="font-mono-data">1</span></div>
              </div>

              {showFinal ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="final-disaster-card mt-3 rounded-[14px] border-2 border-white bg-white p-3.5 text-danger"
                >
                  <div className="text-base font-extrabold leading-tight">
                    <span className="font-mono-data">71</span> vehicles delayed.
                  </div>
                  <div className="mt-1 text-xs font-semibold">₹4,260 collective fuel wasted. 9 minutes lost.</div>
                </motion.div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
