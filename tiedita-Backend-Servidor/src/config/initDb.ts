import { mysqlPool } from './mysql.js';
import { usersCollection } from './firebase.js';
import bcrypt from 'bcryptjs';

/**
 * Script para inicializar las bases de datos
 *
 * MySQL (XAMPP): Tablas normalizadas para productos
 * Firebase: Colecciones para usuarios y ventas
 */

// =====================================================
// MYSQL: Crear tablas normalizadas (3FN)
// =====================================================

const createMySQLTables = async () => {
  console.log('📦 Creando tablas en MySQL...');

  const connection = await mysqlPool.getConnection();

  try {
    // Tabla: categorias
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Tabla "categorias" creada');

    // Tabla: unidades
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS unidades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        abreviatura VARCHAR(10) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Tabla "unidades" creada');

    // Tabla: productos (normalizada con FK a categorias y unidades)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id VARCHAR(36) PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        descripcion TEXT,
        categoria_id INT NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        unidad_id INT NOT NULL,
        codigo_barras VARCHAR(50) UNIQUE,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON UPDATE CASCADE,
        FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON UPDATE CASCADE,
        INDEX idx_nombre (nombre),
        INDEX idx_categoria (categoria_id),
        INDEX idx_codigo_barras (codigo_barras),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✅ Tabla "productos" creada');

    console.log('✅ Todas las tablas MySQL creadas correctamente');
  } finally {
    connection.release();
  }
};

// =====================================================
// MYSQL: Insertar datos iniciales
// =====================================================

