import { useEffect, useState } from "react";

/**
 * True when the viewer has asked the OS to reduce motion.
 *
 * CSS already collapses the --dur-* tokens under the same media query
 * (see tokens.css). This hook is for the JS side — framer-motion variants,
 * autoplaying carousels, and anything that animates outside CSS.
 *
 *   const reduced = useReducedMotion();
 *   <motion.div animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }} />
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduced(e.matches);

    // Safari < 14 only has the deprecated addListener
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return reduced;
}

export default useReducedMotion;
