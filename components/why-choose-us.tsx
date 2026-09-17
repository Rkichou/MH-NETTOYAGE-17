"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Armchair, ArrowUpRight, ChevronsLeftRight, House, Sparkles, SprayCan } from "lucide-react";
import { useSiteMotion } from "./motion-provider";
import { Reveal } from "./reveal";

gsap.registerPlugin(ScrollTrigger);

const comparisons = [
  { id: "habitacle vue centrale", label: "Habitacle Audi", caption: "Audi A5 · Habitacle côté passager", before: "/images/audi-a5-habitacle-avant-nettoyage-vue-centrale.jpeg", after: "/images/audi-a5-habitacle-apres-nettoyage.jpeg", position: "50% 55%" },
  { id: "Jante", label: "Jante BMW", caption: "BMW · Nettoyage de la jante", before: "/images/bmw-jante-avant-nettoyage.jpeg", after: "/images/bmw-jante-apres-nettoyage.png", position: "50% 55%" },
  { id: "habitacle", label: "Habitacle Audi", caption: "Audi A5 · Habitacle côté passager", before: "/images/audi-a5-habitacle-avant-nettoyage.jpeg", after: "/images/audi-a5-siege-passager-apres-nettoyage.jpeg", position: "50% 55%" },
  { id: "habitacle vue droite", label: "Habitacle Audi", caption: "Audi A5 · Habitacle côté passager", before: "/images/audi-a5-habitacle-avant-nettoyage-vue-conducteur.jpeg", after: "/images/audi-a5-habitacle-apres-nettoyage-vue-conducteur.jpeg", position: "50% 55%" },

] as const;

const benefits = [
  { icon: Armchair, title: "Nettoyage intérieur complet", text: "Sièges, tapis, plastiques et coffre : un habitacle soigné de fond en comble." },
  { icon: Sparkles, title: "Finition brillante", text: "Une carrosserie nette et des finitions contrôlées, jusque dans les reflets." },
  { icon: House, title: "Intervention à domicile", text: "Le soin de votre véhicule, directement chez vous, sur rendez-vous." },
  { icon: SprayCan, title: "Produits adaptés et soin du détail", text: "Chaque surface reçoit les produits et les gestes qui lui conviennent." },
];

function BeforeAfter({ pair }: { pair: (typeof comparisons)[number] }) {
  const frame = useRef<HTMLDivElement>(null);
  const manual = useRef(false);
  const [position, setPosition] = useState(50);
  const { enabled } = useSiteMotion();

  useEffect(() => {
    if (!enabled || !frame.current) return;
    const progress = { value: 100 };
    const context = gsap.context(() => {
      gsap.to(progress, {
        value: 0, ease: "none",
        onUpdate: () => { if (!manual.current) setPosition(Math.round(progress.value)); },
        scrollTrigger: { trigger: frame.current, start: "top 85%", end: "bottom 55%", scrub: .6, invalidateOnRefresh: true },
      });
    }, frame);
    return () => context.revert();
  }, [enabled]);

  const choosePosition = (value: number) => {
    // Once the visitor takes control, scrolling must not move their selection.
    manual.current = true;
    setPosition(value);
  };

  return <figure className="benefit-comparison" id={`comparison-${pair.id}`} role="tabpanel" aria-labelledby={`comparison-tab-${pair.id}`}>
    <div className="comparison-frame" ref={frame} data-position={position}>
      <Image src={pair.before} alt={`${pair.caption}, avant nettoyage`} fill sizes="(max-width: 760px) 100vw, 560px" style={{ objectPosition: pair.position }} />
      <div className="comparison-after" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        <Image src={pair.after} alt={`${pair.caption}, après nettoyage`} fill sizes="(max-width: 760px) 100vw, 560px" style={{ objectPosition: pair.position }} />
      </div>
      <span className="comparison-label comparison-before-label" style={{ opacity: position > 10 ? 1 : 0 }} aria-hidden="true">Avant</span>
      <span className="comparison-label comparison-after-label" style={{ opacity: position < 90 ? 1 : 0 }} aria-hidden="true">Après</span>
      <div className="comparison-divider" style={{ left: `${position}%`, opacity: position > 0 && position < 100 ? 1 : 0 }} aria-hidden="true"><span><ChevronsLeftRight size={23} /></span></div>
      <input className="comparison-range" type="range" min="0" max="100" step="1" value={position}
        aria-label={`Séparateur avant/après : ${pair.label}`} aria-valuetext={`${position} % avant, ${100 - position} % après`}
        onPointerDown={() => { manual.current = true; }} onFocus={() => { manual.current = true; }}
        onChange={event => choosePosition(Number(event.target.value))} />
    </div>
    <div className="comparison-controls" role="group" aria-label="Vue de la comparaison">
      <button type="button" aria-pressed={position === 100} onClick={() => choosePosition(100)}>Avant</button>
      <button type="button" aria-pressed={position > 0 && position < 100} onClick={() => choosePosition(50)}><ChevronsLeftRight size={16} aria-hidden="true" /> Comparer</button>
      <button type="button" aria-pressed={position === 0} onClick={() => choosePosition(0)}>Après</button>
    </div>
    <figcaption><strong>{pair.caption}</strong><span>Prises de vue à des angles différents.</span></figcaption>
  </figure>;
}

export function WhyChooseUs() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  return <section className="why-section" id="pourquoi-nous" aria-labelledby="why-title">
    <div className="why-inner">
      <Reveal className="why-heading"><p className="overline">Le soin fait la différence</p><h2 id="why-title">Pourquoi nous <em>choisir ?</em></h2><p>Un intérieur retrouvé. Une finition soignée.<br />Et du temps pour vous.</p></Reveal>
      <div className="comparison-tabs" role="tablist" aria-label="Réalisations avant et après">
        {comparisons.map((pair, index) => <button type="button" role="tab" key={pair.id} id={`comparison-tab-${pair.id}`} aria-controls={`comparison-${pair.id}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1}
          ref={element => { tabs.current[index] = element; }} onClick={() => setSelected(index)}
          onKeyDown={event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? comparisons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + comparisons.length) % comparisons.length;
            setSelected(next); tabs.current[next]?.focus();
          }}>{pair.label}</button>)}
      </div>
      <div className="why-showcase">
        <BeforeAfter key={comparisons[selected].id} pair={comparisons[selected]} />
        {benefits.map(({ icon: Icon, title, text }, index) => <Reveal key={title} className={`benefit-item benefit-item-${index}`}><article><Icon size={26} strokeWidth={1.5} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article></Reveal>)}
      </div>
      <div className="why-booking"><a href="#rendez-vous">Prendre rendez-vous <ArrowUpRight size={19} aria-hidden="true" /></a><span>À domicile · Sur rendez-vous</span></div>
    </div>
  </section>;
}
