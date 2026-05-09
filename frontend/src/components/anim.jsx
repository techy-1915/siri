import React from "react";
import { motion, useInView } from "framer-motion";

export function Reveal({ children, delay = 0, y = 28, as: Component = "div", ...rest }) {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, gap = 0.06, ...rest }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: 0.05 } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...rest }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function FadeRoute({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Anime.js-style hero text reveal — splits a string into per-character spans
 *  and animates them in with a staggered cascade. */
export function HeroTextReveal({ text, className = "", delay = 0 }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, wi) => (
        <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.25em" }}>
          {Array.from(w).map((ch, i) => (
            <motion.span
              key={i}
              style={{ display: "inline-block" }}
              initial={{ opacity: 0, y: "1em", rotate: 6 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{
                duration: 0.9,
                delay: delay + (wi * 0.05) + (i * 0.025),
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {ch}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
}
