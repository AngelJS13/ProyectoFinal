import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { saleRepository } from '../repositories/saleRepository.js';
import { productRepository } from '../repositories/productRepository.js';
import { SaleItem } from '../types/index.js';

export const getSales = async (req: AuthRequest, res: Response) => {
  try {
    const sales = await saleRepository.findAll();
    res.json(sales);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getSaleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const sale = await saleRepository.findById(id);

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createSale = async (req: AuthRequest, res: Response) => {
  try {
    const { items, metodoPago } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requieren items para la venta' });
    }

    if (!metodoPago) {
      return res.status(400).json({ error: 'Se requiere método de pago' });
    }

    // Validar stock y calcular totales
    const saleItems: SaleItem[] = [];
    let total = 0;

    for (const item of items) {
      // Obtener producto de MySQL
      const product = await productRepository.findById(item.productoId);

      if (!product) {
        return res.status(400).json({ error: `Producto no encontrado: ${item.productoId}` });
      }

      if (!product.activo) {
        return res.status(400).json({ error: `Producto no disponible: ${product.nombre}` });
      }

      if (product.stock < item.cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}`
        });
      }

      const subtotal = product.precio * item.cantidad;
      total += subtotal;

      saleItems.push({
        productoId: product.id,
        productoNombre: product.nombre,
        cantidad: item.cantidad,
        precioUnitario: product.precio,
        subtotal,
      });
    }

    // Actualizar stock en MySQL
    for (const item of saleItems) {
      await productRepository.updateStock(item.productoId, -item.cantidad);
    }

    // Crear venta en Firebase
    const newSale = await saleRepository.create({
      vendedorId: req.user!.id,
      vendedorNombre: req.user!.nombre,
      items: saleItems,
      total,
      metodoPago,
    });

    res.status(201).json(newSale);
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getSalesByDateRange = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Se requieren fechas de inicio y fin' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const sales = await saleRepository.findByDateRange(start, end);
    res.json(sales);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTodaySales = async (req: AuthRequest, res: Response) => {
  try {
    const sales = await saleRepository.findToday();
    res.json(sales);
  } catch (error) {
    console.error('Error al obtener ventas de hoy:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getSalesByVendedor = async (req: AuthRequest, res: Response) => {
  try {
    const { vendedorId } = req.params;
    const sales = await saleRepository.findByVendedor(vendedorId);
    res.json(sales);
  } catch (error) {
    console.error('Error al obtener ventas por vendedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ==================== REPORTES ====================

export const getSalesByDay = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const report = await saleRepository.getSalesByDay(days);
    res.json(report);
  } catch (error) {
    console.error('Error al obtener reporte de ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTopProducts = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const topProducts = await saleRepository.getTopProducts(limit);
    res.json(topProducts);
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
