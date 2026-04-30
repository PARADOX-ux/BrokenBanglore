import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 border-2 border-forest rounded-full pointer-events-none z-[9999] hidden md:block"
      style={{
        translateX: cursorXSpring,
        translateY: cursorYSpring,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-forest rounded-full"></div>
    </motion.div>
  );
}
