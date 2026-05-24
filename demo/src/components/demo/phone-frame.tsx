"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ReactNode } from "react";

type PhoneFrameProps = {
  children: ReactNode;
  size?: "main" | "small";
  shake?: boolean;
  variant?: "good" | "bad";
  badge: string;
  glow?: boolean;
  disaster?: boolean;
};

// PhoneFrame
export function PhoneFrame({
  children,
  size = "main",
  shake,
  variant = "good",
  badge,
  glow,
  disaster,
}: PhoneFrameProps) {
  const isSmall = size === "small";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] ${
          variant === "good"
            ? "border border-success/35 bg-success/10 text-success shadow-[0_0_20px_-6px_rgba(6,167,125,0.5)]"
            : "border border-danger/35 bg-danger/10 text-danger"
        }`}
      >
        {variant === "good" ? (
          <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
        ) : (
          <XCircle className="size-3.5" strokeWidth={2.5} />
        )}
        {badge}
      </div>

      <div className="relative">
        {glow ? (
          <div className="pointer-events-none absolute -inset-6 rounded-[60px] bg-success/20 blur-2xl" />
        ) : null}
        {disaster ? (
          <div className="pointer-events-none absolute -inset-4 rounded-[50px] bg-danger/25 blur-xl animate-pulse" />
        ) : null}

        <motion.div
          className={`relative ${shake ? "phone-shake" : ""} ${
            isSmall
              ? "h-[560px] w-[280px] rounded-[42px] p-2.5"
              : "h-[720px] w-[360px] rounded-[52px] p-[13px]"
          } ${variant === "bad" && disaster ? "outline outline-2 outline-danger/50 outline-offset-3" : variant === "bad" ? "opacity-90" : ""}`}
          style={{
            background: "linear-gradient(145deg, #12151C 0%, #0B0E14 50%, #080A0F 100%)",
            boxShadow:
              variant === "good"
                ? "0 50px 100px -24px rgba(6,167,125,0.25), 0 40px 80px -20px rgba(11,37,69,0.55), inset 0 1px 0 rgba(255,255,255,0.08)"
                : "0 40px 80px -20px rgba(230,57,70,0.2), 0 14px 30px -12px rgba(11,37,69,0.30), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className={`pointer-events-none absolute inset-[7px] rounded-[45px] border border-white/[0.07] ${isSmall ? "inset-[5px] rounded-[36px]" : ""}`}
          />

          <div
            className={`absolute left-1/2 z-[60] flex -translate-x-1/2 items-center justify-center gap-1.5 bg-[#0B0E14] ${
              isSmall ? "top-2 h-6 w-[92px] rounded-[18px]" : "top-2.5 h-[30px] w-[118px] rounded-[22px]"
            }`}
          >
            <div className={`rounded-full bg-[#1a1f2b] ${isSmall ? "size-1.5" : "size-2"}`} />
            <div className={`rounded bg-[#1a1f2b] ${isSmall ? "h-1 w-8" : "h-1.5 w-10"}`} />
            <div className={`rounded-full bg-[#1a1f2b] ${isSmall ? "size-1.5" : "size-2"}`} />
          </div>

          <div
            className={`relative h-full w-full overflow-hidden bg-white ${isSmall ? "rounded-[32px]" : "rounded-[40px]"}`}
          >
            {children}
          </div>
        </motion.div>

        <div
          className={`pointer-events-none absolute -bottom-3 left-1/2 h-3 -translate-x-1/2 rounded-full blur-md ${
            variant === "good" ? "w-[70%] bg-success/20" : "w-[55%] bg-danger/15"
          }`}
        />
      </div>
    </div>
  );
}

// PhoneStatusBar
export function PhoneStatusBar({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`relative z-50 flex items-center justify-between font-semibold text-highway ${
        compact ? "h-9 px-[18px] text-[11px]" : "h-[46px] px-[26px] text-[13px]"
      }`}
    >
      <span className="font-mono-data tabular-nums">9:41 AM</span>
      <div className="flex items-center gap-1.5">
        <svg width={compact ? 14 : 16} height={compact ? 10 : 11} viewBox="0 0 16 11" aria-hidden>
          <g fill="#0B2545">
            <rect x="0" y="7" width="3" height="4" rx="0.5" />
            <rect x="4" y="5" width="3" height="6" rx="0.5" />
            <rect x="8" y="3" width="3" height="8" rx="0.5" />
            <rect x="12" y="0" width="3" height="11" rx="0.5" />
          </g>
        </svg>
        <svg width={compact ? 22 : 26} height={compact ? 10 : 12} viewBox="0 0 26 12" aria-hidden>
          <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" fill="none" stroke="#0B2545" opacity="0.6" />
          <rect x="2" y="2" width="18" height="8" rx="1" fill="#0B2545" />
        </svg>
      </div>
    </div>
  );
}

// AppLogo
export function AppLogo({ size = 44 }: { size?: number }) {
  return (
    <Image
      src="/logo-mark.svg"
      alt="FASTag Chain Reaction"
      width={size}
      height={size}
      className="rounded-xl outline outline-1 outline-white/10"
      priority
    />
  );
}
