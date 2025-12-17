export type UserRole = 'admin' | 'vendedor';

export interface User {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  stock: number;
  unidad: string;
  codigoBarras: string;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface SaleItem {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  vendedorId: string;
  vendedorNombre: string;
  items: SaleItem[];
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  fechaCreacion: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface DashboardStats {
  totalVentas: number;
  ventasHoy: number;
  productosActivos: number;
  usuariosActivos: number;
  productosBajoStock: number;
}
