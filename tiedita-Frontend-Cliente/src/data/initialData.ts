import { User, Sale } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const initialUsers: User[] = [
  {
    id: uuidv4(),
    nombre: 'Administrador',
    email: 'admin@abarrotes.com',
    password: 'admin123',
    rol: 'admin',
    activo: true,
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    nombre: 'Juan Vendedor',
    email: 'vendedor@abarrotes.com',
    password: 'vendedor123',
    rol: 'vendedor',
    activo: true,
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString(),
  },
];

export const initialSales: Sale[] = [];
