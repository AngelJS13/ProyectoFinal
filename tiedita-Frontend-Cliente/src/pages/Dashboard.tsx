import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Users, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { stats, sales, products } = useData();

  const recentSales = sales.slice(-5).reverse();
  const lowStockProducts = products.filter(p => p.stock < 10).slice(0, 5);

  const statCards = [
    {
      title: 'Ventas Totales',
      value: `$${stats.totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Ventas Hoy',
      value: `$${stats.ventasHoy.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: 'Productos Activos',
      value: stats.productosActivos.toString(),
      icon: Package,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      title: 'Usuarios Activos',
      value: stats.usuariosActivos.toString(),
      icon: Users,
      color: 'text-accent-foreground',
      bg: 'bg-accent',
    },
    {
      title: 'Bajo Stock',
      value: stats.productosBajoStock.toString(),
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      title: 'Total Ventas',
      value: sales.length.toString(),
      icon: ShoppingCart,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">¡Bienvenido, {user?.nombre}!</h1>
        <p className="text-muted-foreground">Resumen de tu tienda de abarrotes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ventas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay ventas registradas</p>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{sale.vendedorNombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.fechaCreacion).toLocaleDateString('es-MX')} - {sale.items.length} productos
                      </p>
                    </div>
                    <p className="font-bold text-primary">${sale.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Productos con Bajo Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Todo el inventario está bien abastecido</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                    <div>
                      <p className="font-medium">{product.nombre}</p>
                      <p className="text-sm text-muted-foreground">{product.categoria}</p>
                    </div>
                    <span className="px-3 py-1 bg-warning text-warning-foreground rounded-full text-sm font-medium">
                      {product.stock} unidades
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
