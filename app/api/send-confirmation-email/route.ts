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

  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "MH Nettoyage 17";
  const notificationEmail = process.env.APPOINTMENT_TO_EMAIL?.trim();

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

  const adminText = "Nouvelle demande de rendez-vous\n\n" +
    textLine("Client", name) + textLine("Email", email) +
    textLine("Telephone", phone) + textLine("Service", service) +
    textLine("Date souhaitee", date) + textLine("Heure souhaitee", time) +
    textLine("Adresse", address || null) + textLine("Message", message || null) +
    "Statut : demande en attente de confirmation\n";
  let adminUrl = "";
  try {
    const configuredUrl = new URL(process.env.SITE_URL || "");
    if (configuredUrl.protocol === "https:") adminUrl = new URL("/admin", configuredUrl.origin).href;
  } catch { /* The summary remains available without an admin link. */ }
  const adminHtml = `<div style="font-family:Arial,sans-serif;color:#1e1e1a;max-width:620px;margin:auto;padding:28px;border-top:4px solid #b3945b;">
    <p style="color:#806735;font-weight:bold;">MH Nettoyage 17</p>
    <h1 style="font-size:24px;">Nouvelle demande de rendez-vous</h1>
    <table style="width:100%;border-collapse:collapse;">
      ${htmlRow("Client", name)}${htmlRow("Email", email)}${htmlRow("Telephone", phone)}
      ${htmlRow("Service", service)}${htmlRow("Date souhaitee", date)}${htmlRow("Heure souhaitee", time)}
      ${htmlRow("Adresse", address || null)}${htmlRow("Message", message || null)}
      ${htmlRow("Statut", "En attente de confirmation")}
    </table>
    ${adminUrl ? `<p><a href="${escapeHtml(adminUrl)}" style="color:#806735;">Consulter les demandes dans l'administration</a></p>` : ""}
    <p>Repondez a cet email pour contacter le client et confirmer son rendez-vous.</p>
  </div>`;

  const deliver = async (content: Record<string, unknown>) => {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      ...content,
    }),
    signal: AbortSignal.timeout(12000),
  });
    if (!response.ok) throw new Error(`Brevo HTTP ${response.status}`);
  };

  const [confirmation, notification] = await Promise.allSettled([
    deliver({ to: [{ email, name }], subject: "Confirmation de votre demande de rendez-vous", textContent, htmlContent }),
    notificationEmail && emailPattern.test(notificationEmail)
      ? deliver({ to: [{ email: notificationEmail }], replyTo: { email, name }, subject: "Nouvelle demande de rendez-vous - MH Nettoyage 17", textContent: adminText + (adminUrl ? `\nAdministration : ${adminUrl}\n` : ""), htmlContent: adminHtml })
      : Promise.reject(new Error("APPOINTMENT_TO_EMAIL missing or invalid")),
  ]);
  if (notification.status === "rejected") {
    console.error("Brevo admin notification failed.", notification.reason instanceof Error ? notification.reason.message : "Delivery failed");
  }
  if (confirmation.status === "rejected") {
    console.error("Brevo confirmation email failed.", confirmation.reason instanceof Error ? confirmation.reason.message : "Delivery failed");
    return NextResponse.json({ message: "Email de confirmation indisponible." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
