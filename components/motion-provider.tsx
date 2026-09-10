"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
const MotionContext = createContext({ enabled: false, toggle: () => {} });
export const useSiteMotion = () => useContext(MotionContext);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem("mh-motion"); } catch { /* Storage can be unavailable in private contexts. */ }
      setEnabled(!media.matches && saved !== "off");
    };
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? "on" : "off";
    if (!enabled) return;
    const lenis = new Lenis({ duration: 1.05, anchors: true, prevent: (node) => node.tagName === "DIALOG" });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    const observer = new MutationObserver(() => {
      if (document.querySelector("dialog[open]")) lenis.stop(); else lenis.start();
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["open"] });
    return () => { observer.disconnect(); gsap.ticker.remove(tick); lenis.destroy(); };
  }, [enabled]);
  const toggle = () => {
    const next = !enabled;
    try { localStorage.setItem("mh-motion", next ? "on" : "off"); } catch { /* Keep the in-session preference. */ }
    setEnabled(next);
  };
  return <MotionContext.Provider value={{ enabled, toggle }}><MotionConfig reducedMotion={enabled ? "never" : "always"} transition={{ duration: enabled ? .35 : 0 }}>{children}</MotionConfig></MotionContext.Provider>;
}
