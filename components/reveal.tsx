"use client";
import gsap from "gsap";
import { useScrollScene } from "@/hooks/use-scroll-scene";
const setup = (element: HTMLDivElement) => {
  gsap.from(element, { y: 36, opacity: .15, ease: "none", scrollTrigger: { trigger: element, start: "top 95%", end: "top 70%", scrub: true } });
};
export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useScrollScene(setup);
  return <div className={className} ref={ref}>{children}</div>;
}
