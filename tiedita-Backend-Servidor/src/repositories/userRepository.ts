import { usersCollection } from "../config/firebase.js";
import { User } from "../types/index.js";
import bcrypt from "bcryptjs";

/**
 * Repository para Usuarios
 * - Modo 1: Firebase Firestore (si hay credenciales)
 * - Modo 2: In-memory (si NO hay Firebase) -> temporal para desarrollo
 *
 * Colección: users
 * Documento: { nombre, email, password, rol, activo, fechaCreacion, fechaModificacion }
 */

// -------------------------------
// Helpers comunes
// -------------------------------
type CreateUserDTO = {
  nombre: string;
  email: string;
  password: string;
  rol: "admin" | "vendedor";
};

type UpdateUserDTO = Partial<{
  nombre: string;
  email: string;
  password: string;
  rol: "admin" | "vendedor";
  activo: boolean;
}>;

const nowISO = () => new Date().toISOString();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// -------------------------------
// ✅ MODO FIREBASE (si hay Firestore)
// -------------------------------
const docToUser = (doc: FirebaseFirestore.DocumentSnapshot): User => {
  const data = doc.data()!;
  return {
    id: doc.id,
    nombre: data.nombre,
    email: data.email,
    password: data.password,
    rol: data.rol,
    activo: data.activo,
    fechaCreacion: data.fechaCreacion,
    fechaModificacion: data.fechaModificacion,
  };
};

// -------------------------------
// ✅ MODO MEMORIA (si NO hay Firestore)
// -------------------------------
const memoryUsers = new Map<string, User>();

const genId = () =>
  `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const sortByNombre = (a: User, b: User) =>
  (a.nombre || "").localeCompare(b.nombre || "", "es", { sensitivity: "base" });

// -------------------------------
// Repository
// -------------------------------
export const userRepository = {
  // -------------------------------------------------
  // FIND ALL
  // -------------------------------------------------
  findAll: async (): Promise<User[]> => {
    // Firebase
    if (usersCollection) {
      const snapshot = await usersCollection.orderBy("nombre").get();
      return snapshot.docs.map(docToUser);
    }

    // Memoria
    return Array.from(memoryUsers.values()).sort(sortByNombre);
  },

  // -------------------------------------------------
  // FIND BY ID
  // -------------------------------------------------
  findById: async (id: string): Promise<User | null> => {
    if (usersCollection) {
      const doc = await usersCollection.doc(id).get();
      return doc.exists ? docToUser(doc) : null;
    }

    return memoryUsers.get(id) ?? null;
  },

  // -------------------------------------------------
  // FIND BY EMAIL
  // -------------------------------------------------
  findByEmail: async (email: string): Promise<User | null> => {
    const emailNorm = normalizeEmail(email);

    if (usersCollection) {
      const snapshot = await usersCollection
        .where("email", "==", emailNorm)
        .limit(1)
        .get();
      return snapshot.empty ? null : docToUser(snapshot.docs[0]);
    }

    for (const u of memoryUsers.values()) {
      if (normalizeEmail(u.email) === emailNorm) return u;
    }
    return null;
  },

  // -------------------------------------------------
  // FIND ACTIVE
  // -------------------------------------------------
  findActive: async (): Promise<User[]> => {
    if (usersCollection) {
      const snapshot = await usersCollection
        .where("activo", "==", true)
        .orderBy("nombre")
        .get();
      return snapshot.docs.map(docToUser);
    }

    return Array.from(memoryUsers.values())
      .filter((u) => u.activo === true)
      .sort(sortByNombre);
  },

  // -------------------------------------------------
  // CREATE
  // -------------------------------------------------
  create: async (data: CreateUserDTO): Promise<User> => {
    const emailNorm = normalizeEmail(data.email);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = nowISO();

    // Validación básica de duplicado de email (en ambos modos)
    const exists = await userRepository.findByEmail(emailNorm);
    if (exists) {
      throw new Error("Ya existe un usuario con ese email.");
    }

    // Firebase
    if (usersCollection) {
      const docRef = await usersCollection.add({
        nombre: data.nombre,
        email: emailNorm,
        password: hashedPassword,
        rol: data.rol,
        activo: true,
        fechaCreacion: now,
        fechaModificacion: now,
      });

      const newDoc = await docRef.get();
      return docToUser(newDoc);
    }

    // Memoria
    const id = genId();
    const newUser: User = {
      id,
      nombre: data.nombre,
      email: emailNorm,
      password: hashedPassword,
      rol: data.rol,
      activo: true,
      fechaCreacion: now,
      fechaModificacion: now,
    };

    memoryUsers.set(id, newUser);
    return newUser;
  },

  // -------------------------------------------------
  // UPDATE
  // -------------------------------------------------
  update: async (id: string, data: UpdateUserDTO): Promise<User | null> => {
    // Firebase
    if (usersCollection) {
      const docRef = usersCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return null;

      const updateData: any = {
        ...data,
        fechaModificacion: nowISO(),
      };

      if (data.email) updateData.email = normalizeEmail(data.email);

      // Hash password si se está actualizando
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      return docToUser(updatedDoc);
    }

    // Memoria
    const current = memoryUsers.get(id);
    if (!current) return null;

    const updated: User = {
      ...current,
      ...data,
      email: data.email ? normalizeEmail(data.email) : current.email,
      fechaModificacion: nowISO(),
    };

    if (data.password) {
      updated.password = await bcrypt.hash(data.password, 10);
    }

    memoryUsers.set(id, updated);
    return updated;
  },

  // -------------------------------------------------
  // DELETE
  // -------------------------------------------------
  delete: async (id: string): Promise<boolean> => {
    if (usersCollection) {
      const docRef = usersCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return false;

      await docRef.delete();
      return true;
    }

    return memoryUsers.delete(id);
  },

  // -------------------------------------------------
  // VALIDATE PASSWORD
  // -------------------------------------------------
  validatePassword: async (user: User, password: string): Promise<boolean> => {
    return bcrypt.compare(password, user.password);
  },

  // -------------------------------------------------
  // COUNT
  // -------------------------------------------------
  count: async (): Promise<number> => {
    if (usersCollection) {
      const snapshot = await usersCollection.count().get();
      return snapshot.data().count;
    }

    return memoryUsers.size;
  },

  // -------------------------------------------------
  // COUNT ACTIVE
  // -------------------------------------------------
  countActive: async (): Promise<number> => {
    if (usersCollection) {
      const snapshot = await usersCollection.where("activo", "==", true).count().get();
      return snapshot.data().count;
    }

    let c = 0;
    for (const u of memoryUsers.values()) if (u.activo === true) c++;
    return c;
  },
};
