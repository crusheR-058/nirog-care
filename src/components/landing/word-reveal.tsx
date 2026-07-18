"use client";

import { motion } from "motion/react";

/**
 * Award-style heading reveal: words rise and un-blur one by one (≈45ms
 * stagger). `faintFrom` switches the tail of the sentence to the faint tone —
 * the app's two-tone headline pattern.
 */
export function WordReveal({
  text,
  className,
  faintFrom,
}: {
  text: string;
  className?: string;
  faintFrom?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
            delay: i * 0.045,
          }}
          className={
            "inline-block whitespace-pre " +
            (faintFrom !== undefined && i >= faintFrom
              ? "text-ink-faint"
              : "text-ink")
          }
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}
