import { NextRequest, NextResponse } from "next/server";

const services = new Set(["Lavage extérieur", "Nettoyage intérieur", "Nettoyage complet", "Rénovation esthétique", "Solution professionnelle", "Besoin spécifique"]);
const vehicles = new Set(["Citadine", "Berline", "SUV / 4x4", "Utilitaire", "Autre"]);
const times = new Set(["Matin", "Début d’après-midi", "Fin d’après-midi"]);
const attempts = new Map<string, number[]>();

function clean(value: unknown, max = 200) { return typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, max) : ""; }

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < 15 * 60 * 1000);
  if (recent.length >= 5) return NextResponse.json({ message: "Trop de demandes ont été envoyées. Réessayez dans quelques minutes." }, { status: 429 });
  attempts.set(ip, [...recent, now]);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Demande invalide." }, { status: 400 }); }
  const data = {
    name: clean(body.name, 80), phone: clean(body.phone, 20), email: clean(body.email, 120), service: clean(body.service, 60),
    vehicle: clean(body.vehicle, 40), date: clean(body.date, 10), time: clean(body.time, 40), message: clean(body.message, 1000), website: clean(body.website, 100),
  };
  const badIdentity = data.name.length < 2 || !/^(?=.*\d)[+\d\s().-]{8,20}$/.test(data.phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const badChoices = !services.has(data.service) || !vehicles.has(data.vehicle) || !times.has(data.time) || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) || body.consent !== true;
  if (data.website || badIdentity || badChoices) return NextResponse.json({ message: "Certaines informations sont invalides." }, { status: 400 });
  const requestedDate = new Date(`${data.date}T23:59:59`);
  if (Number.isNaN(requestedDate.getTime()) || requestedDate < new Date()) return NextResponse.json({ message: "La date souhaitée est invalide." }, { status: 400 });

  const { RESEND_API_KEY, APPOINTMENT_TO_EMAIL, APPOINTMENT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !APPOINTMENT_TO_EMAIL || !APPOINTMENT_FROM_EMAIL) return NextResponse.json({ message: "Le service de rendez-vous est en cours de configuration." }, { status: 503 });
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: APPOINTMENT_FROM_EMAIL, to: [APPOINTMENT_TO_EMAIL], reply_to: data.email,
      subject: `Nouvelle demande - ${data.service} - ${data.name}`,
      text: `Nom : ${data.name}\nTéléphone : ${data.phone}\nE-mail : ${data.email}\nPrestation : ${data.service}\nVéhicule : ${data.vehicle}\nDate : ${data.date}\nCréneau : ${data.time}\n\nMessage :\n${data.message || "Aucune précision"}` }),
  });
  if (!result.ok) return NextResponse.json({ message: "L’envoi a échoué. Réessayez dans quelques instants." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
