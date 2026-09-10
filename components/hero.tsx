"use client";
import Image from "next/image";
import gsap from "gsap";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useScrollScene } from "@/hooks/use-scroll-scene";

const setup = (element: HTMLDivElement) => {
  const intro = element.querySelector<HTMLElement>(".hero-copy-v2")!;
  const second = element.querySelector<HTMLElement>(".hero-second")!;
  element.classList.add("scene-pinned");
  const timeline = gsap.timeline({ scrollTrigger: {
    id: "hero-story", trigger: element, start: "top top", end: "+=155%", pin: true, scrub: true, invalidateOnRefresh: true,
    onUpdate: (self) => { intro.inert = self.progress > .46; second.inert = self.progress < .46; },
  } });
  timeline.to(".hero-media", { scale: 1.045, xPercent: -3, ease: "none", duration: 1 }, 0)
    .to(intro, { autoAlpha: 0, y: -90, duration: .27 }, .12)
    .fromTo(second, { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: .32 }, .47);
  return () => { element.classList.remove("scene-pinned"); intro.inert = false; second.inert = false; };
};

export function Hero() {
  const ref = useScrollScene(setup, true);
  return <div ref={ref} className="hero" id="accueil">
    <div className="hero-media"><Image src="/images/hero-v2.png" alt="Finition d’une berline noire dans un atelier de detailing" fill priority sizes="100vw" /></div>
    <div className="hero-content"><div className="hero-copy-v2">
      <p className="hero-brand">MH NETTOYAGE <span>17</span></p>
      <p className="hero-label">Nettoyage automobile premium · Charente-Maritime</p>
      <h1>Le détail qui<br /><span>change tout.</span></h1>
      <p className="hero-description">Intérieur, extérieur ou soin complet. Votre véhicule retrouve une finition impeccable, réalisée avec méthode et exigence.</p>
      <div className="hero-actions-v2"><a className="hero-primary" href="#rendez-vous">Prendre rendez-vous <ArrowRight size={18} /></a><a className="hero-secondary" href="#services">Voir les prestations <ArrowDown size={16} /></a></div>
      <div className="hero-availability"><i /> Sur rendez-vous · Secteur 17</div>
    </div></div>
    <div className="hero-second"><span className="overline light-text">L’exigence MH</span><h2>PLUS QU’UN<br />LAVAGE.<br /><em>Un vrai soin.</em></h2><p>Chaque détail compte. Chaque finition est contrôlée.</p></div>
  </div>;
}
