"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Seconds to delay the reveal — use to stagger siblings. */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
  className?: string;
};

/**
 * Scroll-triggered reveal used across the marketing surfaces. Fades + lifts its
 * children into place the first time they enter the viewport. Respects
 * prefers-reduced-motion (renders statically).
 */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
