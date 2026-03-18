import { useAuth } from '@/context/AuthContext';
import { useERP } from '@/context/ERPContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, Clock, CheckCircle, ArrowRight,
  User, Bike, Play, Pause
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { WorkOrder } from '@/types';
import { cn } from '@/lib/utils';

export function MecanicoDashboard() {
  const { user } = useAuth();
  const { workOrders, clients, motorcycles, updateWorkOrderStatus } = useERP();
  const [myOrders, setMyOrders] = useState<WorkOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<WorkOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Filtrar órdenes asignadas a este mecánico
    const assigned = workOrders.filter(wo => 
      wo.assignedTo.includes(user.id) && 
      wo.status !== 'entregado' && 
      wo.status !== 'cancelado'
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setMyOrders(assigned);
    setActiveOrders(assigned.filter(wo => wo.status === 'en_progreso' || wo.status === 'asignado'));
    setCompletedOrders(assigned.filter(wo => wo.status === 'completado'));
  }, [workOrders, user]);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Cliente no encontrado';
  };

  const getMotoInfo = (motoId: string) => {
    const moto = motorcycles.find(m => m.id === motoId);
    return moto ? `${moto.brand} ${moto.model} (${moto.plate || 'S/P'})` : 'Moto no encontrada';
  };

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

  const handleStartWork = (orderId: string) => {
    updateWorkOrderStatus(orderId, 'en_progreso');
  };

  const handleCompleteWork = (orderId: string) => {
    updateWorkOrderStatus(orderId, 'completado');
  };

  const handlePauseWork = (orderId: string) => {
    updateWorkOrderStatus(orderId, 'espera_repuestos');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          ¡Hola, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-slate-500">
          {user?.role === 'maestro' ? 'Panel del Maestro Mecánico' : 'Panel de Ayudante'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Mis Trabajos"
          value={myOrders.length.toString()}
          icon={Wrench}
          color="blue"
        />
        <StatCard
          title="En Progreso"
          value={activeOrders.length.toString()}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Completados"
          value={completedOrders.length.toString()}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Active Work */}
      {activeOrders.length > 0 && (
        <Card className="border-orange-200 ring-1 ring-orange-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-orange-500" />
              Trabajos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-white border rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{order.orderNumber}</span>
                        <Badge variant="outline" className={cn("text-xs", getStatusBadge(order.status))}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{order.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {getClientName(order.clientId)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bike className="w-3 h-3" />
                          {getMotoInfo(order.motorcycleId)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'asignado' && (
                        <Button 
                          size="sm" 
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => handleStartWork(order.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Iniciar
                        </Button>
                      )}
                      {order.status === 'en_progreso' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePauseWork(order.id)}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pausar
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleCompleteWork(order.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All My Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Todos Mis Trabajos</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/ordenes'}>
            Ver todas
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {myOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Wrench className="w-12 h-12 mb-3" />
                <p className="text-sm">No tienes trabajos asignados</p>
                <p className="text-xs">Espera a que la secretaria te asigne una orden</p>
              </div>
            ) : (
              myOrders.map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => window.location.hash = `/ordenes/${order.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{order.orderNumber}</span>
                      <Badge variant="outline" className={cn("text-xs", getStatusBadge(order.status))}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{order.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Bike className="w-3 h-3" />
                        {getMotoInfo(order.motorcycleId)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatCurrency(order.laborCost)}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Summary */}
      {completedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Trabajos Completados Recientemente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">{getMotoInfo(order.motorcycleId)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(order.laborCost)}</p>
                    {order.completedAt && (
                      <p className="text-xs text-slate-400">
                        {new Date(order.completedAt).toLocaleDateString('es-PE')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { 
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
