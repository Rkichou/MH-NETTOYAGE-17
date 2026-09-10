"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSiteMotion } from "@/components/motion-provider";
gsap.registerPlugin(ScrollTrigger);

// MatchMedia owns every timeline and restores inline styles when motion or layout changes.
export function useScrollScene(setup: (element: HTMLDivElement) => void | (() => void), desktop = false) {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = useSiteMotion();
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const element = ref.current;
    const mm = gsap.matchMedia();
    mm.add(desktop ? "(min-width: 1100px) and (min-height: 700px)" : "(min-width: 1px)", () => setup(element), element);
    const refresh = () => ScrollTrigger.refresh();
    const frame = requestAnimationFrame(refresh);
    window.addEventListener("load", refresh);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("load", refresh); mm.revert(); };
  }, [enabled, desktop, setup]);
  return ref;
}
