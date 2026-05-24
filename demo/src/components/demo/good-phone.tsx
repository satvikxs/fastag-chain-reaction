"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ShieldAlert, Zap } from "lucide-react";
import { BANKS, START_DISTANCE_KM, UPI_APPS, VEHICLE } from "@/lib/demo/constants";
import type { DemoScene } from "@/lib/demo/types";
import { easeOutCubic } from "@/lib/demo/utils";
import { HighwayMap } from "./highway-map";
import { PhoneStatusBar } from "./phone-frame";

type GoodPhoneProps = {
  scene: DemoScene;
  distance: number;
  scrollOffset: number;
  roadWidth: number;
  alertFired: boolean;
  balance: number;
  sheetOpen: boolean;
  upiAuthorizing: boolean;
  selectedUpi: string;
  onRecharge: () => void;
  onUpiTap: (name: string) => void;
  onReplay: () => void;
};

// useCountUp
function useCountUp(target: number, active: boolean, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const id = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / duration);
      setValue(Math.round(target * easeOutCubic(p)));
      if (p >= 1) window.clearInterval(id);
    }, 80);
    return () => window.clearInterval(id);
  }, [target, active, duration]);

  return value;
}

// ConfettiBurst
function ConfettiBurst() {
  const pieces = useMemo(
    () => {
      const palette = ["#F4A261", "#06A77D", "#0B2545", "#E63946"];
      return Array.from({ length: 24 }, (_, i) => ({
        left: `${(i * 17 + 7) % 100}%`,
        color: palette[i % palette.length],
        delay: `${(i % 8) * 0.06}s`,
      }));
    },
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece, i) => (
        <div
          key={i}
          className="confetti-piece absolute size-2"
          style={{
            left: piece.left,
            background: piece.color,
            clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            animationDelay: piece.delay,
          }}
        />
      ))}
    </div>
  );
}

