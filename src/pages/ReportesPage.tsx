import { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, TrendingUp, Wrench, 
  ShoppingCart, DollarSign, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

export function ReportesPage() {
  const { workOrders, sales, transactions, parts } = useERP();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  // Datos según período
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return {
      orders: workOrders.filter(o => new Date(o.createdAt) >= startDate),
      sales: sales.filter(s => new Date(s.createdAt) >= startDate),
      transactions: transactions.filter(t => new Date(t.date) >= startDate),
    };
  }, [workOrders, sales, transactions, period]);

  // Estadísticas
  const stats = useMemo(() => {
    const income = filteredData.transactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredData.transactions
      .filter(t => t.type === 'egreso')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalOrders: filteredData.orders.length,
      totalSales: filteredData.sales.length,
      income,
      expenses,
      profit: income - expenses,
      avgOrderValue: filteredData.orders.length > 0 
        ? filteredData.orders.reduce((sum, o) => sum + o.totalCost, 0) / filteredData.orders.length 
        : 0,
    };
  }, [filteredData]);

  // Gráficos
  const ordersByStatus = useMemo(() => {
    const statusCount: Record<string, number> = {};
    filteredData.orders.forEach(o => {
      statusCount[o.status] = (statusCount[o.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [filteredData.orders]);

  const salesByDay = useMemo(() => {
    const daily: Record<string, number> = {};
    filteredData.sales.forEach(s => {
      const date = new Date(s.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
      daily[date] = (daily[date] || 0) + s.total;
    });
    return Object.entries(daily).map(([name, value]) => ({ name, value }));
  }, [filteredData.sales]);

  const incomeVsExpenses = useMemo(() => {
    const daily: Record<string, { ingresos: number; egresos: number }> = {};
    filteredData.transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
      if (!daily[date]) daily[date] = { ingresos: 0, egresos: 0 };
      if (t.type === 'ingreso') daily[date].ingresos += t.amount;
      else daily[date].egresos += t.amount;
    });
    return Object.entries(daily).map(([name, values]) => ({ name, ...values }));
  }, [filteredData.transactions]);

  const topParts = useMemo(() => {
    const partSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredData.sales.forEach(sale => {
      sale.items.forEach(item => {
        const part = parts.find(p => p.id === item.partId);
        if (part) {
          if (!partSales[part.id]) {
            partSales[part.id] = { name: part.name, quantity: 0, revenue: 0 };
          }
          partSales[part.id].quantity += item.quantity;
          partSales[part.id].revenue += item.totalPrice;
        }
      });
    });
    return Object.values(partSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredData.sales, parts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="text-slate-500">Análisis y estadísticas del negocio</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ingresos"
          value={formatCurrency(stats.income)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Gastos"
          value={formatCurrency(stats.expenses)}
          icon={TrendingUp}
          color="red"
        />
        <StatCard
          title="Órdenes"
          value={stats.totalOrders.toString()}
          icon={Wrench}
          color="blue"
        />
        <StatCard
          title="Ventas"
          value={stats.totalSales.toString()}
          icon={ShoppingCart}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Órdenes por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {ordersByStatus.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendencia de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topParts.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No hay datos de ventas</p>
              ) : (
                topParts.map((part, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-medium text-orange-600">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{part.name}</p>
                        <p className="text-xs text-slate-500">{part.quantity} unidades</p>
                      </div>
                    </div>
                    <span className="font-medium">{formatCurrency(part.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-slate-500">Utilidad Bruta</p>
              <p className={cn(
                "text-2xl font-bold",
                stats.profit >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(stats.profit)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-slate-500">Ticket Promedio (Taller)</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.avgOrderValue)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-slate-500">Margen de Ganancia</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.income > 0 ? ((stats.profit / stats.income) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string; 
  icon: React.ElementType;
  color: 'green' | 'red' | 'blue' | 'orange';
}) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
