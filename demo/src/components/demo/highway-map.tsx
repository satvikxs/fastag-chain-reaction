"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { CAR_CONFIG, VEHICLE } from "@/lib/demo/constants";
import { tollScale } from "@/lib/demo/utils";

type HighwayMapProps = {
  distance: number;
  scrollOffset: number;
  roadWidth: number;
  alerting?: boolean;
  compact?: boolean;
  passingToll?: boolean;
  tagRead?: boolean;
};

const ROAD_TOP = "55%";
const ROAD_H = 96;

// CarSvg
function CarSvg({
  body,
  roof,
  kind = "sedan",
  scale = 1,
}: {
  body: string;
  roof: string;
  kind?: "sedan" | "suv" | "hatch";
  scale?: number;
}) {
  const w = kind === "suv" ? 28 : kind === "hatch" ? 20 : 24;
  const h = kind === "suv" ? 16 : 14;

  return (
    <svg width={w * scale} height={h * scale} viewBox="0 0 28 16" aria-hidden style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}>
      <ellipse cx="14" cy="14.5" rx="12" ry="1.2" fill="rgba(0,0,0,0.12)" />
      <rect x="2" y="7" width="24" height="7" rx="2" fill={body} />
      {kind === "suv" ? (
        <>
          <rect x="4" y="2" width="20" height="7" rx="2" fill={roof} />
          <rect x="6" y="3.5" width="6" height="4" rx="0.5" fill="rgba(255,255,255,0.5)" />
          <rect x="16" y="3.5" width="6" height="4" rx="0.5" fill="rgba(255,255,255,0.5)" />
        </>
      ) : (
        <>
          <rect x="5" y="3" width="18" height="5.5" rx="1.5" fill={roof} />
          <rect x="6.5" y="4" width="5.5" height="3.5" rx="0.5" fill="rgba(255,255,255,0.45)" />
          <rect x="16" y="4" width="5.5" height="3.5" rx="0.5" fill="rgba(255,255,255,0.45)" />
        </>
      )}
      <circle cx="8" cy="14" r="2.2" fill="#1A1F2B" />
      <circle cx="20" cy="14" r="2.2" fill="#1A1F2B" />
      <circle cx="8" cy="14" r="1" fill="#3A4050" />
      <circle cx="20" cy="14" r="1" fill="#3A4050" />
    </svg>
  );
}

// PlayerSumo
function PlayerSumo() {
  return (
    <div className="relative">
      <div className="absolute -inset-5 rounded-full border-2 border-highway/25 pulse-ring" />
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-highway px-1.5 py-0.5 text-[8px] font-extrabold tracking-wide text-white shadow-md">
        YOU
      </div>
      <svg width={32} height={18} viewBox="0 0 32 18" aria-hidden style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.4))" }}>
        <ellipse cx="16" cy="16" rx="14" ry="1.4" fill="rgba(0,0,0,0.15)" />
        <rect x="2" y="8" width="28" height="8" rx="2" fill="#0B2545" />
        <rect x="5" y="3" width="22" height="7" rx="2" fill="#13315C" />
        <rect x="7" y="4.5" width="8" height="5" rx="0.5" fill="#7FB3D5" />
        <rect x="17" y="4.5" width="8" height="5" rx="0.5" fill="#7FB3D5" />
        <circle cx="9" cy="16" r="2.5" fill="#1A1F2B" />
        <circle cx="23" cy="16" r="2.5" fill="#1A1F2B" />
        <rect x="26" y="10" width="4" height="2.5" rx="0.5" fill="#F4A261" />
      </svg>
    </div>
  );
}

