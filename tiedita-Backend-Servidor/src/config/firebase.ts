import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let app: admin.app.App | null = null;
let db: FirebaseFirestore.Firestore | null = null;

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

// Bandera para saber si Firebase quedó listo
let isFirebaseReady = false;

try {
  if (serviceAccountPath) {
    const fullPath = path.resolve(serviceAccountPath);

    if (fs.existsSync(fullPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(fullPath, "utf8"));

      // ✅ Evitar inicializar 2 veces (tsx watch / hot reload)
      if (admin.apps.length === 0) {
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        app = admin.app();
      }

      db = admin.firestore();
      isFirebaseReady = true;

      console.log("✅ Firebase inicializado correctamente");
    } else {
      console.warn("⚠️ Archivo de credenciales Firebase no encontrado:", fullPath);
    }
  } else {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_PATH no definido, Firebase no inicializado");
  }
} catch (e) {
  console.warn("⚠️ No se pudo inicializar Firebase:", e);
}

// ✅ Función que tu index.ts espera
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    if (!db) {
      console.warn("⚠️ Firebase/Firestore no está listo (sin credenciales).");
      return false;
    }

    // Lectura mínima para probar conexión
    await db.collection("_health").limit(1).get();
    console.log("✅ Conexión a Firestore OK");
    return true;
  } catch (err) {
    console.warn("⚠️ Conexión a Firestore FALLÓ:", err);
    return false;
  }
}

// ✅ Exporta lo que el proyecto puede usar
export { admin, app, db, isFirebaseReady };

// ✅ Colecciones (si no hay Firebase, quedan en null)
export const usersCollection = db ? db.collection("users") : null;
export const salesCollection = db ? db.collection("sales") : null;

// (Opcionales por si aparecen después)
export const productsCollection = db ? db.collection("products") : null;
export const categoriesCollection = db ? db.collection("categories") : null;
