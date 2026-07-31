import { useEffect, useRef } from "react";

function createParticle(width, height, intensity) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * intensity,
    vy: (Math.random() - 0.5) * intensity,
    radius: Math.random() * 1.6 + 0.5
  };
}

export default function BackgroundFX() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });

    if (!canvas || !context) {
      return undefined;
    }

    let animationFrameId = 0;
    let resizeFrameId = 0;
    let width = 0;
    let height = 0;
    let particles = [];
    let running = false;
    const pointer = { x: 0, y: 0, active: false };
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const drawParticles = () => {
      context.clearRect(0, 0, width, height);

      particles.forEach((particle, particleIndex) => {
        if (running) {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x <= 0 || particle.x >= width) {
            particle.vx *= -1;
          }

          if (particle.y <= 0 || particle.y >= height) {
            particle.vy *= -1;
          }

          if (pointer.active) {
            const distanceX = particle.x - pointer.x;
            const distanceY = particle.y - pointer.y;
            const distance = Math.hypot(distanceX, distanceY);

            if (distance < 140) {
              particle.x += (distanceX / Math.max(distance, 1)) * 0.34;
              particle.y += (distanceY / Math.max(distance, 1)) * 0.34;
            }
          }
        }

        context.beginPath();
        context.fillStyle = particleIndex % 3 === 0 ? "rgba(0, 245, 255, 0.52)" : "rgba(124, 58, 237, 0.34)";
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      const connectionDistance = width < 1024 ? 92 : 122;
      for (let index = 0; index < particles.length; index += 1) {
        for (let innerIndex = index + 1; innerIndex < particles.length; innerIndex += 1) {
          const particleA = particles[index];
          const particleB = particles[innerIndex];
          const distance = Math.hypot(particleA.x - particleB.x, particleA.y - particleB.y);

          if (distance < connectionDistance) {
            context.strokeStyle = `rgba(34, 211, 238, ${0.1 - distance / 1600})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(particleA.x, particleA.y);
            context.lineTo(particleB.x, particleB.y);
            context.stroke();
          }
        }
      }
    };

    const drawFrame = () => {
      drawParticles();

      if (running) {
        animationFrameId = window.requestAnimationFrame(drawFrame);
      }
    };

    const configureCanvas = () => {
      window.cancelAnimationFrame(animationFrameId);
      const compact = window.innerWidth < 768;
      const prefersReducedMotion = motionQuery.matches;
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = compact || prefersReducedMotion ? 62000 : 34000;
      const maxParticles = compact ? 30 : 68;
      const minParticles = compact ? 14 : 24;
      const particleCount = Math.max(minParticles, Math.min(maxParticles, Math.floor((width * height) / density)));
      const intensity = compact || prefersReducedMotion ? 0.1 : 0.22;
      particles = Array.from({ length: particleCount }, () => createParticle(width, height, intensity));
      running = !compact && !prefersReducedMotion && document.visibilityState === "visible";
      drawFrame();
    };

    const requestConfigureCanvas = () => {
      window.cancelAnimationFrame(resizeFrameId);
      resizeFrameId = window.requestAnimationFrame(configureCanvas);
    };

    const handlePointerMove = (event) => {
      if (!running) {
        return;
      }

      pointer.active = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handleVisibilityChange = () => {
      running = window.innerWidth >= 768 && !motionQuery.matches && document.visibilityState === "visible";
      window.cancelAnimationFrame(animationFrameId);
      drawFrame();
    };

    configureCanvas();

    window.addEventListener("resize", requestConfigureCanvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionQuery.addEventListener?.("change", configureCanvas);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.cancelAnimationFrame(resizeFrameId);
      window.removeEventListener("resize", requestConfigureCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener?.("change", configureCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] opacity-45 md:opacity-70" />;
}
