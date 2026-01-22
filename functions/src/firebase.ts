import { initializeApp, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const app = getApps().length ? getApps()[0] : initializeApp();

export const firestore = getFirestore(app);
export const serverTimestamp = FieldValue.serverTimestamp();
