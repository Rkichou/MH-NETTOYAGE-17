"use client";
import Image from "next/image";
import gsap from "gsap";
import { Check } from "lucide-react";
import { useScrollScene } from "@/hooks/use-scroll-scene";
const setup = (element: HTMLDivElement) => {
  element.classList.add("expansion-pinned");
  gsap.timeline({ scrollTrigger: { id: "film-expansion", trigger: element, start: "top top", end: "+=130%", pin: true, scrub: true, invalidateOnRefresh: true } })
    .fromTo(".expansion-photo", { clipPath: "inset(19% 22% 19% 22%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .7, ease: "none" }, 0)
    .to(".expansion-heading", { opacity: 0, y: -35, duration: .25 }, .05)
    .fromTo(".expansion-quote", { autoAlpha: 0, y: 35 }, { autoAlpha: 1, y: 0, duration: .3 }, .72);
  return () => element.classList.remove("expansion-pinned");
};
export function ExpandingVisual() {
  const ref = useScrollScene(setup, true);
  return <section aria-label="La différence est dans les détails"><div className="expansion" ref={ref}>
    <h2 className="expansion-heading"><span>LA DIFFÉRENCE</span><span>EST DANS LES DÉTAILS.</span></h2>
    <div className="expansion-photo"><Image src="/images/hero-detailing.png" alt="Passage minutieux d’une microfibre sur le capot" fill sizes="100vw" /></div>
    <div className="expansion-quote"><blockquote>Un véhicule propre se remarque.<br /><em>Un véhicule soigné se ressent.</em></blockquote><div className="quality-points"><span><Check /> Produits adaptés</span><span><Check /> Gestes maîtrisés</span><span><Check /> Contrôle final</span></div></div>
  </div></section>;
}
