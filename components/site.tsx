"use client";
import { MotionProvider } from "./motion-provider";
import { Header } from "./header";
import { Hero } from "./hero";
import { Marquee } from "./marquee";
import { Studio } from "./studio";
import { WhyChooseUs } from "./why-choose-us";
import { Services } from "./services";
import { Gallery } from "./gallery";
import { Method } from "./method";
import { ExpandingVisual } from "./expanding-visual";
import { DetailSpotlight } from "./detail-spotlight";
import { StickyServices } from "./sticky-services";
import { AppointmentForm } from "./appointment-form";
import { Footer, MobileBookingLink } from "./footer";

export function Site() {
  return <MotionProvider><a className="skip-link" href="#main">Aller au contenu</a><Header /><main id="main"><Hero /><Marquee /><Studio /><WhyChooseUs /><Services /><Gallery /><Method /><AppointmentForm /></main><Footer /><MobileBookingLink /></MotionProvider>;
}
