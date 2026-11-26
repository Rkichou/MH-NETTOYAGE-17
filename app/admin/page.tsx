import type { Metadata } from "next";
import { Admin } from "./panel";
import "./admin.css";

export const metadata: Metadata = { title: "Administration | MH Nettoyage 17", robots: { index: false, follow: false }, alternates: { canonical: "/admin" } };

export default function AdminPage() { return <Admin />; }
