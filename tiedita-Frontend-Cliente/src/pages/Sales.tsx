import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sale, SaleItem, Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Search, ShoppingCart, CreditCard, Banknote, Building2 } from 'lucide-react';

const SalesPage: React.FC = () => {
  const { products, addSale } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');

  const availableProducts = products.filter(p => p.activo && p.stock > 0);
  const filteredProducts = availableProducts.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigoBarras.includes(searchTerm)
  );

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productoId === product.id);
    
    if (existing) {
      if (existing.cantidad >= product.stock) {
        toast.error('No hay suficiente stock');
        return;
      }
      setCart(cart.map(item =>
        item.productoId === product.id
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precioUnitario }
          : item
      ));
    } else {
      setCart([...cart, {
        productoId: product.id,
        productoNombre: product.nombre,
        cantidad: 1,
        precioUnitario: product.precio,
        subtotal: product.precio,
      }]);
    }
    toast.success(`${product.nombre} agregado`);
  };

  const updateQuantity = (productoId: string, cantidad: number) => {
    const product = products.find(p => p.id === productoId);
    if (!product || cantidad > product.stock) {
      toast.error('No hay suficiente stock');
      return;
    }
    if (cantidad <= 0) {
      removeFromCart(productoId);
      return;
    }
    setCart(cart.map(item =>
      item.productoId === productoId
        ? { ...item, cantidad, subtotal: cantidad * item.precioUnitario }
        : item
    ));
  };

  const removeFromCart = (productoId: string) => {
    setCart(cart.filter(item => item.productoId !== productoId));
  };

  const completeSale = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    const sale: Sale = {
      id: uuidv4(),
      vendedorId: user!.id,
      vendedorNombre: user!.nombre,
      items: cart,
      total,
      metodoPago,
      fechaCreacion: new Date().toISOString(),
    };

    addSale(sale);
    setCart([]);
    toast.success(`Venta completada: $${total.toFixed(2)}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Nueva Venta</h1>
        <p className="text-muted-foreground">Vendedor: {user?.nombre}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto o escanear código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                {filteredProducts.slice(0, 30).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-all text-left group"
                  >
                    <p className="font-medium line-clamp-2 group-hover:text-primary">{product.nombre}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-lg font-bold text-primary">${product.precio.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">{product.stock} disp.</span>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-2" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Carrito vacío</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productoId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.productoNombre}</p>
                        <p className="text-xs text-muted-foreground">${item.precioUnitario.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateQuantity(item.productoId, parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center"
                          min={0}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productoId)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={metodoPago === 'efectivo' ? 'default' : 'outline'}
                      onClick={() => setMetodoPago('efectivo')}
                      className="flex flex-col h-auto py-3"
                    >
                      <Banknote className="h-5 w-5 mb-1" />
                      <span className="text-xs">Efectivo</span>
                    </Button>
                    <Button
                      type="button"
                      variant={metodoPago === 'tarjeta' ? 'default' : 'outline'}
                      onClick={() => setMetodoPago('tarjeta')}
                      className="flex flex-col h-auto py-3"
                    >
                      <CreditCard className="h-5 w-5 mb-1" />
                      <span className="text-xs">Tarjeta</span>
                    </Button>
                    <Button
                      type="button"
                      variant={metodoPago === 'transferencia' ? 'default' : 'outline'}
                      onClick={() => setMetodoPago('transferencia')}
                      className="flex flex-col h-auto py-3"
                    >
                      <Building2 className="h-5 w-5 mb-1" />
                      <span className="text-xs">Transfer.</span>
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={completeSale}
                  className="w-full h-12 text-lg"
                  disabled={cart.length === 0}
                >
                  Completar Venta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
