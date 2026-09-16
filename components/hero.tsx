"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { CarWashVisual } from "./car-wash-visual";

export function Hero() {
  return <section className="hero hero-detailing" id="accueil" aria-labelledby="hero-title">
    <div className="detailing-copy">
      <p className="detailing-brand">MH NETTOYAGE <span>17</span></p>
      <p className="detailing-eyebrow">L’art du soin automobile</p>
      <h1 id="hero-title">Votre voiture<br />mérite de<br /><em>briller.</em></h1>
      <p className="detailing-description">Lavage intérieur, extérieur et finitions soignées : redonnez tout son éclat à votre véhicule.</p>
      <div className="detailing-actions">
        <a className="hero-primary" href="#rendez-vous">Prendre rendez-vous <ArrowRight size={18} /></a>
        <a className="detailing-secondary" href="#services">Découvrir nos prestations <ArrowDown size={17} /></a>
      </div>
      <p className="detailing-location"><span /> Sur rendez-vous · Charente-Maritime</p>
    </div>
    <CarWashVisual />
  </section>;
}
