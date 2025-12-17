import mysql from 'mysql2/promise';
import { config } from './env.js';

// Pool de conexiones a MySQL (XAMPP)
export const mysqlPool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función para verificar conexión
export const testMySQLConnection = async (): Promise<boolean> => {
  try {
    const connection = await mysqlPool.getConnection();
    console.log('✅ MySQL (XAMPP) conectado correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error);
    return false;
  }
};
