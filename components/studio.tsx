"use client";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

export function Studio() {
  return <section className="studio section" id="studio">
    <Reveal className="studio-title"><p className="overline">MH Nettoyage 17</p><h2>Plus qu’un lavage.<br /><em>Un vrai soin.</em></h2></Reveal>
    <div className="studio-layout">
      <Reveal className="studio-statement"><p>Nous traitons chaque véhicule comme une pièce unique.</p></Reveal>
      <Reveal className="studio-copy" delay={.08}><p>Une méthode précise, des produits choisis selon les matières et un contrôle attentif des finitions. Vous savez ce qui sera fait, pourquoi, et à quoi vous attendre.</p><a className="underlined-link" href="#methode">Notre façon de travailler <ArrowRight size={16} /></a></Reveal>
      <Reveal className="studio-metrics" delay={.16}><div><strong>01</strong><span>Interlocuteur unique</span></div><div><strong>100%</strong><span>Prestation adaptée</span></div><div><strong>17</strong><span>Charente-Maritime</span></div></Reveal>
    </div>
  </section>;
}
