"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft, FastForward, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { DEMO_TOTAL_SECONDS, SCENE_LABELS, VEHICLE } from "@/lib/demo/constants";
import { formatTime } from "@/lib/demo/utils";
import { useDemoAudio } from "@/hooks/use-demo-audio";
import { useDemoEngine } from "@/hooks/use-demo-engine";
import { AppLogo, PhoneFrame } from "./phone-frame";
import { GoodPhone } from "./good-phone";
import { BadPhone } from "./bad-phone";
import { DemoTimeline, LiveMetrics, StagePlatform, VsDivider } from "./demo-timeline";

// DemoPage
export function DemoPage() {
  const [shake, setShake] = useState(false);
  const audioRef = useRef<ReturnType<typeof useDemoAudio> | null>(null);

  const { state, reset, skipToAlert, openSheet, tapUpi, toggleSound, roadWidths } = useDemoEngine({
    onAlert: () => {
      audioRef.current?.unlock();
      audioRef.current?.alert();
      setShake(true);
      window.setTimeout(() => setShake(false), 600);
    },
    onBalanceCheck: () => audioRef.current?.scan(),
    onOpenSheet: () => {},
    onUpiTap: () => {},
    onSuccess: () => audioRef.current?.success(),
    onToll: () => audioRef.current?.boop(),
    onStat: () => {},
    onDisaster: () => {},
    onHorn: () => audioRef.current?.horn(),
  });

  const audio = useDemoAudio(state.soundOn);
  audioRef.current = audio;

  const balance =
    state.scene === "success" || state.scene === "toll" || state.scene === "stat"
      ? VEHICLE.balanceAfter
      : VEHICLE.balanceStart;

  const sheetOpen = state.ctaTapped && !state.upiTapped && state.scene === "drive";
  const progress = Math.min(100, (state.t / DEMO_TOTAL_SECONDS) * 100);
  const sceneLabel = SCENE_LABELS[state.scene] ?? "Demo";
  const timeLabel = `${sceneLabel} · ${formatTime(state.t)} / ${formatTime(DEMO_TOTAL_SECONDS)}`;

  const handleInteraction = useCallback(() => {
    audio.unlock();
  }, [audio]);

  return (
    <div className="relative min-h-screen overflow-x-hidden" onPointerDown={handleInteraction}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(165deg,#071A33_0%,#0B2545_40%,#0D2D52_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(244,162,97,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(6,167,125,0.12),transparent_50%)]" />
        <div className="glow-drift absolute -left-32 top-20 size-[480px] rounded-full bg-accent/[0.07] blur-3xl" />
        <div className="glow-drift-delay absolute -right-24 bottom-10 size-[400px] rounded-full bg-success/[0.08] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,255,255,0.5) 79px, rgba(255,255,255,0.5) 80px)",
          }}
        />
        <div className="grain-overlay absolute inset-0" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pb-2 pt-8">
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="flex size-10 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-canvas backdrop-blur-md transition-transform hover:bg-white/10 active:scale-[0.96]"
            aria-label="Back to landing"
          >
            <ArrowLeft className="size-4" strokeWidth={2.5} />
          </Link>
          <AppLogo size={52} />
          <div>
            <h1 className="font-display text-balance text-xl font-extrabold text-canvas md:text-2xl">
              FASTag Chain Reaction
            </h1>
            <p className="text-sm text-canvas/65">{VEHICLE.route}</p>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-wrap items-center gap-2"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button
            type="button"
            onClick={() => {
              audio.unlock();
              skipToAlert();
            }}
            className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2.5 text-sm font-semibold text-canvas backdrop-blur-md transition-transform hover:border-white/20 hover:bg-white/10 active:scale-[0.96]"
          >
            <FastForward className="size-4" strokeWidth={2} />
            Skip to Alert
          </button>
          <button
            type="button"
            onClick={() => {
              audio.unlock();
              reset();
            }}
            className="flex items-center gap-2 rounded-xl bg-accent px-3.5 py-2.5 text-sm font-extrabold text-[#1A0F00] shadow-[0_8px_24px_-6px_rgba(244,162,97,0.55)] transition-transform hover:brightness-105 active:scale-[0.96]"
          >
            <RotateCcw className="size-4" strokeWidth={2.5} />
            Reset Demo
          </button>
        </motion.div>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-6 py-6 text-center">
        <motion.p
          className="font-display text-balance text-2xl font-extrabold tracking-tight text-canvas md:text-3xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Stop the wave before it starts.
        </motion.p>
        <motion.p
          className="mx-auto mt-2 max-w-xl text-pretty text-sm leading-relaxed text-canvas/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          Same driver. Same toll. Two timelines — one recharge at 5 km, one stall at the boom.
        </motion.p>
      </section>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 pb-28 pt-2">
        <LiveMetrics
          distance={state.distance}
          alertFired={state.alertFired}
          disasterShown={state.disasterShown}
          scene={state.scene}
        />

        <StagePlatform>
          <div className="flex flex-wrap items-start justify-center gap-6 lg:gap-4">
            <PhoneFrame badge="With our app" variant="good" shake={shake} glow={state.scene === "stat"}>
              <GoodPhone
                scene={state.scene}
                distance={state.distance}
                scrollOffset={state.scrollOffset}
                roadWidth={roadWidths.main}
                alertFired={state.alertFired}
                balance={balance}
                sheetOpen={sheetOpen}
                upiAuthorizing={state.upiTapped && state.scene === "drive"}
                selectedUpi={state.selectedUpi}
                onRecharge={openSheet}
                onUpiTap={tapUpi}
                onReplay={reset}
              />
            </PhoneFrame>

            <VsDivider />

            <div className="flex w-full items-center justify-center py-1 text-center text-xs italic text-canvas/50 lg:hidden">
              ↓ Meanwhile, on the other phone… ↓
            </div>

            <PhoneFrame badge="Without our app" variant="bad" size="small" disaster={state.disasterShown}>
              <BadPhone
                distance={state.distance}
                scrollOffset={state.scrollOffset}
                roadWidth={roadWidths.alt}
                disasterShown={state.disasterShown}
              />
            </PhoneFrame>
          </div>
        </StagePlatform>

        <DemoTimeline scene={state.scene} progress={progress} timeLabel={timeLabel} />
      </main>

      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-10 text-center">
        <p className="text-xs text-canvas/50">
          Smart India Hackathon · Team Chinar · One driver · One recharge · One chain reaction prevented
        </p>
      </footer>

      <button
        type="button"
        onClick={() => {
          audio.unlock();
          toggleSound();
        }}
        aria-label="Toggle sound"
        className="fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full border border-white/12 bg-white/10 text-canvas shadow-lg backdrop-blur-md transition-transform hover:bg-white/18 active:scale-[0.96]"
      >
        {state.soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
      </button>
    </div>
  );
}
