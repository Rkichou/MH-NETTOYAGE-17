"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowUp, ArrowUpRight, CalendarDays } from "lucide-react";
import { Modal } from "./modal";
import { useSiteMotion } from "./motion-provider";
import { Reveal } from "./reveal";

export function Footer() {
  const [dialog, setDialog] = useState<"legal" | "privacy" | null>(null);
  const { enabled, toggle } = useSiteMotion();
  return <><footer id="contact"><Reveal className="footer-invitation"><p className="overline light-text">MH Nettoyage 17 · Charente-Maritime</p><h2>PRÊT À<br />REDONNER DE<br /><em>L’ÉCLAT ?</em></h2><a href="#rendez-vous">Réserver un rendez-vous <ArrowUpRight /></a></Reveal><div className="footer-top"><div><Image src="/images/logo.jpg" alt="MH Nettoyage 17" width={150} height={150} /><p>Nettoyage, lavage et entretien esthétique automobile.<br />Particuliers et professionnels · Secteur 17.</p></div><div className="footer-motion"><span>Motion</span><button type="button" role="switch" aria-label="Activer les animations" aria-checked={enabled} onClick={toggle}><span className="toggle-track"><span /></span>{enabled ? "On" : "Off"}</button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} MH Nettoyage 17</span><div><button onClick={() => setDialog("legal")}>Mentions légales</button><button onClick={() => setDialog("privacy")}>Confidentialité</button></div><a href="#accueil">Retour en haut <ArrowUp /></a></div><div className="footer-wordmark" aria-hidden="true">MH NETTOYAGE 17</div></footer>
    {dialog && <Modal title={dialog === "legal" ? "Mentions légales" : "Confidentialité"} onClose={() => setDialog(null)}>{dialog === "legal" ? <><p>MH Nettoyage 17 présente ses prestations de nettoyage et d’entretien esthétique automobile en Charente-Maritime.</p><p>Une demande de rendez-vous ne vaut pas réservation confirmée. La prestation, son tarif et le créneau sont précisés lors de notre échange.</p><p>Le logo est celui de MH Nettoyage 17. Les photographies d’illustration ont été générées et ne représentent pas des réalisations clients.</p></> : <><p>Les coordonnées et informations de véhicule transmises servent à répondre à votre demande et à préparer votre rendez-vous. Le consentement recueilli ne concerne aucune prospection commerciale.</p><p>Les données sont destinées à MH Nettoyage 17. Le prestataire Resend intervient pour acheminer la demande par e-mail. Elles ne sont pas revendues.</p><p>Vous pouvez exercer vos droits d’accès, de rectification et d’effacement en répondant à l’échange de suivi de votre demande.</p><p>Aucun traceur publicitaire n’est utilisé. Le choix des animations est mémorisé localement dans votre navigateur et peut être modifié à tout moment.</p></>}</Modal>}
  </>;
}
export function MobileBookingLink() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 });
    const section = document.getElementById("rendez-vous"); if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);
  return visible ? <a className="mobile-fab" href="#rendez-vous"><CalendarDays /> Rendez-vous</a> : null;
}
