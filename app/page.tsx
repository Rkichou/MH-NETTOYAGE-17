import { Site } from "@/components/site";

const businessSchema = {
  "@context": "https://schema.org", "@type": "AutoWash", name: "MH Nettoyage 17",
  description: "Nettoyage, lavage et entretien esthétique automobile en Charente-Maritime.",
  areaServed: "Charente-Maritime",
  ...(process.env.SITE_URL ? { url: process.env.SITE_URL, image: new URL("/images/logo.jpg", process.env.SITE_URL).href } : {}),
};

export default function Home() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} /><Site /></>;
}
