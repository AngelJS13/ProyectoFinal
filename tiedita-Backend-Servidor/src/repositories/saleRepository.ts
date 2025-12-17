import { salesCollection } from '../config/firebase.js';
import { Sale, SaleItem } from '../types/index.js';

/**
 * Repository para Ventas - Firebase Firestore (No Relacional)
 *
 * Colección: sales
 * Documento: {
 *   vendedorId, vendedorNombre,
 *   items: [{ productoId, productoNombre, cantidad, precioUnitario, subtotal }],
 *   total, metodoPago, fechaCreacion
 * }
 *
 * Los documentos de venta contienen toda la información necesaria
 * (denormalizado) para consultas rápidas sin JOINs
 */

// Transformar documento de Firestore a objeto Sale
const docToSale = (doc: FirebaseFirestore.DocumentSnapshot): Sale => {
  const data = doc.data()!;
  return {
    id: doc.id,
    vendedorId: data.vendedorId,
    vendedorNombre: data.vendedorNombre,
    items: data.items as SaleItem[],
    total: data.total,
    metodoPago: data.metodoPago,
    fechaCreacion: data.fechaCreacion,
  };
};

export const saleRepository = {
  findAll: async (): Promise<Sale[]> => {
    const snapshot = await salesCollection
      .orderBy('fechaCreacion', 'desc')
      .get();
    return snapshot.docs.map(docToSale);
  },

  findById: async (id: string): Promise<Sale | null> => {
    const doc = await salesCollection.doc(id).get();
    return doc.exists ? docToSale(doc) : null;
  },

  findByVendedor: async (vendedorId: string): Promise<Sale[]> => {
    const snapshot = await salesCollection
      .where('vendedorId', '==', vendedorId)
      .orderBy('fechaCreacion', 'desc')
      .get();
    return snapshot.docs.map(docToSale);
  },

  findByDateRange: async (startDate: Date, endDate: Date): Promise<Sale[]> => {
    const snapshot = await salesCollection
      .where('fechaCreacion', '>=', startDate.toISOString())
      .where('fechaCreacion', '<=', endDate.toISOString())
      .orderBy('fechaCreacion', 'desc')
      .get();
    return snapshot.docs.map(docToSale);
  },

  findToday: async (): Promise<Sale[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return saleRepository.findByDateRange(today, tomorrow);
  },

  findByMetodoPago: async (metodoPago: string): Promise<Sale[]> => {
    const snapshot = await salesCollection
      .where('metodoPago', '==', metodoPago)
      .orderBy('fechaCreacion', 'desc')
      .get();
    return snapshot.docs.map(docToSale);
  },

  create: async (data: {
    vendedorId: string;
    vendedorNombre: string;
    items: SaleItem[];
    total: number;
    metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  }): Promise<Sale> => {
    const docRef = await salesCollection.add({
      vendedorId: data.vendedorId,
      vendedorNombre: data.vendedorNombre,
      items: data.items,
      total: data.total,
      metodoPago: data.metodoPago,
      fechaCreacion: new Date().toISOString(),
    });

    const newDoc = await docRef.get();
    return docToSale(newDoc);
  },

  // Estadísticas
  getTotalSales: async (): Promise<number> => {
    const snapshot = await salesCollection.get();
    return snapshot.docs.reduce((total, doc) => total + (doc.data().total || 0), 0);
  },

  getTodaySales: async (): Promise<number> => {
    const todaySales = await saleRepository.findToday();
    return todaySales.reduce((total, sale) => total + sale.total, 0);
  },

  count: async (): Promise<number> => {
    const snapshot = await salesCollection.count().get();
    return snapshot.data().count;
  },

  countToday: async (): Promise<number> => {
    const todaySales = await saleRepository.findToday();
    return todaySales.length;
  },

  // Reportes
  getSalesByDay: async (days: number = 7): Promise<{ fecha: string; total: number; cantidad: number }[]> => {
    const results: { fecha: string; total: number; cantidad: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const sales = await saleRepository.findByDateRange(date, nextDate);
      const total = sales.reduce((sum, sale) => sum + sale.total, 0);

      results.push({
        fecha: date.toISOString().split('T')[0],
        total,
        cantidad: sales.length,
      });
    }

    return results;
  },

  getTopProducts: async (limit: number = 10): Promise<{ productoId: string; productoNombre: string; cantidad: number; total: number }[]> => {
    const snapshot = await salesCollection.get();
    const productStats: Map<string, { productoNombre: string; cantidad: number; total: number }> = new Map();

    snapshot.docs.forEach(doc => {
      const items = doc.data().items as SaleItem[];
      items.forEach(item => {
        const existing = productStats.get(item.productoId) || { productoNombre: item.productoNombre, cantidad: 0, total: 0 };
        existing.cantidad += item.cantidad;
        existing.total += item.subtotal;
        productStats.set(item.productoId, existing);
      });
    });

    return Array.from(productStats.entries())
      .map(([productoId, stats]) => ({ productoId, ...stats }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limit);
  },
};
