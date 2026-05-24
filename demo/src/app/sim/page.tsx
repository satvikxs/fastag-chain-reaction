"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const GtaView = dynamic(() => import("@/components/game/gta-view").then((m) => ({ default: m.GtaView })), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-[#040d1a]">
      <div className="text-center">
        <div className="text-2xl font-extrabold text-white">Loading Simulation</div>
        <div className="mt-2 text-sm text-white/40">Initializing 3D highway…</div>
      </div>
    </div>
  ),
});

export default function SimPage() {
  return (
    <div className="relative">
      <Link
        href="/"
        className="absolute left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-white/12 bg-black/40 px-3.5 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition-transform hover:bg-black/55 active:scale-[0.96]"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.5} />
        Landing
      </Link>
      <GtaView />
    </div>
  );
}
