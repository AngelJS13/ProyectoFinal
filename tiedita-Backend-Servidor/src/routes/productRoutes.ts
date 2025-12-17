import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductByBarcode,
  getProductsByCategory,
  getLowStockProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  getUnits,
} from '../controllers/productController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Productos
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);

// Solo admin puede crear, actualizar y eliminar productos
router.post('/', adminMiddleware, createProduct);
router.put('/:id', adminMiddleware, updateProduct);
router.delete('/:id', adminMiddleware, deleteProduct);

// Categorías
router.get('/meta/categories', getCategories);
router.post('/meta/categories', adminMiddleware, createCategory);

// Unidades
router.get('/meta/units', getUnits);

export default router;
