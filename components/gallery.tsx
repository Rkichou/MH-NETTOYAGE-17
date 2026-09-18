"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Expand } from "lucide-react";
import gsap from "gsap";
import { useScrollScene } from "@/hooks/use-scroll-scene";
import { Modal } from "./modal";
import { Reveal } from "./reveal";

const photos = [
  { file: "volkswagen-golf-apres-lavage-vue-avant.jpeg", title: "Golf · L'éclat retrouvé", category: "Lavage extérieur", alt: "Avant de la Volkswagen Golf après lavage, avec les reflets de l'atelier sur le capot." },
  { file: "audi-a5-habitacle-apres-nettoyage-vue-conducteur.jpeg", title: "Audi A5 · Côté conducteur", category: "Nettoyage intérieur", alt: "Siège, tapis et poste de conduite de l'Audi A5 après nettoyage." },
  { file: "bmw-jante-apres-nettoyage.png", title: "BMW · Le détail des jantes", category: "Finitions", alt: "Jante noire et argentée d'une BMW après nettoyage." },
  { file: "volkswagen-golf-lavage-mousse-vue-avant.jpeg", title: "Golf · Sous la mousse", category: "Lavage extérieur", alt: "Volkswagen Golf recouverte de mousse pendant le lavage extérieur." },
  { file: "audi-a5-siege-passager-apres-nettoyage.jpeg", title: "Audi A5 · Un habitacle soigné", category: "Nettoyage intérieur", alt: "Siège passager et tapis propres de l'Audi A5." },
  { file: "volkswagen-golf-detail-feu-arriere.jpeg", title: "Golf · Les finitions", category: "Finitions", alt: "Détail du feu arrière et des reflets sur la carrosserie de la Golf." },
  { file: "bmw-suv-exterieur-apres-nettoyage.jpeg", title: "BMW · Une nouvelle lumière", category: "Lavage extérieur", alt: "SUV BMW blanc après nettoyage extérieur, photographié à la lumière du jour." },
  { file: "bmw-coffre-apres-nettoyage.jpeg", title: "BMW · Jusqu'au coffre", category: "Nettoyage intérieur", alt: "Moquette et parois du coffre BMW après nettoyage." },
];
type Photo = (typeof photos)[number];
const categories = ["Tout", "Lavage extérieur", "Nettoyage intérieur", "Finitions"];

const revealGallery = (element: HTMLDivElement) => {
  gsap.from(element.querySelector(".gallery-fan"), {
    y: 35, scale: .94, opacity: .2, ease: "none",
    scrollTrigger: { trigger: element, start: "top 92%", end: "top 48%", scrub: .5 },
  });
};

