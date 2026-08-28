"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight, CalendarDays, Check, ChevronLeft, Clock3, MapPin, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

const services = [
  { number: "01", name: "Lavage extérieur", short: "Carrosserie", description: "Prélavage, lavage manuel, jantes, séchage et finitions pour une carrosserie nette et brillante.", detail: "Une méthode douce qui respecte les surfaces et révèle les reflets.", position: "76% 58%" },
  { number: "02", name: "Nettoyage intérieur", short: "Habitacle", description: "Aspiration complète, surfaces, vitres et zones difficiles d’accès pour retrouver un intérieur sain.", detail: "Chaque recoin est traité avec les produits adaptés à sa matière.", position: "57% 30%" },
  { number: "03", name: "Nettoyage complet", short: "Intégral", description: "La prestation intérieure et extérieure réunie pour une remise au propre complète du véhicule.", detail: "Le choix idéal avant une vente, une restitution ou simplement pour repartir à neuf.", position: "82% 64%" },
  { number: "04", name: "Rénovation esthétique", short: "Finition", description: "Traitements ciblés et finitions avancées pour raviver et valoriser l’apparence générale.", detail: "Une intervention sur mesure après diagnostic visuel du véhicule.", position: "69% 42%" },
  { number: "05", name: "Solutions professionnelles", short: "Flottes", description: "Des passages planifiés pour les artisans, indépendants et petites flottes automobiles.", detail: "Un suivi simple et une image professionnelle constante.", position: "23% 54%" },
];

const initialForm = { service: "", vehicle: "", date: "", time: "", name: "", phone: "", email: "", message: "", consent: false, website: "" };
type FormData = typeof initialForm;

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 32 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: "-8%" }} transition={{ duration: .7, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const close = () => setOpen(false);
  return <>
    <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
      <a className="logo" href="#accueil" aria-label="MH Nettoyage 17, accueil"><Image src="/images/logo.jpg" alt="Logo MH Nettoyage 17" width={150} height={150} priority /></a>
      <nav className="nav" aria-label="Navigation principale"><a href="#studio">L’entreprise</a><a href="#services">Services</a><a href="#methode">Méthode</a><a href="#contact">Contact</a></nav>
      <a className="nav-cta" href="#rendez-vous"><span>Prendre rendez-vous</span><ArrowRight size={17} /></a>
      <button className="menu-button" type="button" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </header>
    <AnimatePresence>{open && <motion.div className="mobile-nav" initial={{ clipPath: "inset(0 0 100% 0)" }} animate={{ clipPath: "inset(0 0 0% 0)" }} exit={{ clipPath: "inset(0 0 100% 0)" }} transition={{ duration: .45, ease: [.76, 0, .24, 1] }}><div className="mobile-links"><a onClick={close} href="#studio">L’entreprise</a><a onClick={close} href="#services">Services</a><a onClick={close} href="#methode">Méthode</a><a onClick={close} href="#contact">Contact</a></div><a onClick={close} className="mobile-book" href="#rendez-vous">Réserver un créneau <ArrowRight /></a><p>Charente-Maritime · Secteur 17</p></motion.div>}</AnimatePresence>
  </>;
}

function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "8%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-7%"]);
  return <section className="hero" id="accueil" ref={heroRef}>
    <motion.div className="hero-media" style={{ y: imageY }}><Image src="/images/hero-v2.png" alt="Finition professionnelle d’une berline noire dans un studio automobile" fill priority sizes="100vw" /></motion.div>
    <motion.div className="hero-content" style={{ y: copyY }}>
      <div className="hero-copy-v2">
        <motion.p className="hero-label" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>Nettoyage automobile premium <span>·</span> Charente-Maritime</motion.p>
        <motion.h1 initial={reduce ? false : { opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .1, ease: [.22, 1, .36, 1] }}>Le détail qui<br /><span>change tout.</span></motion.h1>
        <motion.p className="hero-description" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .3 }}>Intérieur, extérieur ou soin complet. Votre véhicule retrouve une finition impeccable, réalisée avec méthode et exigence.</motion.p>
        <motion.div className="hero-actions-v2" initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .45 }}>
          <a className="hero-primary" href="#rendez-vous">Prendre rendez-vous <ArrowRight size={18} /></a>
          <a className="hero-secondary" href="#services">Voir les prestations <ArrowDown size={16} /></a>
        </motion.div>
        <motion.div className="hero-availability" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .7 }}><i /> Sur rendez-vous · Secteur 17</motion.div>
      </div>
    </motion.div>
  </section>;
}

