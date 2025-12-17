import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { productRepository } from '../repositories/productRepository.js';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await productRepository.findAll();
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productRepository.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProductByBarcode = async (req: AuthRequest, res: Response) => {
  try {
    const { barcode } = req.params;
    const product = await productRepository.findByBarcode(barcode);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProductsByCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId } = req.params;
    const products = await productRepository.findByCategory(parseInt(categoryId));
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getLowStockProducts = async (req: AuthRequest, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;
    const products = await productRepository.findLowStock(threshold);
    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos con bajo stock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, descripcion, categoriaId, precio, stock, unidadId, codigoBarras } = req.body;

    if (!nombre || !categoriaId || precio === undefined || stock === undefined || !unidadId) {
      return res.status(400).json({ error: 'Campos requeridos: nombre, categoriaId, precio, stock, unidadId' });
    }

    // Verificar si el código de barras ya existe
    if (codigoBarras) {
      const existingProduct = await productRepository.findByBarcode(codigoBarras);
      if (existingProduct) {
        return res.status(400).json({ error: 'El código de barras ya existe' });
      }
    }

    const newProduct = await productRepository.create({
      nombre,
      descripcion,
      categoriaId: parseInt(categoriaId),
      precio: parseFloat(precio),
      stock: parseInt(stock),
      unidadId: parseInt(unidadId),
      codigoBarras,
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoriaId, precio, stock, unidadId, codigoBarras, activo } = req.body;

    // Verificar que el producto existe
    const existingProduct = await productRepository.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar código de barras único
    if (codigoBarras && codigoBarras !== existingProduct.codigoBarras) {
      const barcodeExists = await productRepository.findByBarcode(codigoBarras);
      if (barcodeExists) {
        return res.status(400).json({ error: 'El código de barras ya existe' });
      }
    }

    const updatedProduct = await productRepository.update(id, {
      nombre,
      descripcion,
      categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
      precio: precio !== undefined ? parseFloat(precio) : undefined,
      stock: stock !== undefined ? parseInt(stock) : undefined,
      unidadId: unidadId ? parseInt(unidadId) : undefined,
      codigoBarras,
      activo,
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await productRepository.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ==================== CATEGORÍAS ====================

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await productRepository.findAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Verificar si la categoría ya existe
    const existing = await productRepository.findCategoryByName(nombre);
    if (existing) {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }

    const id = await productRepository.createCategory(nombre, descripcion);
    res.status(201).json({ id, nombre, descripcion });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ==================== UNIDADES ====================

export const getUnits = async (req: AuthRequest, res: Response) => {
  try {
    const units = await productRepository.findAllUnits();
    res.json(units);
  } catch (error) {
    console.error('Error al obtener unidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
