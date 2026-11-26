"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { browserSessionPersistence, onIdTokenChanged, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query, startAfter, where, type QueryDocumentSnapshot } from "firebase/firestore";
import { ArrowLeft, ArrowRight, LogOut, Mail, Phone } from "lucide-react";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";

const statusNames: Record<string, string> = { pending: "En attente", confirmed: "Confirmée", cancelled: "Annulée", completed: "Terminée" };
const value = (doc: QueryDocumentSnapshot, field: string) => typeof doc.get(field) === "string" ? doc.get(field) as string : "";

export function Admin() {
  const [session, setSession] = useState<{ user: User | null; allowed: boolean; ready: boolean }>({ user: null, allowed: false, ready: false });
  const [failure, setFailure] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    let revision = 0;
    try {
      const stop = onIdTokenChanged(getFirebaseAuth(), async user => {
        const current = ++revision;
        setSession({ user: null, allowed: false, ready: false });
        try {
          const allowed = user ? (await user.getIdTokenResult()).claims.admin === true : false;
          if (active && current === revision) setSession({ user, allowed, ready: true });
        } catch { if (active && current === revision) setFailure(true); }
      });
      return () => { active = false; stop(); };
    } catch { queueMicrotask(() => { if (active) setFailure(true); }); }
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const auth = getFirebaseAuth();
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch { setMessage("Connexion impossible. Vérifiez vos identifiants ou réessayez plus tard."); }
    finally { setBusy(false); }
  }
  async function reset() {
    if (!email.trim()) { setMessage("Indiquez votre adresse email."); return; }
    setBusy(true);
    try { await sendPasswordResetEmail(getFirebaseAuth(), email.trim()); } catch { /* Same response prevents account enumeration. */ }
    setMessage("Si cette adresse est éligible, un email de réinitialisation sera envoyé."); setBusy(false);
  }
  async function logout() {
    setSession({ user: null, allowed: false, ready: true });
    try { await signOut(getFirebaseAuth()); } catch { setFailure(true); }
  }
  return <main className="admin-shell">
    <header className="admin-header"><Link href="/">MH NETTOYAGE 17</Link><span>Administration</span>{session.user && <button onClick={logout}><LogOut size={17} /> Déconnexion</button>}</header>
    {failure ? <p role="alert">Administration indisponible. Rechargez la page ou contactez le responsable du site.</p> : !session.ready ? <p role="status">Vérification de l’accès…</p> : !session.user ?
      <form className="admin-login" onSubmit={login}><h1>Connexion</h1><label>Email<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Mot de passe<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy} type="submit">{busy ? "Veuillez patienter…" : "Se connecter"}</button><button disabled={busy} type="button" onClick={reset}>Mot de passe oublié</button><p role="status">{message}</p></form>
      : !session.allowed ? <div role="alert"><h1>Accès refusé</h1><p>Ce compte ne dispose pas des droits administrateur.</p></div> : <Reservations key={session.user.uid} />}
  </main>;
}

function Reservations() {
  const [docs, setDocs] = useState<QueryDocumentSnapshot[]>([]);
  const [cursors, setCursors] = useState<QueryDocumentSnapshot[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const cursor = cursors.at(-1);
    const request = query(collection(getFirebaseDb(), "reservations"), ...(status ? [where("status", "==", status)] : []), orderBy("createdAt", "desc"), ...(cursor ? [startAfter(cursor)] : []), limit(21));
    return onSnapshot(request, snapshot => { setDocs(snapshot.docs); setError(false); setLoading(false); }, () => { setDocs([]); setSelected(null); setError(true); setLoading(false); });
  }, [cursors, status, retry]);
  const page = docs.slice(0, 20);
  const matches = page.filter(doc => ["name", "phone", "email", "service"].some(field => value(doc, field).toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr").trim())));
  const detail = page.find(doc => doc.id === selected);
  return <section className="admin-reservations"><h1>Demandes de rendez-vous</h1>
    <div className="admin-filters"><label>Recherche sur cette page<input type="search" placeholder="Nom, téléphone, email ou prestation" value={search} onChange={e => setSearch(e.target.value)} /></label><label>Statut<select value={status} onChange={e => { setStatus(e.target.value); setCursors([]); setDocs([]); setSelected(null); }}><option value="">Tous les statuts</option>{Object.entries(statusNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    {loading ? <p role="status">Chargement des demandes…</p> : error ? <div role="alert"><p>Impossible de consulter les demandes. Vérifiez vos droits et réessayez.</p><button onClick={() => setRetry(n => n + 1)}>Réessayer</button></div> : <>
      <div className="admin-table-wrap"><table><caption className="admin-caption">Demandes les plus récentes en premier</caption><thead><tr><th>Client</th><th>Prestation</th><th>Créneau souhaité</th><th>Statut</th><th>Détails</th></tr></thead><tbody>{matches.map(doc => <tr key={doc.id}><td>{value(doc, "name")}<small>{value(doc, "phone")}</small></td><td>{value(doc, "service")}</td><td>{value(doc, "date")}<small>{value(doc, "time")}</small></td><td>{statusNames[value(doc, "status")] || value(doc, "status") || "Non renseigné"}</td><td><button aria-expanded={selected === doc.id} aria-controls="reservation-detail" onClick={() => setSelected(doc.id)}>Consulter<span className="admin-sr-only"> la demande de {value(doc, "name")}</span></button></td></tr>)}</tbody></table></div>
      {!matches.length && <p>{search ? "Aucun résultat sur cette page." : "Aucune demande pour ce filtre."}</p>}
      <nav className="admin-pagination" aria-label="Pages des demandes"><button disabled={!cursors.length} onClick={() => { setDocs([]); setSelected(null); setCursors(c => c.slice(0, -1)); }}><ArrowLeft size={16} /> Précédente</button><span>Page {cursors.length + 1}</span><button disabled={docs.length <= 20} onClick={() => { setCursors(c => [...c, page[19]]); setDocs([]); setSelected(null); }}>Suivante <ArrowRight size={16} /></button></nav>
    </>}
    <div id="reservation-detail">{detail && <section className="admin-detail" aria-label="Détail de la demande"><h2>{value(detail, "name")}</h2><button onClick={() => setSelected(null)}>Fermer les détails</button><dl>{[["Prestation", "service"], ["Date souhaitée", "date"], ["Heure souhaitée", "time"], ["Téléphone", "phone"], ["Email", "email"], ["Adresse / ville", "address"], ["Commentaire", "message"]].map(([label, field]) => <div key={field}><dt>{label}</dt><dd>{value(detail, field) || "Non renseigné"}</dd></div>)}<div><dt>Statut</dt><dd>{statusNames[value(detail, "status")] || value(detail, "status")}</dd></div><div><dt>Reçue le</dt><dd>{typeof detail.get("createdAt")?.toDate === "function" ? detail.get("createdAt").toDate().toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) : "Non renseigné"}</dd></div></dl><div className="admin-actions">{value(detail, "phone") && <a href={`tel:${value(detail, "phone").replace(/[^+0-9]/g, "")}`}><Phone size={16} /> Appeler</a>}{/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value(detail, "email")) && <a href={`mailto:${encodeURIComponent(value(detail, "email"))}`}><Mail size={16} /> Envoyer un email</a>}</div></section>}</div>
  </section>;
}
