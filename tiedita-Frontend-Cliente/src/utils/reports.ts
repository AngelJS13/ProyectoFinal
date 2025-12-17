import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Sale, Product, User } from '@/types';
import logoImg from '@/assets/logo.png';

const loadImageAsBase64 = async (src: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = src;
  });
};

export const generateSalesReportPDF = async (sales: Sale[], title: string = 'Reporte de Ventas') => {
  const doc = new jsPDF();
  
  // Add logo
  try {
    const logoBase64 = await loadImageAsBase64(logoImg);
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 10, 10, 25, 25);
    }
  } catch (e) {
    console.log('Logo not loaded');
  }

  // Header
  doc.setFontSize(20);
  doc.setTextColor(34, 87, 48);
  doc.text('Abarrotes Fresh', 40, 20);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(title, 40, 28);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 40, 35);

  // Table
  const tableData = sales.map(sale => [
    new Date(sale.fechaCreacion).toLocaleDateString('es-MX'),
    sale.vendedorNombre,
    sale.items.length.toString(),
    sale.metodoPago,
    `$${sale.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Fecha', 'Vendedor', 'Productos', 'Método Pago', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 87, 48] },
    footStyles: { fillColor: [240, 240, 240] },
    foot: [['', '', '', 'TOTAL:', `$${sales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}`]],
  });

  doc.save(`ventas_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateSalesReportExcel = (sales: Sale[], title: string = 'Reporte de Ventas') => {
  const data: Record<string, string | number>[] = sales.map(sale => ({
    'ID': sale.id,
    'Fecha': new Date(sale.fechaCreacion).toLocaleDateString('es-MX'),
    'Vendedor': sale.vendedorNombre,
    'Productos': sale.items.length,
    'Método de Pago': sale.metodoPago,
    'Total': sale.total,
  }));

  data.push({
    'ID': '',
    'Fecha': '',
    'Vendedor': '',
    'Productos': '',
    'Método de Pago': 'TOTAL:',
    'Total': sales.reduce((acc, s) => acc + s.total, 0),
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  XLSX.writeFile(wb, `ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateProductsReportPDF = async (products: Product[], title: string = 'Inventario de Productos') => {
  const doc = new jsPDF();
  
  try {
    const logoBase64 = await loadImageAsBase64(logoImg);
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 10, 10, 25, 25);
    }
  } catch (e) {
    console.log('Logo not loaded');
  }

  doc.setFontSize(20);
  doc.setTextColor(34, 87, 48);
  doc.text('Abarrotes Fresh', 40, 20);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(title, 40, 28);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 40, 35);

  const tableData = products.map(p => [
    p.nombre,
    p.categoria,
    `$${p.precio.toFixed(2)}`,
    p.stock.toString(),
    p.activo ? 'Activo' : 'Inactivo',
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Producto', 'Categoría', 'Precio', 'Stock', 'Estado']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 87, 48] },
    styles: { fontSize: 8 },
  });

  doc.save(`productos_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateProductsReportExcel = (products: Product[]) => {
  const data = products.map(p => ({
    'Código': p.codigoBarras,
    'Nombre': p.nombre,
    'Categoría': p.categoria,
    'Precio': p.precio,
    'Stock': p.stock,
    'Unidad': p.unidad,
    'Estado': p.activo ? 'Activo' : 'Inactivo',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateUsersReportPDF = async (users: User[], title: string = 'Reporte de Usuarios') => {
  const doc = new jsPDF();
  
  try {
    const logoBase64 = await loadImageAsBase64(logoImg);
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 10, 10, 25, 25);
    }
  } catch (e) {
    console.log('Logo not loaded');
  }

  doc.setFontSize(20);
  doc.setTextColor(34, 87, 48);
  doc.text('Abarrotes Fresh', 40, 20);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(title, 40, 28);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 40, 35);

  const tableData = users.map(u => [
    u.nombre,
    u.email,
    u.rol.charAt(0).toUpperCase() + u.rol.slice(1),
    u.activo ? 'Activo' : 'Inactivo',
    new Date(u.fechaCreacion).toLocaleDateString('es-MX'),
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Nombre', 'Email', 'Rol', 'Estado', 'Fecha Registro']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 87, 48] },
  });

  doc.save(`usuarios_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateUsersReportExcel = (users: User[]) => {
  const data = users.map(u => ({
    'ID': u.id,
    'Nombre': u.nombre,
    'Email': u.email,
    'Rol': u.rol,
    'Estado': u.activo ? 'Activo' : 'Inactivo',
    'Fecha Registro': new Date(u.fechaCreacion).toLocaleDateString('es-MX'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
  XLSX.writeFile(wb, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
};
