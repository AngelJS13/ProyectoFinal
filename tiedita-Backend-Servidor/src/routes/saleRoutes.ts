import { Router } from 'express';
import {
  getSales,
  getSaleById,
  createSale,
  getSalesByDateRange,
  getTodaySales,
  getSalesByVendedor,
  getSalesByDay,
  getTopProducts,
} from '../controllers/saleController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Ventas
router.get('/', getSales);
router.get('/today', getTodaySales);
router.get('/filter', getSalesByDateRange);
router.get('/vendedor/:vendedorId', getSalesByVendedor);
router.get('/report/by-day', getSalesByDay);
router.get('/report/top-products', getTopProducts);
router.get('/:id', getSaleById);
router.post('/', createSale);

export default router;
