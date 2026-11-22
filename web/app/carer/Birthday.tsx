"use client";
import { useEffect, useRef, useState } from "react";

const COLOURS = ["#E8B4A0", "#C9A86A", "#8E3B2E", "#F2D7C9", "#A7B8A0", "#F6F4F0", "#D9A441"];
const SPARKS = ["#FFD27A", "#FF9F80", "#FFFFFF", "#9FE0C8", "#F7B6D2", "#FFE9B8"];
type Phase = "confetti" | "title" | "fireworks" | "done";

/**
 * A once-a-day birthday moment on the carer's home page: confetti falls from the top,
 * "Happy Birthday" drops onto the screen, then fireworks. Tap anywhere to close.
 */
export function Birthday({ name, day, preview = false }: { name: string; day: string; preview?: boolean }) {
  const [phase, setPhase] = useState<Phase | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  // Play once per device per birthday.
  useEffect(() => {
    const key = `kn-birthday-${day}`;
    if (preview) { setPhase("confetti"); return; }
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch { /* storage blocked: still play */ }
    setPhase("confetti");
  }, [day, preview]);

  useEffect(() => {
    if (!phase || phase === "done") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = [
      setTimeout(() => setPhase((p) => (p === "confetti" ? "title" : p)), 1200),
      setTimeout(() => setPhase((p) => (p === "title" ? "fireworks" : p)), 3200),
      setTimeout(() => setPhase("done"), 11000),
    ];
    if (reduced) return () => timers.forEach(clearTimeout);
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return () => timers.forEach(clearTimeout);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    addEventListener("resize", size);

    const W = () => innerWidth, H = () => innerHeight;
    const pick = () => COLOURS[Math.floor(Math.random() * COLOURS.length)];
    const confetti = Array.from({ length: Math.min(160, Math.round(W() / 4)) }, () => ({
      x: Math.random() * W(), y: -20 - Math.random() * H() * 0.8, w: 6 + Math.random() * 6, h: 8 + Math.random() * 10,
      vy: 1.6 + Math.random() * 2.2, vx: -0.6 + Math.random() * 1.2, r: Math.random() * Math.PI, vr: -0.1 + Math.random() * 0.2,
      sway: Math.random() * Math.PI * 2, c: pick(),
    }));
    type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string };
    let sparks: Spark[] = [];
    let rockets: { x: number; y: number; vy: number; top: number; c: string }[] = [];
    let lastLaunch = 0;
    const start = performance.now();
    let raf = 0;

    const tick = (t: number) => {
      const el = t - start;
      ctx.clearRect(0, 0, W(), H());
      // Confetti: falls for the whole show, thinning out.
      for (const p of confetti) {
        p.sway += 0.04; p.x += p.vx + Math.sin(p.sway) * 0.6; p.y += p.vy; p.r += p.vr;
        if (p.y > H() + 20 && el < 6000) { p.y = -20; p.x = Math.random() * W(); }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.sway)));
        ctx.restore();
      }
      // Fireworks: from 3.2s, a rocket every ~600ms until 9s.
      if (el > 3200 && el < 9500 && t - lastLaunch > 420) {
        lastLaunch = t;
        const c = SPARKS[Math.floor(Math.random() * SPARKS.length)];
        rockets.push({ x: W() * (0.12 + Math.random() * 0.76), y: H(), vy: -(10 + Math.random() * 3), top: H() * (0.12 + Math.random() * 0.35), c });
      }
      rockets = rockets.filter((r) => {
        r.y += r.vy; r.vy *= 0.985;
        ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2); ctx.fill();
        if (r.y > r.top) return true;
        const n = 90;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2, s = 2.5 + Math.random() * 4.5;
          sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: Math.random() < 0.3 ? "#FFF6E8" : r.c });
        }
        return false;
      });
      sparks = sparks.filter((s) => {
        s.x += s.vx; s.y += s.vy; s.vx *= 0.97; s.vy = s.vy * 0.97 + 0.06; s.life -= 0.011;
        ctx.globalAlpha = Math.max(0, s.life); ctx.fillStyle = s.c;
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        return s.life > 0;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); timers.forEach(clearTimeout); };
    // Runs once when the show starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === null || phase === "done"]);

  if (!phase || phase === "done") return null;
  return (
    <div className="bday" onClick={() => setPhase("done")} role="dialog" aria-label={`Happy birthday, ${name}`}>
      <canvas ref={canvas} className="bday-canvas" />
      {phase !== "confetti" && (
        <div className="bday-title">
          <span className="bday-eyebrow">Knightingale</span>
          <h1>Happy Birthday</h1>
          <p>{name}</p>
        </div>
      )}
      <span className="bday-close">Tap anywhere to close</span>
    </div>
  );
}
