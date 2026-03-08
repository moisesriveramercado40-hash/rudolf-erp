import { useState } from 'react';
import { useERP } from '@/context/ERPContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, Plus, Eye, Trash2, 
  Play, CheckCircle, UserCheck, Camera, Wrench, Package, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MotorcycleInspectionForm } from '@/components/MotorcycleInspection';
import { WorkOrderTasks } from '@/components/WorkOrderTasks';
import { AuditLog } from '@/components/AuditLog';
import type { WorkOrder, WorkOrderStatus, WorkType, Priority } from '@/types';

const WORK_TYPES: { value: WorkType; label: string }[] = [
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'reparacion', label: 'Reparación' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'modificacion', label: 'Modificación' },
  { value: 'garantia_bajaj', label: 'Garantía Bajaj' },
  { value: 'garantia_particular', label: 'Garantía Particulares' },
];

// Servicios predeterminados de mano de obra
const PREDEFINED_LABOR_SERVICES: { value: string; label: string; price: number }[] = [
  { value: 'cambio_aceite', label: 'Cambio de aceite', price: 35.00 },
  { value: 'cambio_aceite_filtro', label: 'Cambio de aceite y filtro', price: 50.00 },
  { value: 'ajuste_frenos', label: 'Ajuste de frenos', price: 25.00 },
  { value: 'cambio_pastillas_freno', label: 'Cambio de pastillas de freno', price: 40.00 },
  { value: 'cambio_bujia', label: 'Cambio de bujía', price: 20.00 },
  { value: 'limpieza_carburador', label: 'Limpieza de carburador', price: 60.00 },
  { value: 'sincronizacion_carburador', label: 'Sincronización de carburador', price: 80.00 },
  { value: 'cambio_cadena', label: 'Cambio de cadena', price: 45.00 },
  { value: 'ajuste_cadena', label: 'Ajuste de cadena', price: 15.00 },
  { value: 'cambio_bateria', label: 'Cambio de batería', price: 30.00 },
  { value: 'cambio_llanta_delantera', label: 'Cambio de llanta delantera', price: 35.00 },
  { value: 'cambio_llanta_trasera', label: 'Cambio de llanta trasera', price: 45.00 },
  { value: 'balanceo_llantas', label: 'Balanceo de llantas', price: 25.00 },
  { value: 'alineacion_direccion', label: 'Alineación de dirección', price: 40.00 },
  { value: 'cambio_amortiguador', label: 'Cambio de amortiguador', price: 70.00 },
  { value: 'revision_general', label: 'Revisión general', price: 50.00 },
  { value: 'diagnostico_completo', label: 'Diagnóstico completo', price: 40.00 },
  { value: 'cambio_rodamientos', label: 'Cambio de rodamientos', price: 55.00 },
  { value: 'cambio_retenes', label: 'Cambio de retenes', price: 65.00 },
  { value: 'pintura_general', label: 'Pintura general', price: 350.00 },
  { value: 'pulido_faros', label: 'Pulido de faros', price: 40.00 },
  { value: 'instalacion_alarmas', label: 'Instalación de alarmas', price: 80.00 },
  { value: 'instalacion_gps', label: 'Instalación de GPS', price: 60.00 },
  { value: 'otro', label: 'Otro servicio (personalizado)', price: 0.00 },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

const STATUSES: { value: WorkOrderStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'asignado', label: 'Asignado' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'espera_repuestos', label: 'Espera Repuestos' },
  { value: 'calidad', label: 'Control Calidad' },
  { value: 'completado', label: 'Completado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

// Usuarios mock para asignación
const MOCK_USERS = [
  { id: '3', name: 'Carlos Rodríguez', role: 'maestro' },
  { id: '4', name: 'Juan Pérez', role: 'maestro' },
  { id: '5', name: 'Pedro Sánchez', role: 'ayudante' },
  { id: '6', name: 'Luis Torres', role: 'ayudante' },
  { id: '7', name: 'Diego Ramírez', role: 'ayudante' },
  { id: '8', name: 'Andrés Castro', role: 'ayudante' },
];

export function OrdenesPage() {
  const { workOrders, clients, motorcycles, addWorkOrder, updateWorkOrder, updateWorkOrderStatus, deleteWorkOrder, updateMotorcycle, addWorkOrderTask, getInspectionByWorkOrder } = useERP();
  const { user, canAccessModule } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [addStep, setAddStep] = useState<'order' | 'inspection'>('order');
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [currentMileage, setCurrentMileage] = useState(0);
  
  const [formData, setFormData] = useState({
    clientId: '',
    motorcycleId: '',
    workType: 'reparacion' as WorkType,
    description: '',
    priority: 'media' as Priority,
    laborCost: 0,
    partsCost: 0,
    assignedTo: [] as string[],
  });
  
  // Items de trabajo para la nueva orden - Mano de Obra
  const [laborItems, setLaborItems] = useState<Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>([]);
  const [newLaborItem, setNewLaborItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
  });
  
  // Items de trabajo para la nueva orden - Repuestos
  const [partsItems, setPartsItems] = useState<Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>([]);
  const [newPartsItem, setNewPartsItem] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
  });

  const canEdit = canAccessModule('ordenes') && (user?.role === 'admin' || user?.role === 'secretaria');
  const isMechanic = user?.role === 'maestro' || user?.role === 'ayudante';

  // Filtrar órdenes
  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(order.clientId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Mecánicos solo ven sus órdenes asignadas
    if (isMechanic) {
      return matchesSearch && matchesStatus && order.assignedTo.includes(user?.id || '');
    }
    
    return matchesSearch && matchesStatus;
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Cliente no encontrado';
  };

  const getMotoInfo = (motoId: string) => {
    const moto = motorcycles.find(m => m.id === motoId);
    return moto ? `${moto.brand} ${moto.model}` : 'Moto no encontrada';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
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

  const handleAdd = async () => {
    if (!user) return;
    
    // Obtener el kilometraje actual de la moto
    const moto = motorcycles.find(m => m.id === formData.motorcycleId);
    setCurrentMileage(moto?.mileage || 0);
    
    // Calcular costos totales
    const laborTotal = laborItems.reduce((sum, item) => sum + item.total, 0);
    const partsTotal = partsItems.reduce((sum, item) => sum + item.total, 0);
    const finalLaborCost = laborTotal > 0 ? laborTotal : formData.laborCost;
    const finalPartsCost = partsTotal > 0 ? partsTotal : formData.partsCost;
    
    const orderId = await addWorkOrder({
      ...formData,
      diagnosis: '',
      status: 'pendiente',
      assignedTo: [],
      assignedBy: '',
      laborCost: finalLaborCost,
      partsCost: finalPartsCost,
      totalCost: finalLaborCost + finalPartsCost,
      createdBy: user.id,
    });
    
    // Agregar los items de mano de obra
    for (const item of laborItems) {
      await addWorkOrderTask({
        orderId,
        description: item.description,
        type: 'mano_obra',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.total,
        addedBy: user.id,
        status: 'pendiente',
        notes: '',
      });
    }
    
    // Agregar los items de repuestos
    for (const item of partsItems) {
      await addWorkOrderTask({
        orderId,
        description: item.description,
        type: 'repuesto',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.total,
        addedBy: user.id,
        status: 'pendiente',
        notes: '',
      });
    }
    
    setNewOrderId(orderId);
    setAddStep('inspection');
  };
  
  // Handlers para Mano de Obra
  const handleAddLaborItem = () => {
    if (!newLaborItem.description) return;
    
    const item = {
      id: `labor_${Date.now()}`,
      description: newLaborItem.description,
      quantity: newLaborItem.quantity,
      unitPrice: newLaborItem.unitPrice,
      total: newLaborItem.quantity * newLaborItem.unitPrice,
    };
    
    setLaborItems([...laborItems, item]);
    setNewLaborItem({ description: '', quantity: 1, unitPrice: 0 });
  };
  
  const handleRemoveLaborItem = (id: string) => {
    setLaborItems(laborItems.filter(item => item.id !== id));
  };
  
  // Handlers para Repuestos
  const handleAddPartsItem = () => {
    if (!newPartsItem.description) return;
    
    const item = {
      id: `parts_${Date.now()}`,
      description: newPartsItem.description,
      quantity: newPartsItem.quantity,
      unitPrice: newPartsItem.unitPrice,
      total: newPartsItem.quantity * newPartsItem.unitPrice,
    };
    
    setPartsItems([...partsItems, item]);
    setNewPartsItem({ description: '', quantity: 1, unitPrice: 0 });
  };
  
  const handleRemovePartsItem = (id: string) => {
    setPartsItems(partsItems.filter(item => item.id !== id));
  };
  
  const handleInspectionComplete = (_inspectionId: string) => {
    // Actualizar el kilometraje de la moto si cambió
    if (newOrderId && currentMileage > 0) {
      const order = workOrders.find(o => o.id === newOrderId);
      if (order) {
        updateMotorcycle(order.motorcycleId, { mileage: currentMileage });
      }
    }
    
    // Cerrar diálogo y resetear
    setShowAddDialog(false);
    setAddStep('order');
    setNewOrderId(null);
    setFormData({
      clientId: '',
      motorcycleId: '',
      workType: 'reparacion',
      description: '',
      priority: 'media',
      laborCost: 0,
      partsCost: 0,
      assignedTo: [],
    });
    setLaborItems([]);
    setPartsItems([]);
  };
  
  const handleMileageChange = (mileage: number) => {
    setCurrentMileage(mileage);
  };

  const handleStatusChange = (orderId: string, newStatus: WorkOrderStatus) => {
    updateWorkOrderStatus(orderId, newStatus);
  };

  const handleAssign = () => {
    if (selectedOrder && formData.assignedTo.length > 0) {
      updateWorkOrder(selectedOrder.id, {
        assignedTo: formData.assignedTo,
        assignedBy: user?.id || '',
        assignedAt: new Date(),
        status: 'asignado',
      });
      setShowAssignDialog(false);
    }
  };

  const openAssign = (order: WorkOrder) => {
    setSelectedOrder(order);
    setFormData({ ...formData, assignedTo: order.assignedTo });
    setShowAssignDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Órdenes de Trabajo</h1>
          <p className="text-slate-500">Gestión de trabajos del taller</p>
        </div>
        {canEdit && (
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por número, cliente o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as WorkOrderStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente/Moto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No se encontraron órdenes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString('es-PE')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{getClientName(order.clientId)}</p>
                        <p className="text-xs text-slate-500">{getMotoInfo(order.motorcycleId)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {WORK_TYPES.find(t => t.value === order.workType)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getStatusBadge(order.status))}>
                          {STATUSES.find(s => s.value === order.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.assignedTo.length > 0 ? (
                          <span className="text-sm">
                            {order.assignedTo.map(id => MOCK_USERS.find(u => u.id === id)?.name).join(', ')}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(order.totalCost)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setShowViewDialog(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {canEdit && order.status === 'pendiente' && (
                            <Button variant="ghost" size="icon" onClick={() => openAssign(order)}>
                              <UserCheck className="w-4 h-4 text-blue-500" />
                            </Button>
                          )}
                          
                          {isMechanic && order.status === 'asignado' && order.assignedTo.includes(user?.id || '') && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleStatusChange(order.id, 'en_progreso')}
                            >
                              <Play className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          
                          {isMechanic && order.status === 'en_progreso' && order.assignedTo.includes(user?.id || '') && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleStatusChange(order.id, 'completado')}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          
                          {canEdit && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar orden de trabajo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente la orden {order.orderNumber}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteWorkOrder(order.id)} className="bg-red-600 hover:bg-red-700">
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) {
          setAddStep('order');
          setNewOrderId(null);
          setLaborItems([]);
          setPartsItems([]);
          setFormData({
            clientId: '',
            motorcycleId: '',
            workType: 'reparacion',
            description: '',
            priority: 'media',
            laborCost: 0,
            partsCost: 0,
            assignedTo: [],
          });
        }
        setShowAddDialog(open);
      }}>
        <DialogContent className={addStep === 'inspection' ? 'max-w-2xl max-h-[90vh] overflow-hidden' : 'max-w-lg'}>
          <DialogHeader>
            <DialogTitle>
              {addStep === 'order' ? 'Nueva Orden de Trabajo' : 'Pre-inspección de la Moto'}
            </DialogTitle>
            {addStep === 'inspection' && (
              <DialogDescription>
                Documenta el estado actual de la motocicleta antes de iniciar el trabajo
              </DialogDescription>
            )}
          </DialogHeader>
          
          {addStep === 'order' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={formData.clientId} onValueChange={(v) => setFormData({...formData, clientId: v, motorcycleId: ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Moto</Label>
                <Select 
                  value={formData.motorcycleId} 
                  onValueChange={(v) => setFormData({...formData, motorcycleId: v})}
                  disabled={!formData.clientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moto" />
                  </SelectTrigger>
                  <SelectContent>
                    {motorcycles
                      .filter(m => m.clientId === formData.clientId)
                      .map(moto => (
                        <SelectItem key={moto.id} value={moto.id}>
                          {moto.brand} {moto.model} ({moto.plate || 'S/P'}) - {moto.mileage.toLocaleString()} km
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Trabajo</Label>
                  <Select value={formData.workType} onValueChange={(v) => setFormData({...formData, workType: v as WorkType})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v as Priority})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Descripción General del Trabajo</Label>
                <Textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe el trabajo a realizar..."
                  rows={2}
                />
              </div>
              
              {/* Sección de Mano de Obra */}
              <div className="space-y-3 border rounded-lg p-3 bg-blue-50/50 border-blue-200">
                <Label className="flex items-center gap-2 text-blue-700">
                  <Wrench className="w-4 h-4" />
                  Mano de Obra
                </Label>
                
                {/* Lista de items de mano de obra */}
                {laborItems.length > 0 && (
                  <div className="space-y-2">
                    {laborItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x S/ {item.unitPrice.toFixed(2)} = S/ {item.total.toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLaborItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Formulario para agregar mano de obra */}
                <div className="space-y-2">
                  {/* Select de servicios predeterminados */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Seleccionar servicio predeterminado (opcional)</Label>
                    <Select 
                      onValueChange={(value) => {
                        const service = PREDEFINED_LABOR_SERVICES.find(s => s.value === value);
                        if (service) {
                          setNewLaborItem({
                            ...newLaborItem,
                            description: service.label,
                            unitPrice: service.price
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar servicio..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {PREDEFINED_LABOR_SERVICES.map(service => (
                          <SelectItem key={service.value} value={service.value}>
                            {service.label} - S/ {service.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Input
                    value={newLaborItem.description}
                    onChange={e => setNewLaborItem({...newLaborItem, description: e.target.value})}
                    placeholder="Descripción del trabajo (ej: Cambio de aceite, revisión de frenos...)"
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <div className="w-24">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newLaborItem.quantity}
                        onChange={e => setNewLaborItem({...newLaborItem, quantity: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-xs">Precio Unit. (S/)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={newLaborItem.unitPrice}
                        onChange={e => setNewLaborItem({...newLaborItem, unitPrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Total</Label>
                      <Input
                        value={`S/ ${(newLaborItem.quantity * newLaborItem.unitPrice).toFixed(2)}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddLaborItem}
                        disabled={!newLaborItem.description}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Total de mano de obra */}
                {laborItems.length > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-sm text-muted-foreground">
                      {laborItems.length} item{laborItems.length !== 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-blue-700">
                      Total MO: S/ {laborItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Sección de Repuestos */}
              <div className="space-y-3 border rounded-lg p-3 bg-green-50/50 border-green-200">
                <Label className="flex items-center gap-2 text-green-700">
                  <Package className="w-4 h-4" />
                  Repuestos
                </Label>
                
                {/* Lista de repuestos */}
                {partsItems.length > 0 && (
                  <div className="space-y-2">
                    {partsItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x S/ {item.unitPrice.toFixed(2)} = S/ {item.total.toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePartsItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Formulario para agregar repuesto */}
                <div className="space-y-2">
                  <Input
                    value={newPartsItem.description}
                    onChange={e => setNewPartsItem({...newPartsItem, description: e.target.value})}
                    placeholder="Descripción del repuesto (ej: Aceite 20W50, Filtro de aire...)"
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <div className="w-24">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newPartsItem.quantity}
                        onChange={e => setNewPartsItem({...newPartsItem, quantity: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-xs">Precio Unit. (S/)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={newPartsItem.unitPrice}
                        onChange={e => setNewPartsItem({...newPartsItem, unitPrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Total</Label>
                      <Input
                        value={`S/ ${(newPartsItem.quantity * newPartsItem.unitPrice).toFixed(2)}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddPartsItem}
                        disabled={!newPartsItem.description}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Total de repuestos */}
                {partsItems.length > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-green-200">
                    <span className="text-sm text-muted-foreground">
                      {partsItems.length} item{partsItems.length !== 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-green-700">
                      Total Rep: S/ {partsItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Total General */}
              {(laborItems.length > 0 || partsItems.length > 0) && (
                <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <span className="font-medium text-orange-700">Total General:</span>
                  <span className="font-bold text-xl text-orange-700">
                    S/ {(laborItems.reduce((sum, item) => sum + item.total, 0) + partsItems.reduce((sum, item) => sum + item.total, 0)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            newOrderId && formData.motorcycleId && (
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <MotorcycleInspectionForm
                  motorcycleId={formData.motorcycleId}
                  workOrderId={newOrderId}
                  initialMileage={currentMileage}
                  inspectedBy={user?.id || ''}
                  onInspectionComplete={handleInspectionComplete}
                  onMileageChange={handleMileageChange}
                />
              </div>
            )
          )}
          
          {addStep === 'order' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
              <Button 
                className="bg-orange-500 hover:bg-orange-600" 
                onClick={handleAdd}
                disabled={!formData.clientId || !formData.motorcycleId || !formData.description}
              >
                Continuar a Inspección
                <Camera className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detalle de Orden</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Información General</TabsTrigger>
                <TabsTrigger value="tasks">Items de Trabajo</TabsTrigger>
                <TabsTrigger value="inspection">Inspección</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{selectedOrder.orderNumber}</h3>
                  <Badge variant="outline" className={cn(getStatusBadge(selectedOrder.status))}>
                    {STATUSES.find(s => s.value === selectedOrder.status)?.label}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Cliente</p>
                    <p className="font-medium">{getClientName(selectedOrder.clientId)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Moto</p>
                    <p className="font-medium">{getMotoInfo(selectedOrder.motorcycleId)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Tipo</p>
                    <p className="font-medium">
                      {WORK_TYPES.find(t => t.value === selectedOrder.workType)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Prioridad</p>
                    <p className="font-medium capitalize">{selectedOrder.priority}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-500 text-sm">Descripción</p>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg mt-1">{selectedOrder.description}</p>
                </div>
                
                {selectedOrder.diagnosis && (
                  <div>
                    <p className="text-slate-500 text-sm">Diagnóstico</p>
                    <p className="text-sm bg-slate-50 p-3 rounded-lg mt-1">{selectedOrder.diagnosis}</p>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Mano de Obra</span>
                    <span>{formatCurrency(selectedOrder.laborCost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Repuestos</span>
                    <span>{formatCurrency(selectedOrder.partsCost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold mt-2">
                    <span>Total</span>
                    <span className="text-orange-600">{formatCurrency(selectedOrder.totalCost)}</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tasks" className="max-h-[60vh] overflow-y-auto pr-2">
                <WorkOrderTasks workOrderId={selectedOrder.id} currentUserId={user?.id} />
              </TabsContent>
              
              <TabsContent value="inspection" className="max-h-[60vh] overflow-y-auto pr-2">
                {selectedOrder && (() => {
                  const inspection = getInspectionByWorkOrder(selectedOrder.id);
                  if (!inspection) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No hay inspección registrada para esta orden</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {/* Fotos de la inspección */}
                      {inspection.photos && inspection.photos.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Fotos de la Inspección ({inspection.photos.length})</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {inspection.photos.map((photo, index) => (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                <img 
                                  src={photo} 
                                  alt={`Foto ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onClick={() => window.open(photo, '_blank')}
                                  style={{ cursor: 'pointer' }}
                                />
                                <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                  {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Daños registrados */}
                      {inspection.damages && inspection.damages.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Daños Registrados ({inspection.damages.length})</Label>
                          <div className="space-y-2">
                            {inspection.damages.map((damage, index) => (
                              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium capitalize">{damage.type}</span>
                                  <span className="text-muted-foreground">-</span>
                                  <span>{damage.location}</span>
                                </div>
                                {damage.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{damage.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Condición general */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Condición General</Label>
                        <Badge className={
                          inspection.generalCondition === 'excelente' ? 'bg-green-100 text-green-700' :
                          inspection.generalCondition === 'bueno' ? 'bg-blue-100 text-blue-700' :
                          inspection.generalCondition === 'regular' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {inspection.generalCondition.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {/* Kilometraje */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Kilometraje al momento de la inspección</Label>
                        <p className="text-sm">{inspection.mileageAtInspection.toLocaleString()} km</p>
                      </div>
                      
                      {/* Observaciones */}
                      {inspection.notes && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Observaciones</Label>
                          <p className="text-sm bg-muted p-3 rounded">{inspection.notes}</p>
                        </div>
                      )}
                      
                      {/* Firma del cliente */}
                      {inspection.clientSignature && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Firma del Cliente</Label>
                          <div className="border rounded-lg p-2 bg-white">
                            <img 
                              src={inspection.clientSignature} 
                              alt="Firma del cliente"
                              className="max-h-32 mx-auto"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </TabsContent>
              
              <TabsContent value="history" className="max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Historial de Actividades
                  </h3>
                  <AuditLog auditLog={selectedOrder.auditLog} />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Mecánicos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mecánicos Disponibles</Label>
              <div className="space-y-2 max-h-48 overflow-auto">
                {MOCK_USERS.map(mechanic => (
                  <label 
                    key={mechanic.id} 
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedTo.includes(mechanic.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, assignedTo: [...formData.assignedTo, mechanic.id]});
                        } else {
                          setFormData({...formData, assignedTo: formData.assignedTo.filter(id => id !== mechanic.id)});
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{mechanic.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{mechanic.role}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancelar</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleAssign}>
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
