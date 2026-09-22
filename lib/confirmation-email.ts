import { Appointment } from "./appointments";

export async function sendConfirmationEmail(data: Appointment) {
  const response = await fetch("/api/send-confirmation-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email,
      service: data.service,
      date: data.date,
      time: data.time,
      address: null,
      message: data.message || null,
    }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.message || "Email de confirmation indisponible.");
  }
}