function GalleryDeck({ items }: { items: Photo[] }) {
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const scene = useScrollScene(revealGallery);
  const current = items[active];
  const move = (direction: number) => setActive(index => (index + direction + items.length) % items.length);
  const select = (index: number) => { if (index === active) setOpened(true); else setActive(index); };

  return <div className="gallery-deck" ref={scene}>
    <div className="gallery-fan" role="region" aria-roledescription="carrousel" aria-label="Photos de nos réalisations"
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          const fan = event.currentTarget;
          event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1);
          // Keep keyboard focus on the newly selected photo, not a receding card.
          requestAnimationFrame(() => fan.querySelector<HTMLButtonElement>('[data-active="true"]')?.focus({ preventScroll: true }));
        }
      }}
      onPointerDown={event => { start.current = { x: event.clientX, y: event.clientY }; dragged.current = false; }}
      onPointerUp={event => {
        if (!start.current) return;
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        start.current = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { dragged.current = true; move(dx < 0 ? 1 : -1); }
        else if (event.pointerType === "touch" && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          const card = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-photo-index]');
          if (card) select(Number(card.dataset.photoIndex));
        }
      }} onPointerCancel={() => { start.current = null; }}>
      {items.map((photo, index) => {
        let offset = (index - active + items.length) % items.length;
        if (offset > items.length / 2) offset -= items.length;
        const distance = Math.abs(offset);
        return <button type="button" key={photo.file} className="gallery-photo" data-photo-index={index} data-active={index === active} data-distance={distance}
          style={{ "--offset": offset, "--lift": `${distance * distance * 13}px`, "--angle": `${offset * 7}deg`, "--scale": 1 - distance * .065, zIndex: 10 - distance } as CSSProperties}
          tabIndex={index === active ? 0 : -1} aria-hidden={distance > 3 || undefined}
          aria-label={`${index === active ? "Agrandir" : "Sélectionner"} : ${photo.title}`}
          onClick={event => {
            // Touch taps are handled on pointer-up: browsers may suppress click after a swipe.
            if ((event.nativeEvent as PointerEvent).pointerType === "touch") return;
            if (dragged.current && event.detail !== 0) { dragged.current = false; return; }
            select(index);
          }}>
          <span className="gallery-photo-inner">
            <Image src={`/images/${photo.file}`} alt={photo.alt} fill sizes="(max-width: 600px) 240px, (max-width: 1000px) 280px, 340px" draggable={false} />
            <span className="gallery-photo-overlay"><span>{photo.category}</span><strong>{photo.title}</strong><Expand size={20} aria-hidden="true" /></span>
          </span>
        </button>;
      })}
    </div>
    <div className="gallery-caption" aria-live="polite" aria-atomic="true"><p>{current.category}</p><h3>{current.title}</h3></div>
    <div className="gallery-navigation" role="group" aria-label="Navigation des photos">
      <button type="button" className="gallery-arrow" onClick={() => move(-1)} aria-label="Photo précédente" title="Photo précédente"><ArrowLeft size={20} /></button>
      <div className="gallery-dots">{items.map((photo, index) => <button key={photo.file} type="button" aria-label={`Afficher la photo ${index + 1} : ${photo.title}`} aria-current={active === index ? "true" : undefined} onClick={() => setActive(index)}><span /></button>)}</div>
      <button type="button" className="gallery-arrow" onClick={() => move(1)} aria-label="Photo suivante" title="Photo suivante"><ArrowRight size={20} /></button>
    </div>
    {opened && <div onKeyDown={event => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
    }}><Modal title={current.title} className="gallery-lightbox" onClose={() => {
      setOpened(false);
      requestAnimationFrame(() => scene.current?.querySelector<HTMLButtonElement>('[data-active="true"]')?.focus({ preventScroll: true }));
    }}>
      <div className="gallery-full-image"><Image src={`/images/${current.file}`} alt={current.alt} fill sizes="(max-width: 900px) 92vw, 1000px" /></div>
      <div className="gallery-lightbox-controls"><button type="button" className="gallery-arrow" aria-label="Photo précédente" title="Photo précédente" onClick={() => move(-1)}><ArrowLeft size={20} /></button><p aria-live="polite">{active + 1} / {items.length} · {current.category}</p><button type="button" className="gallery-arrow" aria-label="Photo suivante" title="Photo suivante" onClick={() => move(1)}><ArrowRight size={20} /></button></div>
    </Modal></div>}
  </div>;
}

export function Gallery() {
  const [category, setCategory] = useState("Tout");
  const items = category === "Tout" ? photos : photos.filter(photo => photo.category === category);
  return <section className="gallery-section" id="galerie" aria-labelledby="gallery-title">
    <Reveal className="gallery-heading"><p className="overline">Galerie · MH Nettoyage 17</p><h2 id="gallery-title">Nos <em>réalisations</em></h2><p>Découvrez quelques véhicules transformés<br className="gallery-break" /> par notre savoir-faire.</p></Reveal>
    <div className="gallery-filters" role="group" aria-label="Catégories de réalisations">{categories.map(value => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
    <GalleryDeck key={category} items={items} />
    <a className="gallery-comparison-link" href="#pourquoi-nous">Voir les avant / après <ArrowUpRight size={17} aria-hidden="true" /></a>
  </section>;
}
