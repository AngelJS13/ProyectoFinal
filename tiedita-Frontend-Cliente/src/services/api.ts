import { User, Product, Sale, DashboardStats } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper para obtener el token
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper para manejar respuestas
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || 'Error en la petición');
  }
  return response.json();
};

// ==================== AUTH ====================
export const authService = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ user: Omit<User, 'password'>; token: string }>(response);
  },

  verify: async () => {
    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ user: Omit<User, 'password'> }>(response);
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ==================== USERS ====================
export const userService = {
  getAll: async (): Promise<Omit<User, 'password'>[]> => {
    const response = await fetch(`${API_URL}/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Omit<User, 'password'>> => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (user: Omit<User, 'id' | 'fechaCreacion' | 'fechaModificacion'>): Promise<Omit<User, 'password'>> => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    return handleResponse(response);
  },

  update: async (id: string, user: Partial<User>): Promise<Omit<User, 'password'>> => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== PRODUCTS ====================
export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await fetch(`${API_URL}/products`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Product> => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getByBarcode: async (barcode: string): Promise<Product> => {
    const response = await fetch(`${API_URL}/products/barcode/${barcode}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (product: Omit<Product, 'id' | 'fechaCreacion' | 'fechaModificacion'>): Promise<Product> => {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    return handleResponse(response);
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    return handleResponse(response);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== SALES ====================
export const saleService = {
  getAll: async (): Promise<Sale[]> => {
    const response = await fetch(`${API_URL}/sales`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id: string): Promise<Sale> => {
    const response = await fetch(`${API_URL}/sales/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getByDateRange: async (startDate?: string, endDate?: string): Promise<Sale[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_URL}/sales/filter?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (sale: { items: { productoId: string; cantidad: number }[]; metodoPago: string }): Promise<Sale> => {
    const response = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sale),
    });
    return handleResponse(response);
  },
};

// ==================== STATS ====================
export const statsService = {
  get: async (): Promise<DashboardStats> => {
    const response = await fetch(`${API_URL}/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Health check
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await fetch(`${API_URL}/health`);
  return handleResponse(response);
};
