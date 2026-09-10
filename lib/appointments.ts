import { services } from "./services";
export const serviceNames = [...services.map((s) => s.name), "Besoin spécifique"];
export const vehicles = ["Citadine", "Berline", "SUV / 4x4", "Utilitaire", "Autre"];
export const times = ["Matin", "Début d’après-midi", "Fin d’après-midi"];
export const emptyAppointment = { service: "", vehicle: "", date: "", time: "", name: "", phone: "", email: "", message: "", website: "", consent: false };
export type Appointment = typeof emptyAppointment;
export type Errors = Partial<Record<keyof Appointment, string>>;
export function parisToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return ["year", "month", "day"].map((key) => parts.find((p) => p.type === key)!.value).join("-");
}
export function validateAppointment(data: Appointment, step?: number): Errors {
  const errors: Errors = {};
  if (!step || step === 1) {
    if (!serviceNames.includes(data.service)) errors.service = "Choisissez une prestation.";
    if (!vehicles.includes(data.vehicle)) errors.vehicle = "Choisissez un véhicule.";
  }
  if (!step || step === 2) {
    const parsed = new Date(`${data.date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== data.date || data.date < parisToday()) errors.date = "Choisissez une date valide, aujourd’hui ou plus tard.";
    if (!times.includes(data.time)) errors.time = "Choisissez un créneau.";
  }
  if (!step || step === 3) {
    if (data.name.trim().length < 2 || data.name.length > 80 || /[\r\n<>]/.test(data.name)) errors.name = "Indiquez votre nom (2 à 80 caractères).";
    if (!/^[+\d\s().-]{8,20}$/.test(data.phone) || data.phone.replace(/\D/g, "").length < 8) errors.phone = "Indiquez un numéro de téléphone valide.";
    if (data.email.length > 120 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)) errors.email = "Indiquez une adresse e-mail valide.";
    if (data.message.length > 1000) errors.message = "Limitez le message à 1 000 caractères.";
    if (data.consent !== true) errors.consent = "Votre accord est nécessaire pour traiter la demande.";
  }
  return errors;
}
