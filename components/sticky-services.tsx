"use client";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/lib/services";
import { useSiteMotion } from "./motion-provider";
import { Reveal } from "./reveal";
import type { CSSProperties, PointerEvent } from "react";

export function StickyServices() {
  const { enabled } = useSiteMotion();
  const tilt = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || e.pointerType !== "mouse" || !matchMedia("(min-width: 1100px)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.transform = `perspective(1400px) rotateX(${-(e.clientY - rect.top - rect.height / 2) / rect.height * 2}deg) rotateY(${(e.clientX - rect.left - rect.width / 2) / rect.width * 2}deg)`;
  };
  return <section className="service-stack section" aria-labelledby="stack-title"><Reveal className="stack-heading"><p className="overline">À chaque véhicule, son soin</p><h2 id="stack-title">Une prestation.<br /><em>Votre exigence.</em></h2></Reveal><div className="stack-panels">{services.map((service, index) => <article key={service.name} className={`stack-panel ${index % 2 ? "dark-panel" : ""}`} style={{ "--panel-index": index } as CSSProperties}><div className="stack-inner" onPointerMove={tilt} onPointerLeave={(e) => { e.currentTarget.style.transform = ""; }}><div className="stack-copy"><p className="overline">{service.number} / 05 · {service.short}</p><h3>{service.name}</h3><p>{service.description}</p><small>{service.detail}</small><a href="#rendez-vous" className="underlined-link" onClick={() => window.dispatchEvent(new CustomEvent("select-service", { detail: service.name }))}>Choisir cette prestation <ArrowUpRight /></a></div><div className="stack-photo"><Image src={index === 4 ? "/images/hero-v2.png" : "/images/hero-detailing.png"} alt={`Soin automobile : ${service.name.toLowerCase()}`} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectPosition: service.position }} /></div></div></article>)}</div></section>;
}
