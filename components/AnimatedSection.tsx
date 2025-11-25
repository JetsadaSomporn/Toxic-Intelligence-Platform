"use client";

import { useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-left" | "fade-right" | "scale";
  delay?: number;
  duration?: number;
  stagger?: number;
}

export default function AnimatedSection({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
  duration = 0.8,
}: AnimatedSectionProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const animatedRef = useRef(false);

  const initAnimation = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || animatedRef.current) return;
      sectionRef.current = element;

      // Set initial state based on animation type
      const initialState: gsap.TweenVars = { opacity: 0 };
      const animateState: gsap.TweenVars = { opacity: 1, duration, delay };

      switch (animation) {
        case "fade-up":
          initialState.y = 60;
          animateState.y = 0;
          break;
        case "fade-left":
          initialState.x = -60;
          animateState.x = 0;
          break;
        case "fade-right":
          initialState.x = 60;
          animateState.x = 0;
          break;
        case "scale":
          initialState.scale = 0.8;
          animateState.scale = 1;
          break;
      }

      gsap.set(element, initialState);

      gsap.to(element, {
        ...animateState,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          once: true,
        },
      });

      animatedRef.current = true;
    },
    [animation, delay, duration]
  );

  return (
    <div ref={initAnimation} className={className}>
      {children}
    </div>
  );
}

// Staggered children animation component
interface StaggeredContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: StaggeredContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animatedRef = useRef(false);

  const initAnimation = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || animatedRef.current) return;
      containerRef.current = element;

      const childElements = element.children;

      gsap.set(childElements, { opacity: 0, y: 40 });

      gsap.to(childElements, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: staggerDelay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          once: true,
        },
      });

      animatedRef.current = true;
    },
    [staggerDelay]
  );

  return (
    <div ref={initAnimation} className={className}>
      {children}
    </div>
  );
}
