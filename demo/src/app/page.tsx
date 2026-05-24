"use client";

import dynamic from "next/dynamic";

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

export default function Home() {
  return <GtaView />;
}
