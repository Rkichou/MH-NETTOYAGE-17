import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const env = await initializeTestEnvironment({ projectId: "demo-mh-admin", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
const valid = () => ({ name: "Client Test", phone: "0600000000", email: "test@example.com", service: "Lavage extérieur", date: "2026-12-20", time: "Matin", address: null, message: null, status: "pending", createdAt: serverTimestamp() });
try {
  const guest = env.unauthenticatedContext().firestore();
  const member = env.authenticatedContext("member").firestore();
  const admin = env.authenticatedContext("admin", { admin: true }).firestore();
  await assertSucceeds(setDoc(doc(guest, "reservations/valid"), valid()));
  for (const db of [guest, member]) {
    await assertFails(getDoc(doc(db, "reservations/valid")));
    await assertFails(getDocs(collection(db, "reservations")));
  }
  await assertSucceeds(getDocs(collection(admin, "reservations")));
  for (const override of [{ name: 42 }, { phone: "" }, { date: "invalid" }, { email: "invalid" }, { status: "confirmed" }, { admin: true }, { createdAt: "fake" }, { message: "x".repeat(1001) }]) {
    await assertFails(setDoc(doc(guest, "reservations/invalid"), { ...valid(), ...override }));
  }
  for (const db of [guest, member, admin]) {
    await assertFails(updateDoc(doc(db, "reservations/valid"), { status: "confirmed" }));
    await assertFails(deleteDoc(doc(db, "reservations/valid")));
  }
  await assertFails(getDocs(collection(env.authenticatedContext("admin", { admin: false }).firestore(), "reservations")));
  console.log("Firestore access and validation checks passed.");
} finally { await env.cleanup(); }
