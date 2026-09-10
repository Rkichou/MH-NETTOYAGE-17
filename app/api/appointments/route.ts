import { NextRequest, NextResponse } from "next/server";
import { Appointment, emptyAppointment, validateAppointment } from "@/lib/appointments";
import { createHash, randomUUID } from "node:crypto";

const attempts = new Map<string, number[]>();
const windowMs = 15 * 60 * 1000;
const json = (message: string, status: number) => NextResponse.json({ message }, { status });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return json("Origine de la demande refusée.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json("Format de demande invalide.", 415);
  // Forwarded addresses are trusted only behind a configured, sanitizing reverse proxy.
  const rawIp = process.env.TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown" : "local";
  const key = createHash("sha256").update(rawIp).digest("hex");
  const now = Date.now();
  for (const [ip, values] of attempts) if (!values.some((time) => now - time < windowMs)) attempts.delete(ip);
  const recent = (attempts.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= 5 || attempts.size >= 10000) return NextResponse.json({ message: "Trop de demandes. Réessayez dans 15 minutes." }, { status: 429, headers: { "Retry-After": "900" } });
  attempts.set(key, [...recent, now]);

  let body: unknown;
  try {
    const reader = request.body?.getReader(); if (!reader) return json("Demande vide.", 400);
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 12000) { await reader.cancel(); return json("Demande trop volumineuse.", 413); } chunks.push(value); }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return json("Demande invalide.", 400); }
  if (!body || Array.isArray(body) || typeof body !== "object") return json("Demande invalide.", 400);
  const record = body as Record<string, unknown>;
  const data = { ...emptyAppointment };
  for (const field of Object.keys(emptyAppointment) as (keyof Appointment)[]) {
    if (field === "consent") { data.consent = record.consent === true; continue; }
    if (record[field] !== undefined && typeof record[field] !== "string") return json("Données invalides.", 400);
    data[field] = ((record[field] as string) || "").trim().replace(/\u0000/g, "");
  }
  if (data.website) return json("Demande invalide.", 400);
  const errors = validateAppointment(data);
  if (Object.keys(errors).length) return NextResponse.json({ message: Object.values(errors)[0], errors }, { status: 400 });
  const { RESEND_API_KEY, APPOINTMENT_TO_EMAIL, APPOINTMENT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !APPOINTMENT_TO_EMAIL || !APPOINTMENT_FROM_EMAIL) return json("L’envoi est momentanément indisponible. Votre demande n’a pas été transmise. Réessayez plus tard.", 503);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": randomUUID() },
      body: JSON.stringify({ from: APPOINTMENT_FROM_EMAIL, to: [APPOINTMENT_TO_EMAIL], reply_to: data.email,
        subject: `Demande de rendez-vous - ${data.service}`,
        text: `Nom : ${data.name}\nTéléphone : ${data.phone}\nE-mail : ${data.email}\nPrestation : ${data.service}\nVéhicule : ${data.vehicle}\nDate souhaitée : ${data.date}\nCréneau : ${data.time}\n\n${data.message}\n\nAccord pour être recontacté : oui` }),
    });
    if (!response.ok) return json("L’envoi a échoué. Merci de réessayer ultérieurement.", 502);
    return NextResponse.json({ ok: true });
  } catch { return json("L’envoi a échoué. Merci de réessayer ultérieurement.", 502); }
}
