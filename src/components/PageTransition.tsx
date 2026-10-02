import { motion, Transition } from 'framer-motion';
import { ReactNode, CSSProperties } from 'react';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
  },
};

const pageTransition: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.25
};

export default function PageTransition({ children, className = '', style }: { children: ReactNode, className?: string, style?: CSSProperties }) {
  // Use prefers-reduced-motion to disable transforms if requested
  const isReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={
        isReducedMotion 
          ? { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } }
          : pageVariants
      }
      transition={pageTransition}
      className={className}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', ...style }}
    >
      {children}
    </motion.div>
  );
}
