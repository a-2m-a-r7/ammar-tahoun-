import { useEffect, useRef } from "react";

function createParticle(width, height, intensity) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * intensity,
    vy: (Math.random() - 0.5) * intensity,
    radius: Math.random() * 1.8 + 0.6
  };
}

export default function BackgroundFX() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return undefined;
    }

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let particles = [];
    const pointer = { x: 0, y: 0, active: false };
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const configureCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = prefersReducedMotion ? 52000 : 24000;
      const particleCount = Math.max(24, Math.min(86, Math.floor((width * height) / density)));
      const intensity = prefersReducedMotion ? 0.14 : 0.28;
      particles = Array.from({ length: particleCount }, () => createParticle(width, height, intensity));
    };

    const drawFrame = () => {
      context.clearRect(0, 0, width, height);

      particles.forEach((particle, particleIndex) => {
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

          if (distance < 160) {
            particle.x += (distanceX / Math.max(distance, 1)) * 0.45;
            particle.y += (distanceY / Math.max(distance, 1)) * 0.45;
          }
        }

        context.beginPath();
        context.fillStyle = particleIndex % 3 === 0 ? "rgba(0, 245, 255, 0.6)" : "rgba(124, 58, 237, 0.42)";
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      for (let index = 0; index < particles.length; index += 1) {
        for (let innerIndex = index + 1; innerIndex < particles.length; innerIndex += 1) {
          const particleA = particles[index];
          const particleB = particles[innerIndex];
          const distance = Math.hypot(particleA.x - particleB.x, particleA.y - particleB.y);

          if (distance < 130) {
            context.strokeStyle = `rgba(34, 211, 238, ${0.12 - distance / 1800})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(particleA.x, particleA.y);
            context.lineTo(particleB.x, particleB.y);
            context.stroke();
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(drawFrame);
    };

    const handlePointerMove = (event) => {
      pointer.active = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    configureCanvas();
    drawFrame();

    window.addEventListener("resize", configureCanvas);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", configureCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] opacity-70" />;
}
