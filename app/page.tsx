import { Site } from "@/components/site";

const businessSchema = {
  "@context": "https://schema.org", "@type": "AutoWash", name: "MH Nettoyage 17",
  description: "Nettoyage, lavage et entretien esthétique automobile en Charente-Maritime.",
  areaServed: "Charente-Maritime", image: "https://mh-nettoyage17.fr/images/logo.jpg", priceRange: "€€",
};

export default function Home() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} /><Site /></>;
}
