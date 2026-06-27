'use client';

import { useEffect, useRef, useCallback } from 'react';

const COLORS = ['#8FAE8B', '#B5CDB2', '#C9A07B', '#F2F0EB', '#7BA3C9', '#B87BC9'];

export default function ConfettiCelebration({ trigger }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const runConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 100,
        w: 4 + Math.random() * 6,
        h: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        velocityY: 1.5 + Math.random() * 3,
        velocityX: (Math.random() - 0.5) * 3,
        opacity: 1,
        decay: 0.003 + Math.random() * 0.005,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive = true;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        p.y += p.velocityY;
        p.x += p.velocityX;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;
        p.velocityY += 0.05; // gravity
      }

      if (alive) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }

    animate();
  }, []);

  useEffect(() => {
    if (trigger) {
      runConfetti();
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [trigger, runConfetti]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className="confetti-container"
      style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 300 }}
    />
  );
}
