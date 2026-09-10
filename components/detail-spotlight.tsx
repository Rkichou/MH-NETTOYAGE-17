"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Reveal } from "./reveal";

export function DetailSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [point, setPoint] = useState({ x: 50, y: 50 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const activate = () => {
    const rect = ref.current!.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height }); setActive(true);
  };
  const move = (x: number, y: number) => {
    const rect = ref.current!.getBoundingClientRect();
    setPoint({ x: Math.max(0, Math.min(100, (x - rect.left) / rect.width * 100)), y: Math.max(0, Math.min(100, (y - rect.top) / rect.height * 100)) });
  };
  return <section className="spotlight section" id="details"><Reveal><p className="overline">Au plus près</p><h2>LE DÉTAIL<br /><em>fait la différence.</em></h2><p>La précision du geste. La netteté du reflet. Le soin apporté à chaque surface.</p><button className="detail-toggle" aria-pressed={active} onClick={() => { if (active) setActive(false); else { activate(); ref.current?.focus({ preventScroll: true }); } }}>{active ? "Fermer la loupe" : "Observer les détails"}{active ? <X size={18} /> : <Search size={18} />}</button></Reveal>
    <div className="spotlight-photo" ref={ref} tabIndex={0} role="group" aria-label="Détail de carrosserie, loupe interactive" aria-describedby="lens-help" style={{ touchAction: active ? "none" : "pan-y" }}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") { activate(); move(e.clientX, e.clientY); } }}
      onPointerMove={(e) => { if (active) move(e.clientX, e.clientY); }}
      onPointerDown={(e) => { if (active) { e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX, e.clientY); } }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") setActive(false); }} onBlur={() => setActive(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") { setActive(false); return; }
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(e.key)) {
          e.preventDefault(); activate();
          setPoint((p) => ({ x: Math.max(0, Math.min(100, p.x + (e.key === "ArrowRight" ? 5 : e.key === "ArrowLeft" ? -5 : 0))), y: Math.max(0, Math.min(100, p.y + (e.key === "ArrowDown" ? 5 : e.key === "ArrowUp" ? -5 : 0))) }));
        }
      }}>
      <Image src="/images/hero-detailing.png" alt="Finition du capot avec une microfibre" fill sizes="(max-width: 900px) 100vw, 58vw" />
      {active && <div className="detail-lens" aria-hidden="true" style={{ left: `${point.x}%`, top: `${point.y}%` }}><div style={{ position: "absolute", width: dimensions.width * 1.7, height: dimensions.height * 1.7, left: `calc(50% - ${point.x / 100 * dimensions.width * 1.7}px)`, top: `calc(50% - ${point.y / 100 * dimensions.height * 1.7}px)` }}><Image src="/images/hero-detailing.png" alt="" fill sizes="100vw" /></div><Search size={16} /></div>}
    </div><p id="lens-help" className="sr-only">Entrée active la loupe. Les flèches déplacent la zone agrandie. Échap la ferme. Sur écran tactile, activez le bouton puis faites glisser le doigt.</p>
  </section>;
}
