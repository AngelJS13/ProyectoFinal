import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, FileSpreadsheet, Search, Eye, Receipt } from 'lucide-react';
import { generateSalesReportPDF, generateSalesReportExcel } from '@/utils/reports';

const SalesHistory: React.FC = () => {
  const { sales, users } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState<typeof sales[0] | null>(null);

  const isAdmin = user?.rol === 'admin';

  const filterByDate = (date: string) => {
    const saleDate = new Date(date);
    const today = new Date();
    
    switch (dateFilter) {
      case 'today':
        return saleDate.toDateString() === today.toDateString();
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return saleDate >= monthAgo;
      default:
        return true;
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.vendedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.includes(searchTerm);
    const matchesVendor = vendorFilter === 'all' || sale.vendedorId === vendorFilter;
    const matchesDate = filterByDate(sale.fechaCreacion);
    const matchesUser = isAdmin || sale.vendedorId === user?.id;
    return matchesSearch && matchesVendor && matchesDate && matchesUser;
  }).reverse();

  const totalFiltered = filteredSales.reduce((acc, s) => acc + s.total, 0);

  const vendors = users.filter(u => u.rol === 'vendedor' || u.rol === 'admin');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Historial de Ventas</h1>
          <p className="text-muted-foreground">{filteredSales.length} ventas encontradas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateSalesReportPDF(filteredSales)}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => generateSalesReportExcel(filteredSales)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ventas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {isAdmin && (
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los vendedores</SelectItem>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay ventas registradas</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-center">Productos</TableHead>
                      <TableHead>Método Pago</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {new Date(sale.fechaCreacion).toLocaleDateString('es-MX')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sale.fechaCreacion).toLocaleTimeString('es-MX')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{sale.vendedorNombre}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{sale.items.length}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>
                            {sale.metodoPago === 'efectivo' ? 'Efectivo' :
                             sale.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ${sale.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSale(sale)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalle de Venta</DialogTitle>
                              </DialogHeader>
                              {selectedSale && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Fecha</p>
                                      <p className="font-medium">
                                        {new Date(selectedSale.fechaCreacion).toLocaleString('es-MX')}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Vendedor</p>
                                      <p className="font-medium">{selectedSale.vendedorNombre}</p>
                                    </div>
                                  </div>
                                  <div className="border rounded-lg p-4 space-y-2">
                                    {selectedSale.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.productoNombre} x{item.cantidad}</span>
                                        <span>${item.subtotal.toFixed(2)}</span>
                                      </div>
                                    ))}
                                    <div className="border-t pt-2 flex justify-between font-bold">
                                      <span>Total</span>
                                      <span className="text-primary">${selectedSale.total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg flex justify-between items-center">
                <span className="font-medium">Total filtrado:</span>
                <span className="text-2xl font-bold text-primary">
                  ${totalFiltered.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHistory;
