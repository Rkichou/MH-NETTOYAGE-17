"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useScroll } from "motion/react";
import { ArrowRight, Menu } from "lucide-react";
import { Modal } from "./modal";
import { useSiteMotion } from "./motion-provider";
const links = [["#studio", "L’entreprise"], ["#services", "Services"], ["#methode", "Méthode"], ["#contact", "Contact"]];
export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { enabled } = useSiteMotion();
  const { scrollYProgress } = useScroll();
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <><motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} /><header className={`header ${scrolled ? "is-scrolled" : ""}`}>
    <a className="logo" href="#accueil" aria-label="MH Nettoyage 17, accueil"><Image src="/images/logo.jpg" alt="MH Nettoyage 17" width={150} height={150} priority /></a>
    <nav className="nav" aria-label="Navigation principale">{links.map(([href, text]) => <a key={href} href={href}>{text}</a>)}</nav>
    <a className="nav-cta" href="#rendez-vous">Prendre rendez-vous <ArrowRight size={17} /></a>
    <button className="menu-button" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)}><Menu /></button>
  </header>{open && <Modal title="Navigation" className="menu-modal" onClose={() => setOpen(false)}><nav aria-label="Navigation mobile">{links.map(([href, text], i) => <motion.a key={href} href={href} initial={enabled ? { opacity: 0, y: 20 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: enabled ? i * .06 : 0 }} onClick={() => setOpen(false)}>{text}</motion.a>)}</nav><a className="hero-primary" href="#rendez-vous" onClick={() => setOpen(false)}>Prendre rendez-vous <ArrowRight /></a><p>Charente-Maritime · Secteur 17</p></Modal>}</>;
}
