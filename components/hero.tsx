"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export function Hero() {
  return <section className="hero hero-detailing hero-editorial" id="accueil" aria-labelledby="hero-title">
    <div className="editorial-inner">
      <div className="editorial-intro">
        <p className="editorial-brand">MH NETTOYAGE <span>17</span></p>
        <p className="editorial-location">Charente-Maritime <span>/ Sur rendez-vous</span></p>
      </div>
      <div className="editorial-stage">
        <h1 id="hero-title" aria-label="Redonnez tout son éclat à votre voiture.">
          <span className="editorial-lead" aria-hidden="true">Redonnez tout son</span>
          <span className="editorial-word" aria-hidden="true">Éclat.</span>
          <span className="editorial-ending" aria-hidden="true">à votre voiture.</span>
        </h1>
        <p className="editorial-care">Le soin automobile,<br />jusque dans les détails.</p>
        <p className="editorial-services">Lavage intérieur<br />Lavage extérieur<br /><span>Finitions soignées</span></p>
        <div className="editorial-backword" aria-hidden="true">NETTOYAGE</div>
        <div className="editorial-car">
          <Image src="/images/hero-golf-detouree.webp" alt="Volkswagen Golf blanche en vue trois-quarts, détourée à partir d’une photo de l’atelier." width={1536} height={1024} priority sizes="(max-width: 600px) 100vw, (max-width: 1100px) 68vw, 720px" />
        </div>
      </div>
      <div className="editorial-bottom">
        <p className="editorial-description">Un nettoyage intérieur et extérieur soigné,<br className="editorial-desktop-break" /> jusque dans les moindres détails.</p>
        <div className="editorial-actions">
          <a className="hero-primary" href="#rendez-vous">Prendre rendez-vous <ArrowUpRight size={19} aria-hidden="true" /></a>
          <a className="editorial-secondary" href="#services">Découvrir nos prestations <ArrowDown size={17} aria-hidden="true" /></a>
        </div>
      </div>
    </div>
  </section>;
}
