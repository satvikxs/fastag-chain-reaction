"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const CYCLE = ["wave", "jam", "queue", "stall"] as const;
const spring = { type: "spring" as const, duration: 0.3, bounce: 0 };

// LandingPage
export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#111] antialiased">
      <div className="mx-auto max-w-[640px] px-6 pb-24 pt-10 sm:pt-16">
        <LandingHeader />
        <LandingIntro />
        <ProjectBadge />
        <ProductFrame />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <BuiltSection />
        <CompareSection />
        <DemoLinks />
        <LandingFooter />
      </div>
    </div>
  );
}

// SectionLabel
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="font-display text-2xl italic tracking-tight text-[#111] sm:text-[1.65rem]">{children}</p>
  );
}

// LandingHeader
function LandingHeader() {
  return (
    <header className="mb-12">
      <Link href="/" className="inline-block">
        <Image
          src="/logo-mono.svg"
          alt="FASTag Chain Reaction"
          width={40}
          height={40}
          className="rounded-lg outline outline-1 -outline-offset-1 outline-black/10"
          priority
        />
      </Link>
    </header>
  );
}

// LandingIntro
function LandingIntro() {
  const [word, setWord] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setWord((w) => (w + 1) % CYCLE.length), 3200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="top">
      <p className="text-pretty text-[15px] leading-[1.7] text-[#111] sm:text-base">
        Hi! We&apos;re{" "}
        <span className="font-semibold">FASTag Chain Reaction</span> — a college project for Smart India
        Hackathon (Team Chinar). We built a phone app that stops toll-plaza traffic jams before they form on
        the Srinagar–Jammu corridor (NH-44).
      </p>
      <p className="mt-5 text-pretty text-[15px] leading-[1.7] text-[#111] sm:text-base">
        One car with low FASTag balance at the boom can stall for 90 seconds. That single stop queues dozens
        of vehicles and sends a shockwave backward up the highway. We catch the failure{" "}
        <span className="font-semibold">5 km before the toll</span> — so the driver recharges on open road
        and the{" "}
        <span className="relative inline-grid h-[1.2em] w-[5.5ch] align-bottom">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={CYCLE[word]}
              className="col-start-1 row-start-1 whitespace-nowrap font-semibold underline decoration-[#111]/25 underline-offset-4"
              initial={{ opacity: 0, y: 6, filter: "blur(4px)", scale: 0.25 }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, y: -4, filter: "blur(4px)", scale: 0.25 }}
              transition={spring}
            >
              {CYCLE[word]}
            </motion.span>
          </AnimatePresence>
        </span>{" "}
        never starts.
      </p>
    </section>
  );
}

// ProjectBadge
function ProjectBadge() {
  return (
    <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#666]">
      <span>Smart India Hackathon</span>
      <span>Theme: Chain Reaction</span>
      <span>Team Chinar</span>
      <span>NH-44 · Lakhanpur Toll</span>
    </div>
  );
}

