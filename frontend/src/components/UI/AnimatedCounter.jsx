import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

const AnimatedCounter = ({ value, duration = 1.5, prefix = "", suffix = "", isCurrency = false }) => {
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  // Subscribe to spring changes
  useEffect(() => {
    return springValue.onChange((latest) => {
      let formatted;
      if (isCurrency || latest >= 1000) {
        formatted = Math.round(latest).toLocaleString();
      } else {
        formatted = Math.round(latest).toString();
      }
      setDisplayValue(formatted);
    });
  }, [springValue, isCurrency]);

  return (
    <motion.span>
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
};

export default AnimatedCounter;
