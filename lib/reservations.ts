import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Appointment } from "./appointments";
import { getFirebaseDb } from "./firebase";

export type ReservationDocument = {
  name: string;
  phone: string;
  email: string | null;
  service: string;
  date: string;
  time: string;
  address: string | null;
  message: string | null;
  status: "pending";
  createdAt: ReturnType<typeof serverTimestamp>;
};

export async function createReservation(data: Appointment) {
  const reservation: ReservationDocument = {
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim() || null,
    service: data.service,
    date: data.date,
    time: data.time,
    address: null,
    message: data.message.trim() || null,
    status: "pending",
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(getFirebaseDb(), "reservations"), reservation);
}
