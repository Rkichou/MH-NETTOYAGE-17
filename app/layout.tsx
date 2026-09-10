import type { Metadata } from "next";
import "./globals.css";
import "./experience.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  ...(process.env.SITE_URL ? { metadataBase: new URL(process.env.SITE_URL), alternates: { canonical: "/" } } : {}),
  robots: { index: true, follow: true },
  twitter: { card: "summary_large_image", title: "MH Nettoyage 17", images: ["/images/hero-v2.png"] },
  title: "MH Nettoyage 17 | Nettoyage automobile en Charente-Maritime",
  description: "Nettoyage intérieur, lavage extérieur et entretien esthétique automobile en Charente-Maritime. Demandez votre rendez-vous.",
  openGraph: { title: "MH Nettoyage 17 | Propreté & services", description: "Le soin automobile jusque dans les moindres détails.", images: ["/images/hero-v2.png"], locale: "fr_FR", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