// TollPlaza
function TollPlaza({
  scale,
  alerting,
  distance,
  compact,
  passing,
  tagRead,
}: {
  scale: number;
  alerting?: boolean;
  distance: number;
  compact?: boolean;
  passing?: boolean;
  tagRead?: boolean;
}) {
  const label = compact ? "TOLL" : VEHICLE.toll.toUpperCase();

  return (
    <div
      className="absolute z-[7] transition-transform duration-500 ease-out"
      style={{
        top: `calc(${ROAD_TOP} - 8px)`,
        right: compact ? 8 : 12,
        transform: `scale(${scale})`,
        transformOrigin: "right center",
      }}
    >
      {alerting ? <div className="absolute -inset-4 rounded-2xl border-[3px] border-danger toll-pulse" /> : null}

      <svg viewBox="0 0 120 100" width={compact ? 88 : 112} height={compact ? 73 : 93} aria-hidden>
        <defs>
          <linearGradient id="gantry" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#13315C" />
            <stop offset="100%" stopColor="#0B2545" />
          </linearGradient>
        </defs>

        {/* gantry */}
        <rect x="4" y="8" width="112" height="7" rx="2" fill="url(#gantry)" />
        <rect x="8" y="15" width="5" height="28" fill="#0B2545" />
        <rect x="107" y="15" width="5" height="28" fill="#0B2545" />

        {/* sign */}
        <rect x="28" y="18" width="64" height="16" rx="2" fill="#FAFAF7" stroke="#0B2545" strokeWidth="1.5" />
        <text x="60" y="29" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0B2545" fontFamily="system-ui">
          {label}
        </text>

        {/* lanes + barriers */}
        {[0, 1, 2, 3, 4, 5].map((lane) => {
          const x = 14 + lane * 15;
          const isFast = lane === 3 && !compact;
          const barrierUp = passing && lane === 3;
          return (
            <g key={lane}>
              <rect x={x} y="38" width="12" height="38" rx="1" fill={isFast ? "#E8F5EF" : "#EFF1F5"} stroke="#CBD5E1" strokeWidth="0.5" />
              <rect x={x + 1} y="42" width="10" height="3" rx="0.5" fill={isFast ? "#06A77D" : "#94A3B8"} opacity={isFast ? 0.9 : 0.6} />
              <g transform={barrierUp ? `rotate(-55 ${x + 2} 52)` : undefined}>
                <rect x={x + 2} y="52" width="8" height="3" rx="0.5" fill="#E63946" />
              </g>
            </g>
          );
        })}

        {/* booth */}
        <rect x="2" y="52" width="14" height="22" rx="2" fill="#13315C" />
        <rect x="4" y="56" width="10" height="8" rx="1" fill="#7FB3D5" opacity="0.7" />

        {/* rfid arch */}
        <path d="M 90 38 Q 105 38 105 52" fill="none" stroke="#06A77D" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="105" cy="52" r="3" fill="#06A77D" />
      </svg>

      {!compact && !passing ? (
        <div className="absolute -bottom-1 right-0 rounded-lg bg-highway px-2 py-1 shadow-[0_4px_12px_-2px_rgba(11,37,69,0.45)]">
          <span className="font-mono-data text-[10px] font-bold tabular-nums text-white">{distance.toFixed(1)} km</span>
        </div>
      ) : null}

      {tagRead ? (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-success px-2 py-1 font-mono-data text-[8px] font-extrabold text-white shadow-[0_4px_12px_-2px_rgba(6,167,125,0.55)]">
          TAG READ
        </div>
      ) : null}
    </div>
  );
}

// PassingPlayer
function PassingPlayer({ tagRead }: { tagRead?: boolean }) {
  const [driving, setDriving] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setDriving(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="absolute z-[5] -translate-y-1/2 transition-[left] duration-[3s] ease-[cubic-bezier(0.4,0.05,0.4,1)] will-change-transform"
      style={{ top: `calc(${ROAD_TOP} + 48px)`, left: driving ? "62%" : "24%" }}
    >
      <PlayerSumo />
    </div>
  );
}

// TrafficLayer
function TrafficLayer({ scrollOffset, roadWidth, compact }: { scrollOffset: number; roadWidth: number; compact?: boolean }) {
  return (
    <>
      {CAR_CONFIG.map((car, i) => {
        const wrapped = ((car.base / 100) * roadWidth - scrollOffset) % roadWidth;
        const x = (wrapped + roadWidth) % roadWidth;
        const kind: "sedan" | "suv" | "hatch" = i % 3 === 0 ? "suv" : i % 2 === 0 ? "sedan" : "hatch";
        const laneY = car.lane === 0 ? (compact ? 16 : 20) : compact ? 48 : 56;

        return (
          <div key={i} className="absolute will-change-transform" style={{ top: laneY, left: x }}>
            <CarSvg body={car.color} roof={car.roof} kind={kind} scale={compact ? 0.85 : 1} />
          </div>
        );
      })}
    </>
  );
}

