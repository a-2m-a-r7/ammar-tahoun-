import { motion, useMotionValue, useSpring } from "framer-motion";

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

export default function MagneticButton({
  children,
  href,
  onClick,
  className,
  variant = "primary",
  icon,
  type = "button"
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 210, damping: 20, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 210, damping: 20, mass: 0.35 });
  const MotionTag = href ? motion.a : motion.button;

  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;
    const offsetX = (relativeX - rect.width / 2) * 0.18;
    const offsetY = (relativeY - rect.height / 2) * 0.18;

    event.currentTarget.style.setProperty("--pointer-x", `${relativeX}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${relativeY}px`);
    x.set(offsetX);
    y.set(offsetY);
  };

  const resetPosition = () => {
    x.set(0);
    y.set(0);
  };

  const isExternal = href && !href.startsWith("#") && !href.startsWith("/");
  const componentProps = href
    ? {
        href,
        target: isExternal ? "_blank" : undefined,
        rel: isExternal ? "noopener noreferrer" : undefined
      }
    : {
        type,
        onClick
      };

  return (
    <MotionTag
      {...componentProps}
      className={cx("magnetic-button", variant === "secondary" && "magnetic-button-secondary", className)}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={resetPosition}
      onFocus={resetPosition}
      whileTap={{ scale: 0.98 }}
    >
      <span className="magnetic-button__glow" />
      <span className="magnetic-button__content">
        {children}
        {icon ? <span className="magnetic-button__icon">{icon}</span> : null}
      </span>
    </MotionTag>
  );
}
