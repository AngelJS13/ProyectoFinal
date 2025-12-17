import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { productRepository } from '../repositories/productRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { saleRepository } from '../repositories/saleRepository.js';
import { DashboardStats } from '../types/index.js';

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener datos de ambas bases de datos en paralelo
    const [
      totalVentas,
      ventasHoy,
      products,
      usuariosActivos,
    ] = await Promise.all([
      saleRepository.getTotalSales(),           // Firebase
      saleRepository.getTodaySales(),           // Firebase
      productRepository.findAll(),               // MySQL
      userRepository.countActive(),              // Firebase
    ]);

    const productosActivos = products.filter(p => p.activo).length;
    const productosBajoStock = products.filter(p => p.stock < 10).length;

    const stats: DashboardStats = {
      totalVentas,
      ventasHoy,
      productosActivos,
      usuariosActivos,
      productosBajoStock,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getDetailedStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalVentas,
      ventasHoy,
      products,
      usuariosActivos,
      salesByDay,
      topProducts,
      todaySalesCount,
    ] = await Promise.all([
      saleRepository.getTotalSales(),
      saleRepository.getTodaySales(),
      productRepository.findAll(),
      userRepository.countActive(),
      saleRepository.getSalesByDay(7),
      saleRepository.getTopProducts(5),
      saleRepository.countToday(),
    ]);

    const lowStockProducts = await productRepository.findLowStock(10);

    res.json({
      resumen: {
        totalVentas,
        ventasHoy,
        productosActivos: products.filter(p => p.activo).length,
        usuariosActivos,
        productosBajoStock: lowStockProducts.length,
        ventasHoyCount: todaySalesCount,
      },
      ventasPorDia: salesByDay,
      productosTopVentas: topProducts,
      productosBajoStock: lowStockProducts,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas detalladas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
