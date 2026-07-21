"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#CCFF00", "#00FFB2", "#FF4D6D", "#00CFFF", "#FF9E00", "#C77DFF", "#FFFFFF"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

/**
 * Lightweight 8-bit confetti: chunky square particles on a canvas.
 * Mount it on success screens; it plays once for `duration` ms.
 */
export function Confetti({
  duration = 4000,
  count = 140,
}: {
  duration?: number;
  count?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const parts: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 2.4 * dpr,
      vy: (1 + Math.random() * 2.5) * dpr,
      size: (4 + Math.floor(Math.random() * 3) * 3) * dpr,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 1,
    }));

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = Math.max(0, 1 - elapsed / duration);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02 * dpr;
        // chunky stepped motion: snap to a 3px grid for 8-bit feel
        const gx = Math.round(p.x / 3) * 3;
        const gy = Math.round(p.y / 3) * 3;
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.fillRect(gx, gy, p.size, p.size);
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      }
      if (elapsed < duration) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [duration, count]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[90] h-full w-full"
      aria-hidden
    />
  );
}
