import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, Users, Package, ShoppingCart, Download } from 'lucide-react';
import {
  generateSalesReportPDF,
  generateSalesReportExcel,
  generateProductsReportPDF,
  generateProductsReportExcel,
  generateUsersReportPDF,
  generateUsersReportExcel,
} from '@/utils/reports';

const Reports: React.FC = () => {
  const { sales, products, users } = useData();
  const { user } = useAuth();

  const isAdmin = user?.rol === 'admin';

  const reportCards = [
    {
      title: 'Reporte de Ventas',
      description: 'Exporta el historial completo de ventas con detalles de vendedor, productos y totales.',
      icon: ShoppingCart,
      color: 'text-primary',
      bg: 'bg-primary/10',
      count: `${sales.length} ventas`,
      onPDF: () => generateSalesReportPDF(sales),
      onExcel: () => generateSalesReportExcel(sales),
    },
    {
      title: 'Inventario de Productos',
      description: 'Lista completa de productos con precios, stock y estado.',
      icon: Package,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      count: `${products.length} productos`,
      onPDF: () => generateProductsReportPDF(products),
      onExcel: () => generateProductsReportExcel(products),
    },
    {
      title: 'Reporte de Usuarios',
      description: 'Lista de usuarios del sistema con roles y estado.',
      icon: Users,
      color: 'text-accent-foreground',
      bg: 'bg-accent',
      count: `${users.length} usuarios`,
      onPDF: () => generateUsersReportPDF(users),
      onExcel: () => generateUsersReportExcel(users),
      adminOnly: true,
    },
  ];

  const filteredReports = reportCards.filter(r => !r.adminOnly || isAdmin);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">Genera reportes en PDF o Excel con el logo de la tienda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report, index) => (
          <Card key={index} className="hover-lift">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-full ${report.bg}`}>
                  <report.icon className={`h-6 w-6 ${report.color}`} />
                </div>
                <span className="text-sm text-muted-foreground">{report.count}</span>
              </div>
              <CardTitle className="mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={report.onPDF} className="flex-1" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={report.onExcel} className="flex-1" variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Información de Reportes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Formato PDF
              </h3>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• Incluye logo de la tienda</li>
                <li>• Fecha de generación</li>
                <li>• Tablas formateadas</li>
                <li>• Totales calculados</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Formato Excel
              </h3>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• Datos en columnas</li>
                <li>• Fácil de filtrar</li>
                <li>• Compatible con fórmulas</li>
                <li>• Exportable a otros formatos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
