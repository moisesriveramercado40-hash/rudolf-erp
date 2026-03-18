import { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Wallet, Calendar,
  Plus, ArrowUpRight, ArrowDownRight, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  { value: 'compra_inventario', label: 'Compra de Inventario' },
  { value: 'sueldos', label: 'Sueldos y Salarios' },
  { value: 'gastos_operativos', label: 'Gastos Operativos' },
  { value: 'otros', label: 'Otros Gastos' },
];

const INCOME_CATEGORIES = [
  { value: 'venta_repuestos', label: 'Venta de Repuestos' },
  { value: 'servicio_taller', label: 'Servicio de Taller' },
  { value: 'otros', label: 'Otros Ingresos' },
];

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444'];

export function FinanzasPage() {
  const { transactions, addTransaction } = useERP();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'ingreso' | 'egreso'>('egreso');
  
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
  });

  // Filtrar transacciones por rango de fechas
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      switch (dateRange) {
        case 'today':
          return tDate >= startOfDay;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return tDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          return tDate >= monthAgo;
        default:
          return true;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'ingreso')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'egreso')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Datos para gráficos
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const cat = EXPENSE_CATEGORIES.find(c => c.value === t.category)?.label || 
                  INCOME_CATEGORIES.find(c => c.value === t.category)?.label ||
                  t.category;
      categories[cat] = (categories[cat] || 0) + t.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const dailyData = useMemo(() => {
    const daily: Record<string, { ingresos: number; egresos: number }> = {};
    filteredTransactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
      if (!daily[date]) daily[date] = { ingresos: 0, egresos: 0 };
      if (t.type === 'ingreso') daily[date].ingresos += t.amount;
      else daily[date].egresos += t.amount;
    });
    return Object.entries(daily).map(([name, values]) => ({ name, ...values }));
  }, [filteredTransactions]);

  const handleAddTransaction = () => {
    if (!formData.category || formData.amount <= 0) return;
    
    addTransaction({
      type: transactionType,
      category: formData.category as any,
      amount: formData.amount,
      description: formData.description,
      receiptNumber: formData.receiptNumber,
      createdBy: 'admin',
      date: new Date(formData.date),
    });

    setShowAddDialog(false);
    setFormData({
      category: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      receiptNumber: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finanzas</h1>
          <p className="text-slate-500">Control de ingresos y egresos</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="all">Todo</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Ingresos"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Egresos"
          value={formatCurrency(totalExpenses)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Balance"
          value={formatCurrency(balance)}
          icon={Wallet}
          color={balance >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Transacciones</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No hay transacciones en este período
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('es-PE')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            transaction.type === 'ingreso' 
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          )}
                        >
                          {transaction.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {EXPENSE_CATEGORIES.find(c => c.value === transaction.category)?.label ||
                         INCOME_CATEGORIES.find(c => c.value === transaction.category)?.label ||
                         transaction.category}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{transaction.description}</p>
                        {transaction.receiptNumber && (
                          <p className="text-xs text-slate-500">Recibo: {transaction.receiptNumber}</p>
                        )}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {transaction.type === 'ingreso' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Transacción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={transactionType === 'ingreso' ? 'default' : 'outline'}
                onClick={() => setTransactionType('ingreso')}
                className={cn(transactionType === 'ingreso' && 'bg-green-500 hover:bg-green-600')}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Ingreso
              </Button>
              <Button
                type="button"
                variant={transactionType === 'egreso' ? 'default' : 'outline'}
                onClick={() => setTransactionType('egreso')}
                className={cn(transactionType === 'egreso' && 'bg-red-500 hover:bg-red-600')}
              >
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Egreso
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {(transactionType === 'ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto (S/)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción de la transacción"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>N° Recibo (Opcional)</Label>
                <Input 
                  value={formData.receiptNumber}
                  onChange={e => setFormData({...formData, receiptNumber: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button 
              className={cn(
                transactionType === 'ingreso' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              )}
              onClick={handleAddTransaction}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string; 
  icon: React.ElementType;
  color: 'green' | 'red';
}) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