const seedMySQLData = async () => {
  console.log('🌱 Insertando datos iniciales en MySQL...');

  const connection = await mysqlPool.getConnection();

  try {
    // Insertar categorías
    await connection.execute(`
      INSERT IGNORE INTO categorias (nombre, descripcion) VALUES
      ('Bebidas', 'Refrescos, aguas, jugos y bebidas en general'),
      ('Botanas', 'Papas, frituras, cacahuates y snacks'),
      ('Lácteos', 'Leche, queso, yogurt y derivados'),
      ('Panadería', 'Pan, tortillas y productos de panadería'),
      ('Limpieza', 'Productos de limpieza para el hogar'),
      ('Abarrotes', 'Productos básicos de despensa'),
      ('Dulces', 'Golosinas, chocolates y dulces'),
      ('Higiene Personal', 'Jabones, shampoo y productos de higiene')
    `);
    console.log('  ✅ Categorías insertadas');

    // Insertar unidades
    await connection.execute(`
      INSERT IGNORE INTO unidades (nombre, abreviatura) VALUES
      ('Pieza', 'pz'),
      ('Kilogramo', 'kg'),
      ('Litro', 'L'),
      ('Gramo', 'g'),
      ('Mililitro', 'ml'),
      ('Paquete', 'paq'),
      ('Caja', 'cja'),
      ('Docena', 'doc')
    `);
    console.log('  ✅ Unidades insertadas');

    // Insertar productos de ejemplo
    const { v4: uuidv4 } = await import('uuid');

    const productos = [
      { id: uuidv4(), nombre: 'Coca Cola 600ml', desc: 'Refresco de cola', cat: 1, precio: 18.00, stock: 50, unidad: 1, codigo: '7501055300846' },
      { id: uuidv4(), nombre: 'Pepsi 600ml', desc: 'Refresco de cola', cat: 1, precio: 17.00, stock: 45, unidad: 1, codigo: '7501031311309' },
      { id: uuidv4(), nombre: 'Sabritas Original 45g', desc: 'Papas fritas', cat: 2, precio: 22.00, stock: 30, unidad: 1, codigo: '7501011115040' },
      { id: uuidv4(), nombre: 'Doritos Nacho 62g', desc: 'Frituras de maíz', cat: 2, precio: 25.00, stock: 25, unidad: 1, codigo: '7501011114586' },
      { id: uuidv4(), nombre: 'Leche Lala 1L', desc: 'Leche entera', cat: 3, precio: 28.50, stock: 20, unidad: 3, codigo: '7501055363513' },
      { id: uuidv4(), nombre: 'Yogurt Danone Natural 1kg', desc: 'Yogurt natural', cat: 3, precio: 45.00, stock: 15, unidad: 2, codigo: '7501005102117' },
      { id: uuidv4(), nombre: 'Pan Bimbo Grande', desc: 'Pan de caja blanco', cat: 4, precio: 52.00, stock: 15, unidad: 1, codigo: '7501030438892' },
      { id: uuidv4(), nombre: 'Tortillas de Maíz 1kg', desc: 'Tortillas de maíz', cat: 4, precio: 22.00, stock: 30, unidad: 2, codigo: '0000000000001' },
      { id: uuidv4(), nombre: 'Jabón Zote 400g', desc: 'Jabón de lavandería', cat: 5, precio: 18.00, stock: 8, unidad: 1, codigo: '7501026002304' },
      { id: uuidv4(), nombre: 'Fabuloso 1L', desc: 'Limpiador multiusos', cat: 5, precio: 35.00, stock: 12, unidad: 3, codigo: '7501035911123' },
      { id: uuidv4(), nombre: 'Arroz Verde Valle 1kg', desc: 'Arroz blanco', cat: 6, precio: 32.00, stock: 40, unidad: 2, codigo: '7501052451015' },
      { id: uuidv4(), nombre: 'Frijol Negro 1kg', desc: 'Frijol negro', cat: 6, precio: 38.00, stock: 35, unidad: 2, codigo: '0000000000002' },
    ];

    for (const p of productos) {
      await connection.execute(`
        INSERT IGNORE INTO productos (id, nombre, descripcion, categoria_id, precio, stock, unidad_id, codigo_barras)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [p.id, p.nombre, p.desc, p.cat, p.precio, p.stock, p.unidad, p.codigo]);
    }
    console.log('  ✅ Productos insertados');

    console.log('✅ Datos iniciales MySQL insertados correctamente');
  } finally {
    connection.release();
  }
};

// =====================================================
// FIREBASE: Crear usuarios iniciales
// =====================================================

const seedFirebaseData = async () => {
  console.log('🌱 Insertando datos iniciales en Firebase...');

  try {
    // Verificar si ya existen usuarios
    const existingUsers = await usersCollection.limit(1).get();

    if (!existingUsers.empty) {
      console.log('  ⚠️ Ya existen usuarios en Firebase, omitiendo seed...');
      return;
    }

    // Usuario Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    await usersCollection.add({
      nombre: 'Administrador',
      email: 'admin@abarrotes.com',
      password: adminPassword,
      rol: 'admin',
      activo: true,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    });
    console.log('  ✅ Usuario admin creado');

    // Usuario Vendedor
    const vendedorPassword = await bcrypt.hash('vendedor123', 10);
    await usersCollection.add({
      nombre: 'Juan Vendedor',
      email: 'vendedor@abarrotes.com',
      password: vendedorPassword,
      rol: 'vendedor',
      activo: true,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    });
    console.log('  ✅ Usuario vendedor creado');

    console.log('✅ Datos iniciales Firebase insertados correctamente');
  } catch (error) {
    console.error('❌ Error insertando datos en Firebase:', error);
  }
};

// =====================================================
// EJECUTAR INICIALIZACIÓN
// =====================================================

const main = async () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         INICIALIZACIÓN DE BASES DE DATOS                   ║');
  console.log('║         MySQL (XAMPP) + Firebase Firestore                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // MySQL
    console.log('─────────────────────────────────────────────────────────────');
    console.log('                    MySQL (XAMPP)                            ');
    console.log('─────────────────────────────────────────────────────────────');
    await createMySQLTables();
    await seedMySQLData();

    // Firebase
    console.log('');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('                  Firebase Firestore                         ');
    console.log('─────────────────────────────────────────────────────────────');
    await seedFirebaseData();

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         ✅ INICIALIZACIÓN COMPLETADA                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    process.exit(1);
  }
};

main();