// HighwayMap
function HighwayMapInner({
  distance,
  scrollOffset,
  roadWidth,
  alerting,
  compact,
  passingToll,
  tagRead,
}: HighwayMapProps) {
  const scale = tollScale(distance);
  const dashSpeed = (1.4 / (distance > 3 ? 1 : distance > 1 ? 1.5 : 2.5)).toFixed(2);
  const showGeofence = distance <= 5.5 && distance > 0 && !passingToll;
  const approachPct = useMemo(
    () => Math.min(100, ((8 - distance) / 8) * 100),
    [distance],
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#8EB4D9] via-[#B8D4E8] to-[#C8DBB5]" />
      <div className="absolute left-[15%] top-[8%] size-14 rounded-full bg-[#FFE8B0]/80 blur-sm" />

      {/* mountains */}
      <svg className="absolute bottom-[32%] left-0 w-full opacity-50" viewBox="0 0 360 140" preserveAspectRatio="none" aria-hidden>
        <path d="M0 140 L0 90 L50 45 L100 75 L160 25 L220 60 L280 15 L340 50 L360 70 L360 140 Z" fill="#6B8F71" />
        <path d="M0 140 L0 110 L80 85 L150 95 L240 65 L360 80 L360 140 Z" fill="#5A7D60" opacity="0.75" />
      </svg>

      {/* trees */}
      {!compact ? (
        <>
          {[12, 48, 290, 320].map((x, i) => (
            <div key={x} className="absolute top-[22%]" style={{ left: x }}>
              <div className="size-0 border-x-[6px] border-b-[16px] border-x-transparent border-b-[#3D6B45]" style={{ opacity: 0.5 + (i % 2) * 0.2 }} />
              <div className="mx-auto h-3 w-1 rounded-sm bg-[#5C4033]/60" />
            </div>
          ))}
        </>
      ) : null}

      {/* geofence */}
      {showGeofence && !compact ? (
        <div
          className="absolute left-1/2 z-[2] -translate-x-1/2 rounded-full border-2 border-dashed border-accent/55"
          style={{ top: `calc(${ROAD_TOP} + 20px)`, width: 150, height: 80 }}
        />
      ) : null}

      {/* road bed + shoulders */}
      <div
        className="absolute -left-[12%] w-[124%] -rotate-[2.5deg]"
        style={{ top: `calc(${ROAD_TOP} - 14px)`, height: ROAD_H + 28 }}
      >
        <div className="absolute inset-0 rounded-sm bg-[#5A7248]/80" />
        <div
          className="absolute inset-x-[6%] inset-y-[10px] rounded-[3px] bg-gradient-to-b from-[#454B58] via-[#2E3340] to-[#1A1E26]"
          style={{ boxShadow: "0 8px 24px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)" }}
        >
          {/* edge lines */}
          <div className="absolute top-2.5 left-0 right-0 h-[2px] bg-white/70" />
          <div className="absolute bottom-2.5 left-0 right-0 h-[2px] bg-white/70" />

          {/* center dashes */}
          <div
            className="road-flow absolute top-1/2 h-[3px] w-full -translate-y-1/2 opacity-90"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, #F4D35E 0 32px, transparent 32px 58px)",
              animationDuration: `${dashSpeed}s`,
            }}
          />

          {/* lane dividers */}
          <div className="absolute top-[35%] left-0 right-0 h-px bg-white/15" />
          <div className="absolute top-[65%] left-0 right-0 h-px bg-white/15" />
        </div>
      </div>

      {/* traffic */}
      <div
        className="absolute -left-[12%] w-[124%] -rotate-[2.5deg] pointer-events-none z-[4]"
        style={{ top: ROAD_TOP, height: ROAD_H }}
      >
        <TrafficLayer scrollOffset={scrollOffset} roadWidth={roadWidth} compact={compact} />
      </div>

      {/* player */}
      {!passingToll ? (
        <div
          className="absolute left-1/2 z-[5] -translate-x-1/2 -translate-y-1/2"
          style={{ top: `calc(${ROAD_TOP} + 52px)` }}
        >
          <PlayerSumo />
        </div>
      ) : (
        <PassingPlayer />
      )}

      <TollPlaza
        scale={scale}
        alerting={alerting}
        distance={distance}
        compact={compact}
        passing={passingToll}
        tagRead={tagRead}
      />

      {/* approach strip */}
      {!compact && !passingToll ? (
        <div className="absolute bottom-[23%] left-4 right-4">
          <div className="mb-1 flex justify-between text-[9px] font-bold uppercase tracking-wider text-highway/70">
            <span>NH-44</span>
            <span className="font-mono-data tabular-nums">{distance.toFixed(1)} km to plaza</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-highway/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-highway to-accent transition-[width] duration-300 ease-out"
              style={{ width: `${approachPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* gps pill */}
      {!compact ? (
        <div className="absolute bottom-[19%] left-4 flex items-center gap-1.5 rounded-2xl bg-white/90 px-3 py-2 shadow-[0_4px_16px_-4px_rgba(11,37,69,0.25)] backdrop-blur-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="text-[10px] font-semibold text-highway">GPS locked · geofence active</span>
        </div>
      ) : null}
    </div>
  );
}

export const HighwayMap = memo(HighwayMapInner);