// GeofenceBar
function GeofenceBar({ distance }: { distance: number }) {
  const pct = Math.min(100, ((START_DISTANCE_KM - distance) / START_DISTANCE_KM) * 100);
  const inZone = distance <= 5;

  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[9px] font-bold uppercase tracking-wider text-highway-2/60">
        <span>Toll approach</span>
        <span className={`font-mono-data tabular-nums ${inZone ? "text-danger" : "text-highway-2/60"}`}>
          {inZone ? "In 5 km zone" : `${distance.toFixed(1)} km left`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-highway/8">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${inZone ? "bg-gradient-to-r from-danger to-accent" : "bg-gradient-to-r from-highway to-highway-2"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// AlertBanner
function AlertBanner({ distance, visible }: { distance: number; visible: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ y: -120 }}
          animate={{ y: 56 }}
          exit={{ y: -120 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="absolute left-2 right-2 z-40 rounded-[18px] bg-gradient-to-br from-danger to-[#C92E3C] px-4 py-3.5 text-white shadow-[0_10px_30px_-8px_rgba(230,57,70,0.5)]"
        >
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
            <div>
              <div className="text-sm font-bold">Low FASTag Balance</div>
              <div className="text-xs font-medium opacity-95">
                Recharge before {VEHICLE.toll} Toll ({distance.toFixed(1)} km away).
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// DrivingCard
function DrivingCard({
  distance,
  balance,
  alertFired,
  onRecharge,
}: {
  distance: number;
  balance: number;
  alertFired: boolean;
  onRecharge: () => void;
}) {
  return (
    <div className="absolute bottom-[18px] left-3.5 right-3.5 rounded-[24px] bg-white/95 p-4 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.22),0_2px_8px_-2px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="mb-2.5 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-highway-2/70">Currently Driving</div>
          <div className="font-display mt-0.5 text-base font-extrabold text-highway">{VEHICLE.route}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-highway-2/70">Speed</div>
          <div className="font-mono-data mt-0.5 text-base font-extrabold text-highway">
            82 <span className="text-xs font-semibold">km/h</span>
          </div>
        </div>
      </div>

      <div className="my-2 h-px bg-highway/10" />

      <div className="mt-2 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-highway-2/70">FASTag Balance</div>
          <div className={`font-mono-data mt-0.5 text-2xl font-extrabold tabular-nums ${alertFired ? "balance-flash" : "text-highway"}`}>
            ₹{balance}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-highway-2/70">Next Toll</div>
          <div className="mt-0.5 text-sm font-bold text-highway">
            {VEHICLE.toll} · <span className="font-mono-data tabular-nums">{distance.toFixed(1)}</span> km
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="inline-flex items-center rounded-md border border-[#C9A93B] bg-[#F4D35E] px-2.5 py-1">
          <span className="font-mono-data text-xs font-extrabold text-highway">{VEHICLE.reg}</span>
        </div>
        <span className="text-xs font-semibold text-highway-2/70">{VEHICLE.model}</span>
      </div>

      <GeofenceBar distance={distance} />

      {alertFired ? (
        <motion.button
          type="button"
          onClick={onRecharge}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-accent to-[#E68A3D] px-4 py-3.5 text-[15px] font-extrabold text-[#1A0F00] shadow-[0_10px_24px_-8px_rgba(244,162,97,0.55)] transition-transform"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
        >
          <Zap className="size-4" strokeWidth={2.5} />
          Recharge ₹500 in 1 tap
        </motion.button>
      ) : null}
    </div>
  );
}

// BalanceCheckScene
function BalanceCheckScene() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-canvas to-[#EEF2F8]">
      <div className="relative flex h-full flex-col px-5 pt-14">
        <div className="text-center">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-highway-2/70">Geofence triggered</div>
          <h3 className="font-display mt-1 text-xl font-extrabold text-highway">Cross-bank readiness check</h3>
          <p className="mt-1 text-xs font-medium text-highway-2/80">Scanning all issuer wallets in parallel</p>
        </div>

        <div className="relative mt-6 space-y-2.5">
          <div className="absolute inset-x-4 top-0 h-full overflow-hidden opacity-30">
            <div className="scan-line h-8 w-full bg-gradient-to-b from-transparent via-accent to-transparent" />
          </div>

          {BANKS.map((bank, i) => (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.35, duration: 0.4 }}
              className="flex items-center gap-3 rounded-2xl border border-highway/8 bg-white p-3 shadow-sm"
            >
              <div
                className="flex size-10 items-center justify-center rounded-xl text-xs font-extrabold text-white"
                style={{ background: bank.color }}
              >
                {bank.initials}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-highway">{bank.name}</div>
                <div className="text-xs text-highway-2/70">Tag linked · {VEHICLE.reg}</div>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + i * 0.35, type: "spring" }}
                className="flex size-7 items-center justify-center rounded-full bg-success/15 text-success"
              >
                <Check className="size-4" strokeWidth={3} />
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-auto mb-8 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-center"
        >
          <div className="text-sm font-bold text-danger">Low balance detected · ₹47 remaining</div>
          <div className="mt-1 text-xs font-medium text-highway-2/80">Toll deduction ₹{VEHICLE.tollFee} will fail at plaza</div>
        </motion.div>
      </div>
    </div>
  );
}

// UpiSheet
function UpiSheet({
  open,
  authorizing,
  selectedUpi,
  onUpiTap,
}: {
  open: boolean;
  authorizing: boolean;
  selectedUpi: string;
  onUpiTap: (name: string) => void;
}) {
  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[45] bg-[rgba(11,14,20,0.55)] backdrop-blur-sm"
          />
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ y: open ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="absolute bottom-0 left-0 right-0 z-[46] rounded-t-[28px] bg-white px-[18px] pb-[22px] pt-[18px] shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.2)]"
      >
        <div className="mx-auto mb-3.5 h-1 w-[42px] rounded bg-[#D8DCE5]" />
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-highway-2/70">Top up FASTag · via UPI</div>

        <div className="mb-4 flex gap-2">
          {[200, 500, 1000].map((amt) => (
            <div
              key={amt}
              className={`relative flex-1 rounded-[14px] border-2 px-2 py-3 text-center ${
                amt === 500 ? "border-success bg-success/5" : "border-[#E5E8EE]"
              }`}
            >
              {amt === 500 ? (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-success px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
                  RECOMMENDED
                </div>
              ) : null}
              <div className="font-mono-data text-lg font-extrabold text-highway">₹{amt}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {UPI_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => onUpiTap(app.name)}
              className="flex w-full items-center gap-3 rounded-[14px] border border-[#EDEFF3] bg-white p-3 text-left transition active:scale-[0.98]"
            >
              <div className={`flex size-[38px] items-center justify-center rounded-[10px] text-sm font-extrabold ${app.className}`}>
                {app.initials}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-highway">{app.name}</div>
                <div className="text-xs text-highway-2/70">UPI · {app.handle}</div>
              </div>
              <span className="text-xl text-highway-2/40">›</span>
            </button>
          ))}
        </div>

        {authorizing ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#F3F5F9] p-3">
            <div className="size-5 animate-spin rounded-full border-[3px] border-highway/15 border-t-highway" />
            <div className="text-sm font-semibold text-highway">Authorizing ₹500 via {selectedUpi}…</div>
          </div>
        ) : null}
      </motion.div>
    </>
  );
}

// SuccessScene
function SuccessScene() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-gradient-to-b from-canvas to-[#ECF6F0]"
    >
      <ConfettiBurst />
      <div className="relative flex h-full flex-col items-center px-6 pb-6 pt-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex size-24 items-center justify-center rounded-full bg-success shadow-[0_12px_30px_-8px_rgba(6,167,125,0.45)]"
        >
          <Check className="size-12 text-white" strokeWidth={3.5} />
        </motion.div>
        <h2 className="font-display mt-5 text-2xl font-extrabold text-highway">Recharged ₹500</h2>
        <p className="mt-1 font-semibold text-highway-2">
          New Balance · <span className="font-mono-data font-extrabold text-success">₹547</span>
        </p>

        <div className="mt-6 w-full rounded-2xl border border-highway/5 bg-white p-4 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-highway-2/70">
            Suggested Lane · {VEHICLE.toll} Toll
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((lane) => (
              <div
                key={lane}
                className={`relative flex h-[46px] flex-1 items-center justify-center rounded-lg text-[11px] font-bold ${
                  lane === 4
                    ? "bg-gradient-to-br from-success to-[#04835E] text-white shadow-[0_8px_18px_-6px_rgba(6,167,125,0.55)]"
                    : "bg-[#EFF1F5] text-highway"
                }`}
              >
                {lane}
                {lane === 4 ? (
                  <span className="absolute -right-1 -top-2 rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-extrabold text-[#1A0F00]">
                    FAST
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs font-semibold text-success">Lane 4 · FASTEST — 12s avg wait</div>
        </div>

        <div className="mt-5 text-center">
          <div className="font-display text-base font-extrabold text-highway">You&apos;re cleared for {VEHICLE.toll} Toll.</div>
          <div className="mt-1 text-xs text-highway-2/70">Approaching in 3, 2, 1…</div>
        </div>
      </div>
    </motion.div>
  );
}
function TollScene() {
  const [tagRead, setTagRead] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setTagRead(true), 1600);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="absolute inset-0">
      <HighwayMap distance={0} scrollOffset={800} roadWidth={360} passingToll tagRead={tagRead} />

      {tagRead ? (
        <div className="absolute top-[28%] left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-full bg-success px-3 py-1.5 font-mono-data text-xs font-extrabold tabular-nums text-white shadow-[0_8px_20px_-4px_rgba(6,167,125,0.5)]">
            ✓ TAG READ · ₹{VEHICLE.tollFee} DEBITED
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-[18px] left-3.5 right-3.5 rounded-[24px] bg-white/95 p-4 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.22)] backdrop-blur-md">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-highway-2/70">Passing Through</div>
        <div className="font-display mt-0.5 text-base font-extrabold text-highway">{VEHICLE.toll} Toll · Lane 4</div>
        <div className="mt-1 text-xs text-highway-2">Tag scanned automatically. No stopping needed.</div>
      </div>
    </div>
  );
}

// StatScene
function StatScene({ onReplay }: { onReplay: () => void }) {
  const cars = useCountUp(180, true);
  const mins = useCountUp(9, true);
  const co2 = useCountUp(14, true);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-gradient-to-b from-canvas to-[#E8F3EC]"
    >
      <div className="relative flex h-full flex-col px-5 pb-5 pt-16">
        <div className="mb-4 text-center">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-success">Chain Reaction</div>
          <h2 className="font-display mt-1 text-2xl font-extrabold text-highway">Prevented.</h2>
        </div>

        <div className="rounded-[20px] bg-gradient-to-br from-success to-[#058564] p-5 text-white shadow-[0_14px_30px_-8px_rgba(6,167,125,0.45)]">
          <div className="space-y-4">
            <div>
              <div className="font-mono-data text-4xl font-extrabold tabular-nums">{cars}</div>
              <div className="mt-1 text-xs font-semibold opacity-90">cars not delayed behind you</div>
            </div>
            <div className="h-px bg-white/20" />
            <div>
              <div className="font-mono-data text-4xl font-extrabold tabular-nums">
                {mins} <span className="text-xl">min</span>
              </div>
              <div className="mt-1 text-xs font-semibold opacity-90">saved across the highway</div>
            </div>
            <div className="h-px bg-white/20" />
            <div>
              <div className="font-mono-data text-4xl font-extrabold tabular-nums">
                {co2} <span className="text-xl">kg CO₂</span>
              </div>
              <div className="mt-1 text-xs font-semibold opacity-90">emissions prevented</div>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <motion.button
            type="button"
            onClick={onReplay}
            whileTap={{ scale: 0.97 }}
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-[#E68A3D] px-4 py-3.5 text-[15px] font-extrabold text-[#1A0F00] shadow-[0_10px_24px_-8px_rgba(244,162,97,0.55)]"
          >
            ↻ Replay Demo
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// GoodPhone
export function GoodPhone({
  scene,
  distance,
  scrollOffset,
  roadWidth,
  alertFired,
  balance,
  sheetOpen,
  upiAuthorizing,
  selectedUpi,
  onRecharge,
  onUpiTap,
  onReplay,
}: GoodPhoneProps) {
  const showDrive = scene === "drive";
  const showAlert = alertFired && scene === "drive";

  return (
    <>
      <PhoneStatusBar />
      <AlertBanner distance={distance} visible={showAlert} />

      <AnimatePresence initial={false} mode="wait">
        {showDrive ? (
          <motion.div
            key="drive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <HighwayMap distance={distance} scrollOffset={scrollOffset} roadWidth={roadWidth} alerting={alertFired} />
            <DrivingCard distance={distance} balance={balance} alertFired={alertFired} onRecharge={onRecharge} />
          </motion.div>
        ) : null}

        {scene === "balance-check" ? (
          <motion.div key="check" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute inset-0">
            <BalanceCheckScene />
          </motion.div>
        ) : null}

        {scene === "success" ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
            <SuccessScene />
          </motion.div>
        ) : null}

        {scene === "toll" ? (
          <motion.div key="toll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
            <TollScene />
          </motion.div>
        ) : null}

        {scene === "stat" ? (
          <motion.div key="stat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0">
            <StatScene onReplay={onReplay} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <UpiSheet open={sheetOpen} authorizing={upiAuthorizing} selectedUpi={selectedUpi} onUpiTap={onUpiTap} />
    </>
  );
}
