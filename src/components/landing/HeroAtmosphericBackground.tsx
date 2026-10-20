import React, { useEffect, useRef } from 'react';

export const HeroAtmosphericBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Warm, calm floating particles (subtle 3D depth, soft amber and terracotta tones, zero neon)
    interface Particle {
      x: number;
      y: number;
      z: number; // depth
      radius: number;
      baseAlpha: number;
      vy: number;
      vx: number;
      color: string;
    }

    const warmColors = [
      'rgba(212, 136, 59, ',  // warm honey amber
      'rgba(184, 93, 54, ',   // terracotta
      'rgba(235, 214, 186, ', // soft linen
      'rgba(163, 116, 73, ',  // warm brass
    ];

    const particles: Particle[] = Array.from({ length: 42 }, () => {
      const z = Math.random() * 3 + 1; // 1 to 4 depth factor
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        radius: (Math.random() * 2.5 + 1.2) * (1 / (z * 0.4)),
        baseAlpha: Math.random() * 0.25 + 0.1,
        vy: -(Math.random() * 0.35 + 0.15) / z,
        vx: (Math.random() - 0.5) * 0.2 / z,
        color: warmColors[Math.floor(Math.random() * warmColors.length)],
      };
    });

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle warm radial gradient following mouse gently
      const gradient = ctx.createRadialGradient(
        mouseX,
        mouseY,
        50,
        mouseX,
        mouseY,
        width * 0.7
      );
      gradient.addColorStop(0, 'rgba(235, 214, 186, 0.08)');
      gradient.addColorStop(0.5, 'rgba(184, 93, 54, 0.03)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw 3D depth particles
      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;

        // Wrap around boundaries
        if (p.y < -20) p.y = height + 20;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        // Subtle 3D parallax shift based on mouse position and depth z
        const parallaxX = (mouseX - width / 2) * (0.015 / p.z);
        const parallaxY = (mouseY - height / 2) * (0.015 / p.z);

        ctx.beginPath();
        ctx.arc(p.x + parallaxX, p.y + parallaxY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.baseAlpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Subtle, looping ambient video: warm artisanal culinary atmosphere */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-25 filter blur-[1px] saturate-75 mix-blend-multiply"
        poster="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80"
      >
        <source
          src="https://assets.mixkit.co/videos/preview/mixkit-steaming-cup-of-coffee-41845-large.mp4"
          type="video/mp4"
        />
      </video>

      {/* Warm natural gradients layering (no harsh neon, purely organic) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/85 via-[#F6F1EA]/80 to-[#FAF8F5]" />

      {/* Interactive 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};
