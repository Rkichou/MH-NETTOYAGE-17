"use client";
import { CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import gsap from "gsap";
import { useScrollScene } from "@/hooks/use-scroll-scene";
import { Reveal } from "./reveal";
const steps = [
  { Icon: CalendarDays, title: "Votre demande", text: "Vous choisissez la prestation, le véhicule et le créneau qui vous conviennent." },
  { Icon: ShieldCheck, title: "Notre confirmation", text: "Nous vérifions le besoin, précisons le tarif et confirmons le rendez-vous avec vous." },
  { Icon: Sparkles, title: "Le résultat", text: "Le véhicule est traité avec soin puis contrôlé avant sa restitution." },
];
const setup = (element: HTMLDivElement) => {
  const media = gsap.matchMedia();
  media.add({ mobile: "(max-width: 720px)", desktop: "(min-width: 721px)" }, (context) => {
  const mobile = context.conditions?.mobile;
  gsap.from(element.querySelector(".method-line"), { [mobile ? "scaleY" : "scaleX"]: 0, ease: "none", scrollTrigger: { trigger: element, start: "top 80%", end: "bottom 55%", scrub: true } });
  element.querySelectorAll(".method-step").forEach((step, index) => {
    gsap.from(step, { opacity: .25, y: 24, scrollTrigger: { trigger: mobile ? step : element, start: mobile ? "top 85%" : `top ${85 - index * 15}%`, end: mobile ? "top 55%" : `top ${60 - index * 15}%`, scrub: true } });
    gsap.from(step.querySelector("svg"), { color: "#77766f", scrollTrigger: { trigger: step, start: "top 80%", end: "top 40%", scrub: true } });
  });
  });
  return () => media.revert();
};
export function Method() {
  const ref = useScrollScene(setup);
  return <section className="method section" id="methode"><Reveal className="method-heading"><p className="overline">Une expérience simple</p><h2>Vous réservez.<br /><em>Nous faisons le reste.</em></h2></Reveal><div ref={ref} className="method-steps"><div className="method-line" aria-hidden="true" />{steps.map(({ Icon, title, text }, i) => <article key={title} className="method-step"><div className="step-top"><span>0{i + 1}</span><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>;
}