function Marquee() {
  return <div className="marquee" aria-label="Nos engagements"><motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}>{[0, 1].map((loop) => <div className="marquee-set" key={loop}><span>Nettoyage intérieur</span><i /><span>Lavage extérieur</span><i /><span>Soin esthétique</span><i /><span>Particuliers & professionnels</span><i /></div>)}</motion.div></div>;
}

function Studio() {
  return <section className="studio section" id="studio">
    <Reveal className="studio-title"><p className="overline">MH Nettoyage 17</p><h2>Plus qu’un lavage.<br /><em>Un vrai soin.</em></h2></Reveal>
    <div className="studio-layout">
      <Reveal className="studio-statement"><p>Nous traitons chaque véhicule comme une pièce unique.</p></Reveal>
      <Reveal className="studio-copy" delay={.08}><p>Une méthode précise, des produits choisis selon les matières et un contrôle attentif des finitions. Vous savez ce qui sera fait, pourquoi, et à quoi vous attendre.</p><a className="underlined-link" href="#methode">Notre façon de travailler <ArrowRight size={16} /></a></Reveal>
      <Reveal className="studio-metrics" delay={.16}><div><strong>01</strong><span>Interlocuteur unique</span></div><div><strong>100%</strong><span>Prestation adaptée</span></div><div><strong>17</strong><span>Charente-Maritime</span></div></Reveal>
    </div>
  </section>;
}

