"use client";

import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { services } from "@/lib/services";
import { Reveal } from "./reveal";


export function Services() {
  return (
    <section className="prestations section" id="services" aria-labelledby="prestations-title">
      <Reveal className="prestations-heading">
        <div><p className="prestations-eyebrow"><Sparkles size={13} aria-hidden="true" /> Nos prestations</p><h2 id="prestations-title">Un soin pour<br /><em>chaque détail.</em></h2></div>
        <div className="prestations-intro"><p className="prestations-summary">Des services pensés pour redonner à votre véhicule un aspect propre, soigné et brillant.</p><a className="prestations-book" href="#rendez-vous">Prendre rendez-vous <span><ArrowUpRight size={20} aria-hidden="true" /></span></a></div>
      </Reveal>
      <div className="prestations-grid">
        {services.map((service) => {
          const [title, ...qualifier] = service.name.split(" ");
          return (
            <Reveal key={service.name} className="prestation-reveal">
              <article className="prestation-card">
                <div className="prestation-photo">
                  <Image src={service.image} alt={service.imageAlt} fill sizes="(max-width: 540px) 100vw, (max-width: 1000px) 50vw, 20vw" style={{ objectPosition: service.position }} />
                </div>
                <div className="prestation-content">
                  <h3><a href="#rendez-vous" aria-label={service.name} onClick={() => window.dispatchEvent(new CustomEvent("select-service", { detail: service.name }))}><span className="prestation-title">{title} <em>{qualifier.join(" ")}</em></span><span className="prestation-arrow"><ArrowUpRight size={21} aria-hidden="true" /></span></a></h3>
                  <p>{service.description}</p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
