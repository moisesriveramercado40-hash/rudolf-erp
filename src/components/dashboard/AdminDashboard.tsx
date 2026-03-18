import { useERP } from '@/context/ERPContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Wrench, Package, 
  ShoppingCart, DollarSign, AlertTriangle, ArrowRight,
  CheckCircle, Clock, Download, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { WorkOrder } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

export function AdminDashboard() {
  const { stats, workOrders, getLowStockParts, exportDatabase } = useERP();
  const [recentOrders, setRecentOrders] = useState<WorkOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<ReturnType<typeof getLowStockParts>>([]);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Obtener órdenes recientes
    const sorted = [...workOrders].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);
    setRecentOrders(sorted);
    setLowStockItems(getLowStockParts());
  }, [workOrders, getLowStockParts]);

  // Datos para gráficos
  const revenueData = [
    { name: 'Lun', ingresos: 4000, egresos: 2400 },
    { name: 'Mar', ingresos: 3000, egresos: 1398 },
    { name: 'Mie', ingresos: 2000, egresos: 9800 },
    { name: 'Jue', ingresos: 2780, egresos: 3908 },
    { name: 'Vie', ingresos: 1890, egresos: 4800 },
    { name: 'Sab', ingresos: 2390, egresos: 3800 },
    { name: 'Dom', ingresos: 3490, egresos: 4300 },
  ];

  const orderStatusData = [
    { name: 'Pendientes', value: stats.pendingOrders },
    { name: 'En Progreso', value: stats.inProgressOrders },
    { name: 'Completados', value: workOrders.filter(wo => wo.status === 'completado').length },
    { name: 'Entregados', value: workOrders.filter(wo => wo.status === 'entregado').length },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const getStatusBadge = (status: WorkOrder['status']) => {
    const styles: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      asignado: 'bg-blue-100 text-blue-700 border-blue-200',
      en_progreso: 'bg-orange-100 text-orange-700 border-orange-200',
      espera_repuestos: 'bg-purple-100 text-purple-700 border-purple-200',
      calidad: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      completado: 'bg-green-100 text-green-700 border-green-200',
      entregado: 'bg-slate-100 text-slate-700 border-slate-200',
      cancelado: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status: WorkOrder['status']) => {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      asignado: 'Asignado',
      en_progreso: 'En Progreso',
      espera_repuestos: 'Espera Repuestos',
      calidad: 'Control Calidad',
      completado: 'Completado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  const handleExport = () => {
    setIsExporting(true);
    exportDatabase();
    setTimeout(() => {
      setIsExporting(false);
      setShowBackupDialog(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-slate-500">Vista general del taller RUDOLF</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBackupDialog(true)}>
            <Download className="w-4 h-4 mr-2" />
            Respaldar BD
          </Button>
          <Button variant="outline" onClick={() => window.location.hash = '/ordenes'}>
            <Wrench className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => window.location.hash = '/ventas'}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ingresos Hoy"
          value={formatCurrency(stats.revenueToday)}
          icon={DollarSign}
          trend="+12%"
          trendUp={true}
          color="green"
        />
        <StatCard
          title="Órdenes Pendientes"
          value={stats.pendingOrders.toString()}
          icon={Clock}
          subtitle={`${stats.inProgressOrders} en progreso`}
          color="orange"
        />
        <StatCard
          title="Ventas Hoy"
          value={stats.salesCountToday.toString()}
          icon={ShoppingCart}
          subtitle={formatCurrency(stats.salesToday)}
          color="blue"
        />
        <StatCard
          title="Stock Bajo"
          value={stats.lowStockItems.toString()}
          icon={AlertTriangle}
          subtitle="productos"
          color="red"
          alert={stats.lowStockItems > 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Ingresos vs Egresos</CardTitle>
            <Badge variant="outline">Esta semana</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="ingresos" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Estado de Órdenes</CardTitle>
            <Badge variant="outline">Total: {stats.totalOrders}</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orderStatusData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {orderStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-slate-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Órdenes Recientes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/ordenes'}>
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No hay órdenes recientes</p>
              ) : (
                recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => window.location.hash = '/ordenes'}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-slate-500">{order.description.slice(0, 40)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn("text-xs", getStatusBadge(order.status))}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      <span className="text-sm font-medium">{formatCurrency(order.totalCost)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <CheckCircle className="w-10 h-10 mb-2" />
                  <p className="text-sm">Todo en orden</p>
                </div>
              ) : (
                lowStockItems.slice(0, 5).map((part) => (
                  <div 
                    key={part.id} 
                    className="flex items-center gap-3 p-3 bg-red-50 rounded-lg cursor-pointer"
                    onClick={() => window.location.hash = '/inventario'}
                  >
                    <Package className="w-5 h-5 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{part.name}</p>
                      <p className="text-xs text-slate-500">SKU: {part.sku}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {part.stock} / {part.minStock}
                    </Badge>
                  </div>
                ))
              )}
              
              {stats.pendingOrders > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Órdenes sin asignar</p>
                    <p className="text-xs text-slate-500">{stats.pendingOrders} orden(es) pendiente(s)</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Confirmation Dialog */}
      <AlertDialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Respaldar Base de Datos</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea descargar una copia de seguridad de toda la base de datos? 
              El archivo contendrá todos los datos del sistema incluyendo clientes, órdenes, inventario, ventas y transacciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Respaldo
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  color: 'green' | 'orange' | 'blue' | 'red';
  alert?: boolean;
}

function StatCard({ title, value, icon: Icon, trend, trendUp, subtitle, color, alert }: StatCardProps) {
  const colorStyles = {
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card className={cn(alert && 'border-red-300 ring-1 ring-red-200')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trendUp ? 'text-green-600' : 'text-red-600'
              )}>
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend}
              </div>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorStyles[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
