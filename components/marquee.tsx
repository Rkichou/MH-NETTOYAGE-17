"use client";
import { useRef } from "react";
import { useInView } from "motion/react";
import { useSiteMotion } from "./motion-provider";
export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const { enabled } = useSiteMotion();
  return <div ref={ref} className="marquee" aria-label="Nettoyage intérieur, lavage extérieur, soin esthétique, particuliers et professionnels"><div className="ticker-track" style={{ animationPlayState: enabled && visible ? "running" : "paused" }}>{[0, 1].map((i) => <div key={i} className="marquee-set" aria-hidden="true"><span>Nettoyage intérieur</span><i /><span>Lavage extérieur</span><i /><span>Soin esthétique</span><i /><span>Particuliers & professionnels</span><i /></div>)}</div></div>;
}