function Services() {
  const [active, setActive] = useState(2);
  return <section className="service-section" id="services">
    <div className="service-intro section"><Reveal><p className="overline light-text">Prestations</p><h2>Choisissez votre<br /><em>niveau de soin.</em></h2></Reveal><Reveal delay={.1}><p>Un point de départ clair, puis une recommandation adaptée au gabarit et à l’état réel de votre véhicule.</p></Reveal></div>
    <div className="service-explorer">
      <div className="service-list" role="tablist" aria-label="Prestations disponibles">{services.map((service, index) => <button key={service.name} role="tab" aria-selected={active === index} className={active === index ? "active" : ""} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)}><span>{service.number}</span><strong>{service.name}</strong><ArrowRight /></button>)}</div>
      <div className="service-visual">
        <AnimatePresence mode="wait"><motion.div className="service-image" key={active} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .45 }}><Image src="/images/hero-detailing.png" alt="Soin automobile MH Nettoyage 17" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectPosition: services[active].position }} /></motion.div></AnimatePresence>
        <motion.div className="service-caption" key={`caption-${active}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><span>{services[active].short}</span><p>{services[active].description}</p><small>{services[active].detail}</small><a href="#rendez-vous" onClick={() => window.dispatchEvent(new CustomEvent("select-service", { detail: services[active].name }))}>Choisir cette prestation <ArrowRight size={17} /></a></motion.div>
      </div>
    </div>
  </section>;
}

function Method() {
  const steps = [
    { icon: <CalendarDays />, n: "01", title: "Votre demande", copy: "Vous choisissez la prestation, le véhicule et le créneau qui vous conviennent." },
    { icon: <ShieldCheck />, n: "02", title: "Notre confirmation", copy: "Nous vérifions le besoin, précisons le tarif et confirmons le rendez-vous avec vous." },
    { icon: <Sparkles />, n: "03", title: "Le résultat", copy: "Le véhicule est traité avec soin puis contrôlé avant sa restitution." },
  ];
  return <section className="method section" id="methode"><Reveal className="method-heading"><p className="overline">Une expérience simple</p><h2>Vous réservez.<br /><em>Nous faisons le reste.</em></h2></Reveal><div className="method-steps">{steps.map((step, index) => <Reveal className="method-step" delay={index * .1} key={step.n}><div className="step-top"><span>{step.n}</span>{step.icon}</div><h3>{step.title}</h3><p>{step.copy}</p></Reveal>)}</div></section>;
}

function QualityBand() {
  return <section className="quality-band"><div className="quality-photo"><Image src="/images/hero-detailing.png" alt="Finition d’une carrosserie noire" fill sizes="100vw" /></div><div className="quality-content"><Reveal><p className="overline light-text">Notre exigence</p><blockquote>“Un véhicule propre se remarque. Un véhicule soigné se ressent.”</blockquote><div className="quality-points"><span><Check /> Produits adaptés</span><span><Check /> Gestes maîtrisés</span><span><Check /> Contrôle final</span></div></Reveal></div></section>;
}

function AppointmentForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialForm);
  const [status, setStatus] = useState<{ type: "" | "error" | "success"; message: string }>({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const minDate = new Date().toISOString().split("T")[0];
  useEffect(() => {
    const select = ((event: CustomEvent<string>) => { setData((current) => ({ ...current, service: event.detail })); setStep(1); }) as EventListener;
    window.addEventListener("select-service", select); return () => window.removeEventListener("select-service", select);
  }, []);
  const update = (field: keyof FormData, value: string | boolean) => setData((current) => ({ ...current, [field]: value }));
  const next = () => {
    if (step === 1 && (!data.service || !data.vehicle)) return setStatus({ type: "error", message: "Choisissez une prestation et un type de véhicule." });
    if (step === 2 && (!data.date || !data.time)) return setStatus({ type: "error", message: "Choisissez une date et un créneau." });
    setStatus({ type: "", message: "" }); setStep((value) => Math.min(3, value + 1));
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (data.name.length < 2 || !data.phone || !/^\S+@\S+\.\S+$/.test(data.email) || !data.consent) return setStatus({ type: "error", message: "Complétez vos coordonnées et acceptez l’utilisation de vos informations." });
    setLoading(true); setStatus({ type: "", message: "" });
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message);
      setStatus({ type: "success", message: "Votre demande est transmise. Nous vous recontacterons pour confirmer le créneau." }); setData(initialForm); setStep(1);
    } catch (error) { setStatus({ type: "error", message: error instanceof Error ? error.message : "L’envoi a échoué." }); }
    finally { setLoading(false); }
  }
  return <section className="booking-section" id="rendez-vous"><div className="booking-intro"><Reveal><p className="overline light-text">Prendre rendez-vous</p><h2>Votre véhicule mérite <em>ce qu’il y a de mieux.</em></h2><p className="booking-lead">Quelques informations suffisent. Nous vous recontactons ensuite pour valider le besoin, le tarif et le créneau.</p><div className="booking-facts"><div><MapPin /><span><strong>Secteur</strong>Charente-Maritime</span></div><div><Clock3 /><span><strong>Disponibilité</strong>Sur rendez-vous</span></div></div></Reveal></div>
    <form className="step-form" onSubmit={submit} noValidate>
      <div className="step-progress"><div>{[1, 2, 3].map((item) => <span className={item <= step ? "active" : ""} key={item} />)}</div><p>Étape {step} sur 3</p></div>
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 && <motion.div className="form-step" key="one" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}><span className="form-question">01 · Votre besoin</span><h3>Que pouvons-nous faire pour vous ?</h3><label>Prestation<select value={data.service} onChange={(e) => update("service", e.target.value)}><option value="">Choisir une prestation</option>{services.map((service) => <option key={service.name}>{service.name}</option>)}<option>Besoin spécifique</option></select></label><label>Type de véhicule<select value={data.vehicle} onChange={(e) => update("vehicle", e.target.value)}><option value="">Choisir un véhicule</option><option>Citadine</option><option>Berline</option><option>SUV / 4x4</option><option>Utilitaire</option><option>Autre</option></select></label><button className="form-next" type="button" onClick={next}>Continuer <ArrowRight /></button></motion.div>}
        {step === 2 && <motion.div className="form-step" key="two" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}><span className="form-question">02 · Votre créneau</span><h3>Quand souhaitez-vous venir ?</h3><label>Date souhaitée<input type="date" min={minDate} value={data.date} onChange={(e) => update("date", e.target.value)} /></label><label>Moment de la journée<select value={data.time} onChange={(e) => update("time", e.target.value)}><option value="">Choisir un créneau</option><option>Matin</option><option>Début d’après-midi</option><option>Fin d’après-midi</option></select></label><div className="form-actions"><button className="form-back" type="button" onClick={() => setStep(1)}><ChevronLeft /> Retour</button><button className="form-next" type="button" onClick={next}>Continuer <ArrowRight /></button></div></motion.div>}
        {step === 3 && <motion.div className="form-step" key="three" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}><span className="form-question">03 · Vos coordonnées</span><h3>Comment vous recontacter ?</h3><div className="field-pair"><label>Nom et prénom<input type="text" autoComplete="name" value={data.name} onChange={(e) => update("name", e.target.value)} /></label><label>Téléphone<input type="tel" autoComplete="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} /></label></div><label>Adresse e-mail<input type="email" autoComplete="email" value={data.email} onChange={(e) => update("email", e.target.value)} /></label><label>Précisions <small>Facultatif</small><textarea rows={3} maxLength={1000} value={data.message} onChange={(e) => update("message", e.target.value)} /></label><label className="hidden-field" aria-hidden="true">Site<input type="text" tabIndex={-1} autoComplete="off" value={data.website} onChange={(e) => update("website", e.target.value)} /></label><label className="consent"><input type="checkbox" checked={data.consent} onChange={(e) => update("consent", e.target.checked)} /><span>J’accepte que mes informations soient utilisées pour me recontacter au sujet de cette demande.</span></label><div className="form-actions"><button className="form-back" type="button" onClick={() => setStep(2)}><ChevronLeft /> Retour</button><button className="form-next" type="submit" disabled={loading}>{loading ? "Envoi…" : "Envoyer la demande"} <ArrowRight /></button></div></motion.div>}
      </AnimatePresence>
      {status.message && <motion.p role="status" className={`form-message ${status.type}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{status.message}</motion.p>}
      <div className="secure-note"><ShieldCheck /> Transmission sécurisée · Données non revendues</div>
    </form>
  </section>;
}

