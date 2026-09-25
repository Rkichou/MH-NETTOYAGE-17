import { ArrowUpRight, MapPin } from "lucide-react";

const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2766.188193542297!2d-0.9991157149967532!3d46.10715687411142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4801491485b020cf%3A0x493b56767bdf0c86!2s107%20Av.%20de%20la%20Lib%C3%A9ration%2C%2017220%20Croix-Chapeau!5e0!3m2!1sfr!2sfr!4v1790303310356!5m2!1sfr!2sfr";

export function Location() {
  return (
    <section className="location section" id="localisation" aria-labelledby="location-title">
      <div className="location-heading">
        <div><p className="overline">Croix-Chapeau · Charente-Maritime</p><h2 id="location-title">Où nous <em>trouver.</em></h2></div>
        <div className="location-details">
          <address><MapPin size={22} aria-hidden="true" /><span>107 avenue de la Libération<br />17220 Croix-Chapeau</span></address>
          <a href="https://www.google.com/maps/dir/?api=1&destination=107%20avenue%20de%20la%20Lib%C3%A9ration%2C%2017220%20Croix-Chapeau" target="_blank" rel="noopener noreferrer">Itinéraire sur Google Maps <ArrowUpRight size={18} aria-hidden="true" /><span className="location-sr-only"> (nouvel onglet)</span></a>
        </div>
      </div>
      <iframe className="location-map" src={mapUrl} title="Localisation : 107 avenue de la Libération, 17220 Croix-Chapeau" width="1280" height="450" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
    </section>
  );
}
