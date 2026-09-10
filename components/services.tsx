"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useCallback, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScrollScene } from "@/hooks/use-scroll-scene";
import { useSiteMotion } from "./motion-provider";
import { services } from "@/lib/services";
import { Reveal } from "./reveal";

export function Services() {
  const [active, setActive] = useState(2);
  const { enabled } = useSiteMotion();
  const setup = useCallback((element: HTMLDivElement) => {
    element.querySelectorAll<HTMLButtonElement>(".service-list button").forEach((button, index) => {
      ScrollTrigger.create({ trigger: button, start: "top 55%", end: "bottom 55%", onEnter: () => setActive(index), onEnterBack: () => setActive(index) });
    });
  }, []);
  const ref = useScrollScene(setup, true);
  return <section className="service-section" id="services">
    <div className="service-intro section"><Reveal><p className="overline light-text">Prestations</p><h2>Choisissez votre<br /><em>niveau de soin.</em></h2></Reveal><Reveal delay={.1}><p>Un point de départ clair, puis une recommandation adaptée au gabarit et à l’état réel de votre véhicule.</p></Reveal></div>
    <div className="service-explorer" ref={ref}>
      <div className="service-list" role="group" aria-label="Prestations disponibles">{services.map((service, index) => <button key={service.name} aria-pressed={active === index} aria-controls="service-preview" className={active === index ? "active" : ""} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)}><span>{service.number}</span><strong>{service.name}</strong><ArrowRight /></button>)}</div>
      <div className="service-visual">
        <AnimatePresence mode="wait"><motion.div className="service-image" key={active} initial={enabled ? { opacity: 0, scale: 1.04 } : false} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: enabled ? 0 : 1 }} transition={{ duration: enabled ? .3 : 0 }}><Image src="/images/hero-detailing.png" alt="Soin automobile MH Nettoyage 17" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectPosition: services[active].position }} /></motion.div></AnimatePresence>
        <motion.div id="service-preview" className="service-caption" key={`caption-${active}`} initial={enabled ? { opacity: 0, y: 16 } : false} animate={{ opacity: 1, y: 0 }}><span>{services[active].name}</span><p>{services[active].description}</p><small>{services[active].detail}</small><a href="#rendez-vous" onClick={() => window.dispatchEvent(new CustomEvent("select-service", { detail: services[active].name }))}>Choisir cette prestation <ArrowRight size={17} /></a></motion.div>
      </div>
    </div>
  </section>;
}
