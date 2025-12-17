import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { testMySQLConnection } from "./config/mysql.js";
import { testFirebaseConnection } from "./config/firebase.js";

// ✅ Repo (para crear admin)
import { userRepository } from "./repositories/userRepository.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Root para evitar Cannot GET /
app.get("/", (_req, res) => {
  res.send("✅ TIEDITA Backend corriendo. Prueba /api/health");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/stats", statsRoutes);

// Health check
app.get("/api/health", async (_req, res) => {
  const mysqlOk = await testMySQLConnection();
  const firebaseOk = await testFirebaseConnection();

  res.json({
    status: mysqlOk && firebaseOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    databases: {
      mysql: mysqlOk ? "connected" : "disconnected",
      firebase: firebaseOk ? "connected" : "disconnected",
    },
  });
});

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
);

// ✅ Seed admin (solo en development o si lo fuerzas con DEV_SEED_ADMIN=true)
async function seedAdminUser() {
  const email = process.env.DEV_SEED_ADMIN_EMAIL || "admin@admin.com";
  const password = process.env.DEV_SEED_ADMIN_PASSWORD || "admin123";

  const shouldSeed =
    process.env.DEV_SEED_ADMIN === "true" ||
    process.env.NODE_ENV === "development";

  if (!shouldSeed) return;

  try {
    const exists = await userRepository.findByEmail(email);

    if (!exists) {
      await userRepository.create({
        nombre: "Administrador",
        email,
        password,
        rol: "admin",
      });
      console.log(`✅ Admin creado: ${email} / ${password}`);
    } else {
      console.log(`ℹ️ Admin ya existe: ${email}`);
    }
  } catch (e) {
    console.warn("⚠️ No se pudo crear admin:", e);
  }
}

// Start server
const startServer = async () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              TIEDITA - Backend Server                      ║");
  console.log("║         MySQL (XAMPP) + Firebase Firestore                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");

  console.log("🔌 Verificando conexiones a bases de datos...");
  console.log("");

  const mysqlOk = await testMySQLConnection();
  const firebaseOk = await testFirebaseConnection();

  console.log("");

  if (!mysqlOk) {
    console.log("⚠️  MySQL no está disponible. Asegúrate de que XAMPP está corriendo.");
  } else {
    console.log("✅ MySQL (XAMPP) conectado correctamente");
  }

  if (!firebaseOk) {
    console.log("⚠️  Firebase no está disponible. Verifica las credenciales.");
  } else {
    console.log("✅ Conexión a Firestore OK");
  }

  // ✅ Seed admin para pruebas
  await seedAdminUser();

  // Start server anyway
  app.listen(config.port, () => {
    console.log("─────────────────────────────────────────────────────────────");
    console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
    console.log(`📚 API disponible en http://localhost:${config.port}/api`);
    console.log("");
    console.log("Endpoints disponibles:");
    console.log("  POST /api/auth/login");
    console.log("  GET  /api/auth/verify");
    console.log("  GET  /api/users");
    console.log("  GET  /api/products");
    console.log("  GET  /api/products/meta/categories");
    console.log("  GET  /api/products/meta/units");
    console.log("  GET  /api/sales");
    console.log("  GET  /api/stats");
    console.log("  GET  /api/health");
    console.log("─────────────────────────────────────────────────────────────");
  });
};

startServer();