function Footer() {
  const [dialog, setDialog] = useState<"legal" | "privacy" | null>(null);
  return <><footer id="contact"><div className="footer-top"><div><Image src="/images/logo.jpg" alt="MH Nettoyage 17" width={150} height={150} /><p>Propreté & services automobiles<br />en Charente-Maritime.</p></div><div className="footer-cta"><span>Prêt à retrouver votre véhicule ?</span><a href="#rendez-vous">Réserver un rendez-vous <ArrowRight /></a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} MH Nettoyage 17</span><div><button onClick={() => setDialog("legal")}>Mentions légales</button><button onClick={() => setDialog("privacy")}>Confidentialité</button></div><a href="#accueil">Retour en haut <ArrowDown /></a></div></footer>
    <AnimatePresence>{dialog && <motion.div className="dialog-backdrop" role="presentation" onMouseDown={() => setDialog(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(e) => e.stopPropagation()} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}><button className="dialog-close" onClick={() => setDialog(null)} aria-label="Fermer"><X /></button><p className="overline">Informations</p><h2 id="dialog-title">{dialog === "legal" ? "Mentions légales" : "Confidentialité"}</h2>{dialog === "legal" ? <><p><strong>Éditeur :</strong> MH Nettoyage 17, entreprise de nettoyage automobile en Charente-Maritime.</p><p>Les informations administratives complètes, le SIRET, l’adresse, les coordonnées et l’hébergeur doivent être renseignés avant publication.</p></> : <><p>Les informations transmises sont utilisées uniquement pour répondre à votre demande et organiser la prestation. Elles ne sont jamais revendues.</p><p>Vous pouvez demander l’accès, la rectification ou la suppression de vos données via les coordonnées officielles qui seront publiées avant la mise en ligne.</p></>}</motion.div></motion.div>}</AnimatePresence></>;
}

export function Site() {
  const { scrollYProgress } = useScroll();
  return <><motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} /><a className="skip-link" href="#main">Aller au contenu</a><Header /><main id="main"><Hero /><Marquee /><Studio /><Services /><Method /><QualityBand /><AppointmentForm /></main><Footer /><a className="mobile-fab" href="#rendez-vous"><CalendarDays /> Rendez-vous</a></>;
}