// ProductFrame
function ProductFrame() {
  return (
    <section className="my-14 sm:my-16">
      <p className="mb-4 text-[13px] text-[#666]">App preview — 5 km warning at Lakhanpur</p>
      <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-[#fafafa] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-4">
        <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

// PhoneMockup
function PhoneMockup() {
  return (
    <div className="mx-auto max-w-[280px] py-2">
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-[11px] text-[#666]">
          <span className="font-mono-data tabular-nums">9:41</span>
          <span className="uppercase tracking-wider">FASTag Guard</span>
        </div>
        <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.14em] text-[#999]">Approaching</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">Lakhanpur Toll</p>
        <p className="mt-1 text-xs text-[#666]">5 km · NH-44 · JK 01 AB 1234</p>
      </div>

      <div className="mt-5 space-y-2.5 px-5 pb-6">
        <div className="rounded-lg border border-black/[0.08] bg-[#fafafa] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#666]">Low balance</p>
          <p className="mt-1.5 text-sm font-semibold">₹47 available · ₹95 needed</p>
          <div className="mt-3 rounded-md bg-[#111] py-2.5 text-center text-xs font-semibold text-white">
            Recharge ₹500
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-black/[0.06] px-4 py-3 text-xs">
          <span className="text-[#666]">After top-up</span>
          <span className="font-mono-data font-semibold tabular-nums">₹547</span>
        </div>
        <div className="rounded-lg border border-black/[0.06] px-4 py-3 text-xs font-medium text-[#444]">
          Ready for toll · 0 cars queued
        </div>
      </div>
    </div>
  );
}

// ProblemSection
function ProblemSection() {
  return (
    <section id="problem" className="border-t border-black/[0.08] pt-12">
      <SectionLabel>the problem</SectionLabel>
      <p className="mt-6 text-pretty text-[15px] leading-[1.7] text-[#111]">
        You&apos;re on NH-44. Traffic is moving — then it isn&apos;t. No accident, no construction. Often
        one car reached the FASTag lane with insufficient balance. The boom didn&apos;t lift. The driver
        opened an app, tried to recharge — 90 seconds stopped in a high-throughput lane.
      </p>
      <p className="mt-4 text-pretty text-[15px] leading-[1.7] text-[#666]">
        Behind that car, a queue forms. Each vehicle brakes harder than the last. The disturbance travels
        backward at ~20 km/h while the highway keeps feeding cars in. NHAI links 12–15% of highway
        congestion to toll plazas; ~30% of those stops are low-balance failures.
      </p>

      <ul className="mt-8 space-y-0">
        {[
          { label: "Trigger", value: "1 stalled car", note: "Low balance, blacklist, or scan failure at boom" },
          { label: "Queue in 90s", value: "71 vehicles", note: "From our Nagel-Schreckenberg traffic simulator" },
          { label: "Slowdown", value: "3.1 min", note: "Residual wave upstream after trigger clears" },
        ].map((row, i) => (
          <li key={row.label} className={`border-t border-black/[0.08] py-4 ${i === 0 ? "border-t-0 pt-0" : ""}`}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15px] font-medium">{row.label}</span>
              <span className="font-mono-data shrink-0 text-right text-[13px] font-semibold tabular-nums">{row.value}</span>
            </div>
            <p className="mt-1.5 text-[13px] text-[#666]">{row.note}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-pretty text-[14px] leading-[1.65] text-[#666]">
        Paytm, ICICI, HDFC, and NPCI SMS warn about balance — but none know you&apos;re 4 minutes from
        Lakhanpur. Existing alerts are threshold-based, not location-based.
      </p>
    </section>
  );
}

// SolutionSection
function SolutionSection() {
  return (
    <section id="solution" className="mt-16 border-t border-black/[0.08] pt-12">
      <SectionLabel>our solution</SectionLabel>
      <p className="mt-6 text-pretty text-[15px] leading-[1.7] text-[#111]">
        FASTag Chain Reaction is a phone app that knows where toll plazas are, knows where you are, and{" "}
        <span className="font-semibold">5 km out</span> checks every failure mode in parallel — balance,
        blacklist, KYC expiry, and vehicle-class match.
      </p>
      <p className="mt-4 text-pretty text-[15px] leading-[1.7] text-[#666]">
        If anything is wrong, it alerts you loudly enough to fix it on the next stretch of open road — not
        at the boom barrier. Recharge at 5 km and you&apos;re invisible to the queue. Recharge at the boom
        and you <em>are</em> the queue.
      </p>
      <p className="mt-4 text-pretty text-[14px] leading-[1.65] text-[#666]">
        Our simulator shows ~4% of drivers using pre-warnings is enough to stop the cascade — you don&apos;t
        need to fix every car, just remove enough sparks that the chain reaction never starts.
      </p>
    </section>
  );
}

// HowItWorksSection
function HowItWorksSection() {
  const steps = [
    { n: "01", title: "GPS ping", body: "Phone reports position every few seconds on active trips." },
    { n: "02", title: "Geofence", body: "5 km radius around Lakhanpur, Sarore, Bann, Lower Munda fires alert." },
    { n: "03", title: "Cross-bank check", body: "Balance, KYC, blacklist across HDFC, ICICI, SBI, Paytm in parallel." },
    { n: "04", title: "UPI recharge", body: "One tap via PhonePe, GPay, or Paytm. ₹47 → ₹547 before the booth." },
  ];

  return (
    <section id="how" className="mt-16 border-t border-black/[0.08] pt-12">
      <SectionLabel>how it works</SectionLabel>
      <ul className="mt-8 space-y-0">
        {steps.map((step, i) => (
          <li key={step.n} className={`border-t border-black/[0.08] py-5 ${i === 0 ? "border-t-0 pt-0" : ""}`}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono-data text-xs font-bold tabular-nums text-[#999]">{step.n}</span>
              <span className="text-[15px] font-medium">{step.title}</span>
            </div>
            <p className="mt-2 pl-7 text-pretty text-[13px] leading-relaxed text-[#666]">{step.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// BuiltSection
function BuiltSection() {
  const items = [
    { left: "Traffic simulator", right: "A/B scenarios", note: "Nagel-Schreckenberg model · backward wave propagation" },
    { left: "Geofence engine", right: "Offline GPS", note: "NHAI toll coordinates · 5 km radius alerts" },
    { left: "Cross-bank API", right: "4 issuers", note: "Balance · KYC · blacklist · vehicle class" },
    { left: "UPI deep-link", right: "No gateway", note: "PhonePe · GPay · Paytm one-tap recharge" },
    { left: "Wait-time ML", right: "Plaza health", note: "Congestion model from corridor data" },
    { left: "Interactive demos", right: "3D + phone", note: "Highway sim and side-by-side A/B timeline" },
  ];

  return (
    <section id="built" className="mt-16 border-t border-black/[0.08] pt-12">
      <SectionLabel>what we built</SectionLabel>
      <p className="mt-6 text-pretty text-[14px] leading-[1.65] text-[#666]">
        Full stack for the hackathon — simulator, app mockup, geofence logic, ML model, backend specs, and
        two live demos you can try below.
      </p>
      <ul className="mt-8 space-y-0">
        {items.map((row, i) => (
          <li key={row.left} className={`border-t border-black/[0.08] py-5 ${i === 0 ? "border-t-0 pt-0" : ""}`}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15px] font-medium">{row.left}</span>
              <span className="shrink-0 text-right text-[13px] text-[#666]">{row.right}</span>
            </div>
            <p className="mt-2 text-pretty text-[13px] leading-relaxed text-[#666]">{row.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// CompareSection
function CompareSection() {
  return (
    <section id="compare" className="mt-16 border-t border-black/[0.08] pt-12">
      <SectionLabel>with vs without</SectionLabel>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/[0.08] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#666]">Without app</p>
          <p className="font-mono-data mt-3 text-4xl font-bold tabular-nums">71</p>
          <p className="mt-1 text-sm font-medium">cars queued</p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#666]">
            Driver discovers low balance at boom. 90 sec stall. Wave propagates upstream.
          </p>
        </div>
        <div className="rounded-xl border border-black/[0.08] bg-[#fafafa] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#666]">With app</p>
          <p className="font-mono-data mt-3 text-4xl font-bold tabular-nums">0</p>
          <p className="mt-1 text-sm font-medium">chain reactions</p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#666]">
            Alert at 5 km. UPI recharge on open road. Boom lifts on first scan.
          </p>
        </div>
      </div>
    </section>
  );
}

// DemoLinks
function DemoLinks() {
  return (
    <section id="demo" className="mt-16 border-t border-black/[0.08] pt-12">
      <SectionLabel>try the demos</SectionLabel>
      <p className="mt-6 text-pretty text-[14px] leading-[1.65] text-[#666]">
        Two interactive demos built for judges and stakeholders — toggle chain-reaction guard in 3D, or
        watch the same driver on two phones.
      </p>
      <div className="mt-8 space-y-3">
        <Link
          href="/sim"
          className="group flex min-h-11 items-center justify-between rounded-lg border border-black/[0.08] px-4 py-3 text-sm font-medium transition-[background-color,transform] hover:bg-[#fafafa] active:scale-[0.96]"
        >
          3D highway simulation
          <span className="text-[#999] transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
        <Link
          href="/demo"
          className="group flex min-h-11 items-center justify-between rounded-lg border border-black/[0.08] px-4 py-3 text-sm font-medium transition-[background-color,transform] hover:bg-[#fafafa] active:scale-[0.96]"
        >
          Phone A/B demo
          <span className="text-[#999] transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </section>
  );
}

// LandingFooter
function LandingFooter() {
  return (
    <footer className="mt-20 border-t border-black/[0.08] pt-8">
      <p className="text-[13px] leading-relaxed text-[#666]">
        Smart India Hackathon · Team Chinar · Theme: Chain Reaction
        <br />
        NH-44 Srinagar–Jammu · Lakhanpur Toll Plaza
      </p>
      <p className="mt-4 text-[13px] text-[#999]">
        One driver · One recharge · One chain reaction prevented
      </p>
      <a
        href="#top"
        className="mt-4 inline-flex min-h-10 items-center text-[13px] text-[#666] underline decoration-[#111]/20 underline-offset-4 transition-colors hover:text-[#111]"
      >
        Back to top
      </a>
    </footer>
  );
}
