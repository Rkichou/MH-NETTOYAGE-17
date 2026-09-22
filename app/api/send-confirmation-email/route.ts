import { NextRequest, NextResponse } from "next/server";

type ConfirmationPayload = {
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  date?: string;
  time?: string;
  address?: string | null;
  message?: string | null;
};

const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isAllowedOrigin(request: NextRequest) {
  const siteUrl = process.env.SITE_URL;
  const origin = request.headers.get("origin");
  if (!siteUrl || !origin) return true;

  try {
    return new URL(origin).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}

function textLine(label: string, value: string | null) {
  return value ? `${label} : ${value}\n` : "";
}

function htmlRow(label: string, value: string | null) {
  if (!value) return "";
  return `<tr><td style="padding:8px 0;color:#6f6b61;">${escapeHtml(label)}</td><td style="padding:8px 0;color:#1e1e1a;font-weight:700;">${escapeHtml(value)}</td></tr>`;
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ message: "Origine non autorisee." }, { status: 403 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "MH Nettoyage 17";

  if (!apiKey || !senderEmail) {
    console.error("Brevo configuration missing.");
    return NextResponse.json({ message: "Email de confirmation indisponible." }, { status: 503 });
  }

  let payload: ConfirmationPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Donnees invalides." }, { status: 400 });
  }

  const name = clean(payload.name);
  const phone = clean(payload.phone);
  const email = clean(payload.email);
  const service = clean(payload.service);
  const date = clean(payload.date);
  const time = clean(payload.time);
  const address = clean(payload.address);
  const message = clean(payload.message);

  if (
    name.length < 2 ||
    phone.length < 8 ||
    !emailPattern.test(email) ||
    service.length < 1 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    time.length < 1
  ) {
    return NextResponse.json({ message: "Donnees invalides." }, { status: 400 });
  }

  const textContent =
    `Bonjour ${name},\n\n` +
    "Nous avons bien recu votre demande de rendez-vous.\n\n" +
    "Recapitulatif de votre reservation :\n" +
    textLine("Service", service) +
    textLine("Date souhaitee", date) +
    textLine("Heure souhaitee", time) +
    textLine("Telephone", phone) +
    textLine("Adresse", address || null) +
    textLine("Message", message || null) +
    "Statut : demande en attente de confirmation\n\n" +
    "Votre demande est actuellement en attente de confirmation. Nous vous recontacterons rapidement pour valider le rendez-vous.\n\n" +
    "Merci pour votre confiance.\n\nMH Nettoyage 17";

  const htmlContent = `
    <div style="margin:0;padding:0;background:#f6f4ef;font-family:Arial,sans-serif;color:#1e1e1a;">
      <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
        <div style="background:#ffffff;border:1px solid #e4dfd4;border-radius:10px;padding:28px;">
          <p style="margin:0 0 16px;font-size:16px;">Bonjour ${escapeHtml(name)},</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.6;">Nous avons bien recu votre demande de rendez-vous.</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#1e1e1a;">Recapitulatif de votre reservation</h1>
          <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee8dc;border-bottom:1px solid #eee8dc;margin:0 0 22px;">
            ${htmlRow("Service", service)}
            ${htmlRow("Date souhaitee", date)}
            ${htmlRow("Heure souhaitee", time)}
            ${htmlRow("Telephone", phone)}
            ${htmlRow("Adresse", address || null)}
            ${htmlRow("Message", message || null)}
            ${htmlRow("Statut", "Demande en attente de confirmation")}
          </table>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Votre demande est actuellement en attente de confirmation. Nous vous recontacterons rapidement pour valider le rendez-vous.</p>
          <p style="margin:0;font-size:16px;line-height:1.6;">Merci pour votre confiance.</p>
          <p style="margin:22px 0 0;color:#8a713f;font-weight:700;">MH Nettoyage 17</p>
        </div>
      </div>
    </div>`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email, name }],
      subject: "Confirmation de votre demande de rendez-vous",
      textContent,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Brevo confirmation email failed.", response.status, detail);
    return NextResponse.json({ message: "Email de confirmation indisponible." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
