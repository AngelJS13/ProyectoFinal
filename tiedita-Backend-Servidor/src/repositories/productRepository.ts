import { mysqlPool } from '../config/mysql.js';
import { Product } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Repository para Productos - MySQL (Normalizado)
 *
 * Estructura normalizada:
 * - productos (tabla principal)
 * - categorias (FK: categoria_id)
 * - unidades (FK: unidad_id)
 */

// Interfaces para las filas de MySQL
interface ProductRow extends RowDataPacket {
  id: string;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  categoria_nombre: string;
  precio: number;
  stock: number;
  unidad_id: number;
  unidad_nombre: string;
  unidad_abreviatura: string;
  codigo_barras: string;
  activo: boolean;
  fecha_creacion: Date;
  fecha_modificacion: Date;
}

interface CategoryRow extends RowDataPacket {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

interface UnitRow extends RowDataPacket {
  id: number;
  nombre: string;
  abreviatura: string;
}

// Transformar fila de MySQL a objeto Product
const rowToProduct = (row: ProductRow): Product => ({
  id: row.id,
  nombre: row.nombre,
  descripcion: row.descripcion || '',
  categoria: row.categoria_nombre,
  precio: Number(row.precio),
  stock: row.stock,
  unidad: row.unidad_abreviatura,
  codigoBarras: row.codigo_barras || '',
  activo: Boolean(row.activo),
  fechaCreacion: row.fecha_creacion.toISOString(),
  fechaModificacion: row.fecha_modificacion.toISOString(),
});

export const productRepository = {
  // ==================== PRODUCTOS ====================

  findAll: async (): Promise<Product[]> => {
    const [rows] = await mysqlPool.execute<ProductRow[]>(`
      SELECT
        p.id, p.nombre, p.descripcion, p.precio, p.stock,
        p.codigo_barras, p.activo, p.fecha_creacion, p.fecha_modificacion,
        p.categoria_id, c.nombre as categoria_nombre,
        p.unidad_id, u.nombre as unidad_nombre, u.abreviatura as unidad_abreviatura
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN unidades u ON p.unidad_id = u.id
      ORDER BY p.nombre ASC
    `);

    return rows.map(rowToProduct);
  },

  findById: async (id: string): Promise<Product | null> => {
    const [rows] = await mysqlPool.execute<ProductRow[]>(`
      SELECT
        p.id, p.nombre, p.descripcion, p.precio, p.stock,
        p.codigo_barras, p.activo, p.fecha_creacion, p.fecha_modificacion,
        p.categoria_id, c.nombre as categoria_nombre,
        p.unidad_id, u.nombre as unidad_nombre, u.abreviatura as unidad_abreviatura
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN unidades u ON p.unidad_id = u.id
      WHERE p.id = ?
    `, [id]);

    return rows.length > 0 ? rowToProduct(rows[0]) : null;
  },

  findByBarcode: async (barcode: string): Promise<Product | null> => {
    const [rows] = await mysqlPool.execute<ProductRow[]>(`
      SELECT
        p.id, p.nombre, p.descripcion, p.precio, p.stock,
        p.codigo_barras, p.activo, p.fecha_creacion, p.fecha_modificacion,
        p.categoria_id, c.nombre as categoria_nombre,
        p.unidad_id, u.nombre as unidad_nombre, u.abreviatura as unidad_abreviatura
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN unidades u ON p.unidad_id = u.id
      WHERE p.codigo_barras = ? AND p.activo = TRUE
    `, [barcode]);

    return rows.length > 0 ? rowToProduct(rows[0]) : null;
  },

  findByCategory: async (categoryId: number): Promise<Product[]> => {
    const [rows] = await mysqlPool.execute<ProductRow[]>(`
      SELECT
        p.id, p.nombre, p.descripcion, p.precio, p.stock,
        p.codigo_barras, p.activo, p.fecha_creacion, p.fecha_modificacion,
        p.categoria_id, c.nombre as categoria_nombre,
        p.unidad_id, u.nombre as unidad_nombre, u.abreviatura as unidad_abreviatura
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN unidades u ON p.unidad_id = u.id
      WHERE p.categoria_id = ?
      ORDER BY p.nombre ASC
    `, [categoryId]);

    return rows.map(rowToProduct);
  },

  findLowStock: async (threshold: number = 10): Promise<Product[]> => {
    const [rows] = await mysqlPool.execute<ProductRow[]>(`
      SELECT
        p.id, p.nombre, p.descripcion, p.precio, p.stock,
        p.codigo_barras, p.activo, p.fecha_creacion, p.fecha_modificacion,
        p.categoria_id, c.nombre as categoria_nombre,
        p.unidad_id, u.nombre as unidad_nombre, u.abreviatura as unidad_abreviatura
      FROM productos p
      INNER JOIN categorias c ON p.categoria_id = c.id
      INNER JOIN unidades u ON p.unidad_id = u.id
      WHERE p.stock < ? AND p.activo = TRUE
      ORDER BY p.stock ASC
    `, [threshold]);

    return rows.map(rowToProduct);
  },

  create: async (data: {
    nombre: string;
    descripcion?: string;
    categoriaId: number;
    precio: number;
    stock: number;
    unidadId: number;
    codigoBarras?: string;
  }): Promise<Product> => {
    const id = uuidv4();

    await mysqlPool.execute<ResultSetHeader>(`
      INSERT INTO productos (id, nombre, descripcion, categoria_id, precio, stock, unidad_id, codigo_barras)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, data.nombre, data.descripcion || '', data.categoriaId, data.precio, data.stock, data.unidadId, data.codigoBarras || null]);

    const product = await productRepository.findById(id);
    return product!;
  },

  update: async (id: string, data: Partial<{
    nombre: string;
    descripcion: string;
    categoriaId: number;
    precio: number;
    stock: number;
    unidadId: number;
    codigoBarras: string;
    activo: boolean;
  }>): Promise<Product | null> => {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.nombre !== undefined) { updates.push('nombre = ?'); values.push(data.nombre); }
    if (data.descripcion !== undefined) { updates.push('descripcion = ?'); values.push(data.descripcion); }
    if (data.categoriaId !== undefined) { updates.push('categoria_id = ?'); values.push(data.categoriaId); }
    if (data.precio !== undefined) { updates.push('precio = ?'); values.push(data.precio); }
    if (data.stock !== undefined) { updates.push('stock = ?'); values.push(data.stock); }
    if (data.unidadId !== undefined) { updates.push('unidad_id = ?'); values.push(data.unidadId); }
    if (data.codigoBarras !== undefined) { updates.push('codigo_barras = ?'); values.push(data.codigoBarras); }
    if (data.activo !== undefined) { updates.push('activo = ?'); values.push(data.activo); }

    if (updates.length === 0) return productRepository.findById(id);

    values.push(id);

    await mysqlPool.execute<ResultSetHeader>(`
      UPDATE productos SET ${updates.join(', ')} WHERE id = ?
    `, values);

    return productRepository.findById(id);
  },

  updateStock: async (id: string, quantity: number): Promise<boolean> => {
    const [result] = await mysqlPool.execute<ResultSetHeader>(`
      UPDATE productos SET stock = stock + ? WHERE id = ?
    `, [quantity, id]);

    return result.affectedRows > 0;
  },

  delete: async (id: string): Promise<boolean> => {
    const [result] = await mysqlPool.execute<ResultSetHeader>(`
      DELETE FROM productos WHERE id = ?
    `, [id]);

    return result.affectedRows > 0;
  },

  // ==================== CATEGORÍAS ====================

  findAllCategories: async (): Promise<CategoryRow[]> => {
    const [rows] = await mysqlPool.execute<CategoryRow[]>(`
      SELECT id, nombre, descripcion, activo FROM categorias ORDER BY nombre ASC
    `);
    return rows;
  },

  findCategoryById: async (id: number): Promise<CategoryRow | null> => {
    const [rows] = await mysqlPool.execute<CategoryRow[]>(`
      SELECT id, nombre, descripcion, activo FROM categorias WHERE id = ?
    `, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  findCategoryByName: async (nombre: string): Promise<CategoryRow | null> => {
    const [rows] = await mysqlPool.execute<CategoryRow[]>(`
      SELECT id, nombre, descripcion, activo FROM categorias WHERE nombre = ?
    `, [nombre]);
    return rows.length > 0 ? rows[0] : null;
  },

  createCategory: async (nombre: string, descripcion?: string): Promise<number> => {
    const [result] = await mysqlPool.execute<ResultSetHeader>(`
      INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)
    `, [nombre, descripcion || '']);
    return result.insertId;
  },

  // ==================== UNIDADES ====================

  findAllUnits: async (): Promise<UnitRow[]> => {
    const [rows] = await mysqlPool.execute<UnitRow[]>(`
      SELECT id, nombre, abreviatura FROM unidades ORDER BY nombre ASC
    `);
    return rows;
  },

  findUnitById: async (id: number): Promise<UnitRow | null> => {
    const [rows] = await mysqlPool.execute<UnitRow[]>(`
      SELECT id, nombre, abreviatura FROM unidades WHERE id = ?
    `, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  findUnitByName: async (nombre: string): Promise<UnitRow | null> => {
    const [rows] = await mysqlPool.execute<UnitRow[]>(`
      SELECT id, nombre, abreviatura FROM unidades WHERE nombre = ?
    `, [nombre]);
    return rows.length > 0 ? rows[0] : null;
  },
};
