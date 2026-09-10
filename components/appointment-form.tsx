"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronLeft, Check, MapPin, Clock3, ShieldCheck } from "lucide-react";
import { Appointment, emptyAppointment, Errors, parisToday, serviceNames, times, validateAppointment, vehicles } from "@/lib/appointments";
import { useSiteMotion } from "./motion-provider";
import { Reveal } from "./reveal";

export function AppointmentForm() {
  const { enabled } = useSiteMotion();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<Appointment>({ ...emptyAppointment });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    const select = ((event: CustomEvent<string>) => {
      if (serviceNames.includes(event.detail)) { setData((current) => ({ ...current, service: event.detail })); setStep(1); setSuccess(false); setErrors({}); }
    }) as EventListener;
    window.addEventListener("select-service", select);
    return () => window.removeEventListener("select-service", select);
  }, []);
  const update = (name: keyof Appointment, value: string | boolean) => setData((current) => ({ ...current, [name]: value }));
  const moveStep = (next: number) => { moved.current = true; setDirection(next > step ? 1 : -1); setStep(next); setErrors({}); setMessage(""); };
  const error = (name: keyof Appointment) => errors[name] ? <small id={`${name}-error`} className="field-error">{errors[name]}</small> : null;
  const validate = () => {
    const result = validateAppointment(data, step); setErrors(result);
    const first = Object.keys(result)[0];
    if (first) { form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(); return false; }
    return true;
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    if (step < 3) { moveStep(step + 1); return; }
    if (loading) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "L’envoi a échoué. Réessayez dans quelques instants.");
      setSuccess(true); setData({ ...emptyAppointment });
    } catch (err) { setMessage(err instanceof Error ? err.message : "L’envoi a échoué."); }
    finally { setLoading(false); }
  }
  const select = (name: "service" | "vehicle" | "time", label: string, values: string[]) => <label>{label}<select name={name} required value={data[name]} onChange={(e) => update(name, e.target.value)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined}><option value="">Sélectionner</option>{values.map((value) => <option key={value}>{value}</option>)}</select>{error(name)}</label>;
  const variants = {
    enter: (d: number) => ({ opacity: enabled ? 0 : 1, x: enabled ? d * 28 : 0 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: enabled ? 0 : 1, x: enabled ? -d * 28 : 0 }),
  };
  return <section className="booking-section" id="rendez-vous"><div className="booking-intro"><Reveal><p className="overline">Prendre rendez-vous</p><h2>Votre véhicule mérite <em>le bon niveau de soin.</em></h2><p className="booking-lead">Quelques informations suffisent pour préparer votre rendez-vous.</p><div className="booking-facts"><div><MapPin /><span><strong>Secteur</strong>Charente-Maritime</span></div><div><Clock3 /><span><strong>Disponibilité</strong>Sur rendez-vous</span></div></div></Reveal></div>
    <form ref={form} className="step-form" onSubmit={submit} noValidate aria-busy={loading}>
      {success ? <motion.div className="booking-success" role="status" initial={enabled ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }}><Check size={40} /><h3>Votre demande est transmise.</h3><p>Nous vous recontacterons pour confirmer la prestation, le tarif et le créneau.</p><button type="button" className="form-next" onClick={() => { setSuccess(false); setStep(1); }}>Nouvelle demande <ArrowRight /></button></motion.div> : <>
        <div className="step-progress"><div aria-hidden="true">{[1, 2, 3].map((n) => <span key={n} className={n <= step ? "active" : ""} />)}</div><p aria-live="polite">Étape {step} sur 3</p></div>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: enabled ? .25 : 0 }} className="form-step" onAnimationComplete={() => { if (moved.current) { form.current?.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true }); moved.current = false; } }}>
            <span className="form-question">0{step} · {step === 1 ? "Votre besoin" : step === 2 ? "Votre créneau" : "Vos coordonnées"}</span>
            <h3 tabIndex={-1}>{step === 1 ? "Que pouvons-nous faire pour vous ?" : step === 2 ? "Quand souhaitez-vous venir ?" : "Comment vous recontacter ?"}</h3>
            {step === 1 && <>{select("service", "Prestation", serviceNames)}{select("vehicle", "Type de véhicule", vehicles)}</>}
            {step === 2 && <><label>Date souhaitée<input name="date" type="date" required min={parisToday()} value={data.date} onChange={(e) => update("date", e.target.value)} aria-invalid={!!errors.date} aria-describedby={errors.date ? "date-error" : undefined} />{error("date")}</label>{select("time", "Créneau souhaité", times)}</>}
            {step === 3 && <><div className="field-pair">{([['name', 'Nom et prénom', 'text', 'name'], ['phone', 'Téléphone', 'tel', 'tel']] as const).map(([name, label, type, autocomplete]) => <label key={name}>{label}<input name={name} type={type} required autoComplete={autocomplete} maxLength={name === "name" ? 80 : 20} value={data[name]} onChange={(e) => update(name, e.target.value)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} />{error(name)}</label>)}</div><label>Adresse e-mail<input name="email" type="email" autoComplete="email" required maxLength={120} value={data.email} onChange={(e) => update("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />{error("email")}</label><label>Message <small>Facultatif</small><textarea name="message" rows={3} maxLength={1000} value={data.message} onChange={(e) => update("message", e.target.value)} />{error("message")}</label><label className="consent"><input name="consent" type="checkbox" required checked={data.consent} onChange={(e) => update("consent", e.target.checked)} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "consent-error" : undefined} /><span>J’accepte que mes informations soient utilisées pour me recontacter au sujet de cette demande.</span></label>{error("consent")}</>}
            <div className="form-actions">{step > 1 && <button className="form-back" type="button" disabled={loading} onClick={() => moveStep(step - 1)}><ChevronLeft /> Retour</button>}<button className="form-next" type="submit" disabled={loading}>{loading ? "Envoi…" : step === 3 ? "Envoyer la demande" : "Continuer"}<ArrowRight /></button></div>
          </motion.div>
        </AnimatePresence>
      </>}
      <label className="hidden-field" aria-hidden="true">Site internet<input name="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={(e) => update("website", e.target.value)} /></label>
      <p className={message ? "form-message error" : "sr-only"} role="status" aria-live="polite">{message}</p>
      <div className="secure-note"><ShieldCheck /> Données utilisées uniquement pour votre demande</div>
    </form>
  </section>;
}
