"use client";

import {  animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 1.8,
  decimals = 0,
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate(value) {
        node.textContent = prefix + value.toFixed(decimals) + suffix;
      },
    });

    return () => controls.stop();
  }, [from, to, duration, decimals, isInView, prefix, suffix]);

  return (
    <span ref={nodeRef} className="font-heading font-black text-primary">
      {prefix + from.toFixed(decimals) + suffix}
    </span>
  );
}
