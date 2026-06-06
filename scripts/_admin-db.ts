/**
 * Helper partagé pour les scripts : fournit un db Firestore Admin SDK.
 * Bypasse les règles de sécurité Firestore (accès total).
 * Nécessite FIREBASE_ADMIN_KEY dans .env.local.
 */
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

let _db: admin.firestore.Firestore | null = null;

export function getAdminDb(): admin.firestore.Firestore {
  if (_db) return _db;

  const rawKey = process.env.FIREBASE_ADMIN_KEY;
  if (!rawKey) {
    throw new Error(
      "FIREBASE_ADMIN_KEY manquant dans .env.local.\n" +
      "Firebase Console → Paramètres → Comptes de service → Générer une nouvelle clé privée\n" +
      "Ajouter dans .env.local : FIREBASE_ADMIN_KEY='{...}'"
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(rawKey)) });
  }

  _db = admin.firestore();
  return _db;
}

export { admin };
export const Timestamp = admin.firestore.Timestamp;
export const FieldValue = admin.firestore.FieldValue;


// ──────────────────────────────────────────────────────────────
// Helpers modular-style pour les scripts (compatible firebase/firestore API)
// ──────────────────────────────────────────────────────────────

export function collection(db: admin.firestore.Firestore, path: string) {
  return db.collection(path);
}
export function doc(db: admin.firestore.Firestore, path: string, id: string) {
  return db.collection(path).doc(id);
}
export async function getDocs(ref: admin.firestore.CollectionReference | admin.firestore.Query) {
  return ref.get();
}
export async function getDoc(ref: admin.firestore.DocumentReference) {
  return ref.get();
}
export async function setDoc(
  ref: admin.firestore.DocumentReference,
  data: Record<string, any>,
  opts?: { merge?: boolean }
) {
  return opts?.merge ? ref.set(data, { merge: true }) : ref.set(data);
}
export async function updateDoc(ref: admin.firestore.DocumentReference, data: Record<string, any>) {
  return ref.update(data);
}
export async function addDoc(ref: admin.firestore.CollectionReference, data: Record<string, any>) {
  return ref.add(data);
}
export function where(
  field: string,
  op: admin.firestore.WhereFilterOp,
  value: any
) {
  return { field, op, value } as any; // used via collectionRef.where()
}
export function query(
  ref: admin.firestore.CollectionReference,
  ...constraints: any[]
) {
  let q: admin.firestore.Query = ref;
  for (const c of constraints) {
    if (c?.field) q = q.where(c.field, c.op, c.value);
    if (c?.order) q = q.orderBy(c.order, c.direction);
  }
  return q;
}
export function orderBy(field: string, direction: "asc" | "desc" = "asc") {
  return { order: field, direction } as any;
}

export async function deleteDoc(ref: admin.firestore.DocumentReference) {
  return ref.delete();
}
