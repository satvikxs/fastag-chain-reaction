"use client";

import { useCallback, useRef } from "react";

// useDemoAudio
export function useDemoAudio(soundOn: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    try {
      ctxRef.current = new AudioContext();
      unlockedRef.current = true;
    } catch {
      // no audio
    }
  }, []);

  const chime = useCallback(
    (notes: number[], dur = 0.18, type: OscillatorType = "sine", gain = 0.18) => {
      if (!soundOn || !ctxRef.current) return;
      const ctx = ctxRef.current;
      const now = ctx.currentTime;
      for (const [i, freq] of notes.entries()) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now + i * dur);
        g.gain.linearRampToValueAtTime(gain, now + i * dur + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + i * dur + dur);
        osc.connect(g).connect(ctx.destination);
        osc.start(now + i * dur);
        osc.stop(now + i * dur + dur + 0.02);
      }
    },
    [soundOn],
  );

  const alert = useCallback(() => chime([880, 740, 620], 0.16), [chime]);
  const success = useCallback(() => chime([523, 659, 784, 1046], 0.14, "triangle", 0.16), [chime]);
  const boop = useCallback(() => chime([1200], 0.08, "square", 0.12), [chime]);
  const scan = useCallback(() => chime([440, 554, 659], 0.1, "sine", 0.1), [chime]);

  const horn = useCallback(() => {
    if (!soundOn || !ctxRef.current) return;
    const ctx = ctxRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.5);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.05);
    g.gain.linearRampToValueAtTime(0.18, now + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }, [soundOn]);

  return { unlock, alert, success, boop, scan, horn };
}
