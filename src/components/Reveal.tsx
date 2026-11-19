import { motion, useReducedMotion } from "framer-motion";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/** Inside the admin live preview, sections show at once (no scroll animation). */
export const StillContext = createContext(false);

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export const Reveal = ({ children, className, delay = 0, y = 30 }: RevealProps) => {
  const osReduce = useReducedMotion();
  const still = useContext(StillContext);
  const reduce = osReduce || still;
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
