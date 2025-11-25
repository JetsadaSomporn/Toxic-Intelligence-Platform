"use client";

import { useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const hasAnimated = useRef(false);

  const initAnimation = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || hasAnimated.current) return;
      elementRef.current = element;

      gsap.set(element, { opacity: 0, y: 40 });

      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          once: true,
        },
      });

      hasAnimated.current = true;
    },
    [delay]
  );

  return (
    <div ref={initAnimation} className={className}>
      {children}
    </div>
  );
}
