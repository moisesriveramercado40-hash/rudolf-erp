import { useERP } from '@/context/ERPContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, Bike, ClipboardList, Search, Plus, Phone,
  ArrowRight, UserPlus, Wrench
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Client, WorkOrder } from '@/types';
import { cn } from '@/lib/utils';

export function SecretariaDashboard() {
  const { clients, workOrders, stats } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [pendingOrders, setPendingOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    const sortedClients = [...clients]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentClients(sortedClients);
    
    const pending = workOrders
      .filter(wo => wo.status === 'pendiente')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setPendingOrders(pending);
  }, [clients, workOrders]);

  const filteredClients = clients.filter(client => 
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  ).slice(0, 5);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Recepción</h1>
          <p className="text-slate-500">Gestión de clientes y órdenes de trabajo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.hash = '/clientes/nuevo'}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => window.location.hash = '/ordenes/nueva'}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickStatCard
          title="Total Clientes"
          value={clients.length.toString()}
          icon={Users}
          color="blue"
        />
        <QuickStatCard
          title="Órdenes Pendientes"
          value={stats.pendingOrders.toString()}
          icon={ClipboardList}
          color="orange"
        />
        <QuickStatCard
          title="En Progreso"
          value={stats.inProgressOrders.toString()}
          icon={Wrench}
          color="green"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Search */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Buscar Clientes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/clientes'}>
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-2">
              {(searchTerm ? filteredClients : recentClients).length === 0 ? (
                <p className="text-center text-slate-500 py-4">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes recientes'}
                </p>
              ) : (
                (searchTerm ? filteredClients : recentClients).map((client) => (
                  <div 
                    key={client.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => window.location.hash = `/clientes/${client.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client.firstName} {client.lastName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-500" />
              Órdenes sin Asignar
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/ordenes'}>
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <ClipboardList className="w-10 h-10 mb-2" />
                  <p className="text-sm">No hay órdenes pendientes</p>
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => window.location.hash = `/ordenes/${order.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{order.orderNumber}</span>
                      <Badge variant="outline" className={cn("text-xs", getStatusBadge(order.status))}>
                        Pendiente
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{order.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('es-PE')}
                      </span>
                      <span className="text-sm font-medium">{formatCurrency(order.totalCost)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickActionButton
              icon={UserPlus}
              label="Nuevo Cliente"
              onClick={() => window.location.hash = '/clientes/nuevo'}
              color="blue"
            />
            <QuickActionButton
              icon={Bike}
              label="Registrar Moto"
              onClick={() => window.location.hash = '/motos/nueva'}
              color="green"
            />
            <QuickActionButton
              icon={ClipboardList}
              label="Crear Orden"
              onClick={() => window.location.hash = '/ordenes/nueva'}
              color="orange"
            />
            <QuickActionButton
              icon={Users}
              label="Ver Clientes"
              onClick={() => window.location.hash = '/clientes'}
              color="purple"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickStatCard({ title, value, icon: Icon, color }: { 
  title: string; 
  value: string; 
  icon: React.ElementType;
  color: 'blue' | 'orange' | 'green';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
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
            <p className="text-2xl font-bold">{value}</p>
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
  color: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colors = {
    blue: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600',
    green: 'hover:bg-green-50 hover:border-green-200 hover:text-green-600',
    orange: 'hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600',
    purple: 'hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600',
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
