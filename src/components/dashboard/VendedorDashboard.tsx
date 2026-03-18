import { useERP } from '@/context/ERPContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, Package, TrendingUp, Search, Plus,
  ArrowRight, AlertTriangle, DollarSign, Boxes
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Part } from '@/types';
import { cn } from '@/lib/utils';

export function VendedorDashboard() {
  const { parts, sales, stats, warehouses, getLowStockParts } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockItems, setLowStockItems] = useState<Part[]>([]);
  const [recentSales, setRecentSales] = useState<typeof sales>([]);

  useEffect(() => {
    setLowStockItems(getLowStockParts());
    const sorted = [...sales].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);
    setRecentSales(sorted);
  }, [sales, getLowStockParts]);

  const filteredParts = parts.filter(part => 
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const getWarehouseName = (id: string) => {
    return warehouses.find(w => w.id === id)?.name || 'Desconocido';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Ventas</h1>
          <p className="text-slate-500">Gestión de repuestos y ventas</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => window.location.hash = '/ventas/nueva'}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Venta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas Hoy"
          value={formatCurrency(stats.salesToday)}
          subtitle={`${stats.salesCountToday} transacciones`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Productos"
          value={stats.totalParts.toString()}
          icon={Boxes}
          color="blue"
        />
        <StatCard
          title="Stock Bajo"
          value={stats.lowStockItems.toString()}
          icon={AlertTriangle}
          color="red"
          alert={stats.lowStockItems > 0}
        />
        <StatCard
          title="Ventas del Mes"
          value={formatCurrency(stats.revenueMonth)}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Search */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              Buscar Repuestos
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/inventario'}>
              Ver inventario
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-2">
              {searchTerm && filteredParts.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No se encontraron productos</p>
              ) : searchTerm ? (
                filteredParts.map((part) => (
                  <div 
                    key={part.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{part.name}</p>
                      <p className="text-xs text-slate-500">SKU: {part.sku}</p>
                      <p className="text-xs text-slate-400">{getWarehouseName(part.warehouseId)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(part.salePrice)}</p>
                      <Badge 
                        variant={part.stock <= part.minStock ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        Stock: {part.stock}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Escribe para buscar productos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Stock Bajo
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/inventario'}>
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-green-600">
                  <Package className="w-10 h-10 mb-2" />
                  <p className="text-sm font-medium">Todo el stock está en niveles normales</p>
                </div>
              ) : (
                lowStockItems.slice(0, 5).map((part) => (
                  <div 
                    key={part.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{part.name}</p>
                      <p className="text-xs text-slate-500">SKU: {part.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        {part.stock} / {part.minStock}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-500" />
            Ventas Recientes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/ventas'}>
            Ver todas
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <ShoppingCart className="w-10 h-10 mb-2" />
                <p className="text-sm">No hay ventas recientes</p>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div 
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => window.location.hash = `/ventas/${sale.id}`}
                >
                  <div>
                    <p className="font-medium text-sm">{sale.saleNumber}</p>
                    <p className="text-xs text-slate-500">
                      {sale.items.length} producto(s) • {getWarehouseName(sale.warehouseId)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(sale.createdAt).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickActionButton
              icon={Plus}
              label="Nueva Venta"
              onClick={() => window.location.hash = '/ventas/nueva'}
              color="green"
            />
            <QuickActionButton
              icon={Package}
              label="Ver Inventario"
              onClick={() => window.location.hash = '/inventario'}
              color="blue"
            />
            <QuickActionButton
              icon={ShoppingCart}
              label="Historial Ventas"
              onClick={() => window.location.hash = '/ventas'}
              color="orange"
            />
            <QuickActionButton
              icon={AlertTriangle}
              label="Stock Bajo"
              onClick={() => window.location.hash = '/inventario'}
              color="red"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  color,
  alert 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'red' | 'orange';
  alert?: boolean;
}) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card className={cn(alert && 'border-red-300 ring-1 ring-red-200')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void;
  color: 'green' | 'blue' | 'orange' | 'red';
}) {
  const colors = {
    green: 'hover:bg-green-50 hover:border-green-200 hover:text-green-600',
    blue: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600',
    orange: 'hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600',
    red: 'hover:bg-red-50 hover:border-red-200 hover:text-red-600',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 transition-all",
        colors[color]
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
