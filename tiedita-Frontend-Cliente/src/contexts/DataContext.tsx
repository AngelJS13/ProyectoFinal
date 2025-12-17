import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Product, Sale, DashboardStats } from '@/types';
import { initialUsers, initialSales } from '@/data/initialData';
import { initialProducts } from '@/data/products';

interface DataContextType {
  users: User[];
  products: Product[];
  sales: Sale[];
  stats: DashboardStats;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addSale: (sale: Sale) => void;
  refreshStats: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalVentas: 0,
    ventasHoy: 0,
    productosActivos: 0,
    usuariosActivos: 0,
    productosBajoStock: 0,
  });

  useEffect(() => {
    // Load users
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      localStorage.setItem('users', JSON.stringify(initialUsers));
      setUsers(initialUsers);
    }

    // Load products
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      localStorage.setItem('products', JSON.stringify(initialProducts));
      setProducts(initialProducts);
    }

    // Load sales
    const savedSales = localStorage.getItem('sales');
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    } else {
      localStorage.setItem('sales', JSON.stringify(initialSales));
      setSales(initialSales);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [users, products, sales]);

  const refreshStats = () => {
    const today = new Date().toDateString();
    const ventasHoy = sales.filter(s => new Date(s.fechaCreacion).toDateString() === today);
    
    setStats({
      totalVentas: sales.reduce((acc, s) => acc + s.total, 0),
      ventasHoy: ventasHoy.reduce((acc, s) => acc + s.total, 0),
      productosActivos: products.filter(p => p.activo).length,
      usuariosActivos: users.filter(u => u.activo).length,
      productosBajoStock: products.filter(p => p.stock < 10).length,
    });
  };

  const addUser = (user: User) => {
    const newUsers = [...users, user];
    setUsers(newUsers);
    localStorage.setItem('users', JSON.stringify(newUsers));
  };

  const updateUser = (user: User) => {
    const newUsers = users.map(u => u.id === user.id ? user : u);
    setUsers(newUsers);
    localStorage.setItem('users', JSON.stringify(newUsers));
  };

  const deleteUser = (id: string) => {
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    localStorage.setItem('users', JSON.stringify(newUsers));
  };

  const addProduct = (product: Product) => {
    const newProducts = [...products, product];
    setProducts(newProducts);
    localStorage.setItem('products', JSON.stringify(newProducts));
  };

  const updateProduct = (product: Product) => {
    const newProducts = products.map(p => p.id === product.id ? product : p);
    setProducts(newProducts);
    localStorage.setItem('products', JSON.stringify(newProducts));
  };

  const deleteProduct = (id: string) => {
    const newProducts = products.filter(p => p.id !== id);
    setProducts(newProducts);
    localStorage.setItem('products', JSON.stringify(newProducts));
  };

  const addSale = (sale: Sale) => {
    const newSales = [...sales, sale];
    setSales(newSales);
    localStorage.setItem('sales', JSON.stringify(newSales));

    // Update stock
    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.productoId);
      if (product) {
        updateProduct({
          ...product,
          stock: product.stock - item.cantidad,
          fechaModificacion: new Date().toISOString(),
        });
      }
    });
  };

  return (
    <DataContext.Provider value={{
      users,
      products,
      sales,
      stats,
      addUser,
      updateUser,
      deleteUser,
      addProduct,
      updateProduct,
      deleteProduct,
      addSale,
      refreshStats,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
