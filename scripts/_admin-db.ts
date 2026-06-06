/**
 * Helper partagé pour les scripts : fournit un db Firestore Admin SDK.
 * Nécessite FIREBASE_ADMIN_KEY dans .env.local (JSON du service account, sur une ligne).
 *
 * Pour générer la clé :
 *   Firebase Console → Paramètres du projet → Comptes de service
 *   → "Générer une nouvelle clé privée" → copier le JSON en une seule ligne
 *   → coller dans .env.local : FIREBASE_ADMIN_KEY='{"type":"service_account",...}'
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
      "Coller le JSON sur une seule ligne dans .env.local : FIREBASE_ADMIN_KEY='...'"
    );
  }

  const serviceAccount = JSON.parse(rawKey);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  _db = admin.firestore();
  return _db;
}

export { admin };
