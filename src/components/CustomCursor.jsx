import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [pressed, setPressed] = useState(false);
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, { stiffness: 260, damping: 26, mass: 0.4 });
  const ringY = useSpring(dotY, { stiffness: 260, damping: 26, mass: 0.4 });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: fine)");
    const updateState = () => setEnabled(mediaQuery.matches);

    updateState();
    mediaQuery.addEventListener("change", updateState);

    return () => {
      mediaQuery.removeEventListener("change", updateState);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      document.body.removeAttribute("data-fancy-cursor");
      return undefined;
    }

    document.body.setAttribute("data-fancy-cursor", "true");

    const handlePointerMove = (event) => {
      dotX.set(event.clientX);
      dotY.set(event.clientY);
    };

    const handlePointerDown = () => setPressed(true);
    const handlePointerUp = () => setPressed(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.removeAttribute("data-fancy-cursor");
    };
  }, [dotX, dotY, enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[120] h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.95)] mix-blend-screen"
        style={{ x: dotX, y: dotY, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        aria-hidden="true"
        animate={{
          scale: pressed ? 0.82 : 1,
          opacity: pressed ? 0.78 : 1
        }}
        className="pointer-events-none fixed left-0 top-0 z-[119] h-12 w-12 rounded-full border border-cyan-300/60 bg-cyan-300/8 shadow-[0_0_45px_rgba(0,245,255,0.28)] backdrop-blur-sm"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
      />
    </>
  );
}
