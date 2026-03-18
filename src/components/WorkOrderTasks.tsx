import { useState } from 'react';
import { useERP } from '@/context/ERPContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, CheckCircle2, Clock, Package, 
  Wrench, DollarSign, AlertCircle, AlertTriangle, Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkOrderTask } from '@/types';

interface WorkOrderTasksProps {
  workOrderId: string;
  readOnly?: boolean;
  currentUserId?: string;
}

const TASK_TYPES = [
  { id: 'mano_obra', label: 'Mano de Obra', icon: Wrench, color: 'bg-blue-100 text-blue-700' },
  { id: 'repuesto', label: 'Repuesto', icon: Package, color: 'bg-green-100 text-green-700' },
  { id: 'servicio_externo', label: 'Servicio Externo', icon: DollarSign, color: 'bg-purple-100 text-purple-700' },
  { id: 'otro', label: 'Otro', icon: AlertCircle, color: 'bg-slate-100 text-slate-700' },
] as const;

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  en_progreso: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  completado: { label: 'Completado', color: 'bg-green-100 text-green-700 border-green-300' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-300' },
};

export function WorkOrderTasks({ workOrderId, readOnly = false, currentUserId }: WorkOrderTasksProps) {
  const { workOrderTasks, addWorkOrderTask, deleteWorkOrderTask, updateTaskStatus, parts } = useERP();
  const { canAccessModule, user } = useAuth();
  
  const canEdit = canAccessModule('ordenes') && (
    user?.role === 'admin' || 
    user?.role === 'maestro'
  );
  
  const tasks = workOrderTasks
    .filter(t => t.orderId === workOrderId)
    .sort((a, b) => a.itemNumber - b.itemNumber);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    description: '',
    type: 'mano_obra' as WorkOrderTask['type'],
    quantity: 1,
    unitPrice: 0,
    notes: '',
    partId: '',
  });
  
  const availableParts = parts.filter(p => p.isActive);
  
  const handleSelectPart = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (part) {
      setNewTask({
        ...newTask,
        partId,
        description: part.name,
        unitPrice: part.salePrice,
        quantity: 1,
      });
    }
  };
  
  const handleAddTask = () => {
    if (!newTask.description || !currentUserId) return;
    
    if (newTask.type === 'repuesto' && newTask.partId) {
      const part = parts.find(p => p.id === newTask.partId);
      if (part && part.stock < newTask.quantity) {
        alert(`Stock insuficiente. Disponible: ${part.stock} unidades de ${part.name}`);
        return;
      }
    }
    
    addWorkOrderTask({
      orderId: workOrderId,
      description: newTask.description,
      type: newTask.type,
      quantity: newTask.quantity,
      unitPrice: newTask.unitPrice,
      totalPrice: newTask.quantity * newTask.unitPrice,
      addedBy: currentUserId,
      status: 'pendiente',
      notes: newTask.notes,
      partId: newTask.type === 'repuesto' && newTask.partId ? newTask.partId : undefined,
    });
    
    setNewTask({ description: '', type: 'mano_obra', quantity: 1, unitPrice: 0, notes: '', partId: '' });
    setShowAddForm(false);
  };
  
  const totalAmount = tasks.reduce((sum, task) => sum + task.totalPrice, 0);
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const getPartInfo = (partId?: string) => partId ? parts.find(p => p.id === partId) : null;
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Items de Trabajo</h4>
          <p className="text-sm text-muted-foreground">
            {tasks.length} item{tasks.length !== 1 ? 's' : ''} registrado{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
        </div>
      </div>
      
      {/* Lista de tasks */}
      {tasks.length > 0 ? (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {tasks.map((task) => {
              const typeConfig = TASK_TYPES.find(t => t.id === task.type);
              const Icon = typeConfig?.icon || Wrench;
              const statusConfig = STATUS_CONFIG[task.status];
              const linkedPart = getPartInfo(task.partId);
              
              return (
                <Card key={task.id} className={cn(
                  "border-l-4",
                  task.status === 'completado' ? 'border-l-green-500' :
                  task.status === 'en_progreso' ? 'border-l-blue-500' :
                  task.status === 'cancelado' ? 'border-l-red-500' :
                  'border-l-yellow-500'
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        {task.itemNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={typeConfig?.color || ''}>
                                <Icon className="w-3 h-3 mr-1" />
                                {typeConfig?.label}
                              </Badge>
                              <Badge className={statusConfig.color}>
                                {(task.status === 'pendiente' || task.status === 'en_progreso') && <Clock className="w-3 h-3 mr-1" />}
                                {task.status === 'completado' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {statusConfig.label}
                              </Badge>
                              {task.partId && task.stockDeducted && (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                                  <Link2 className="w-3 h-3" />
                                  Stock descontado
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium mt-1">{task.description}</p>
                            {linkedPart && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                SKU: {linkedPart.sku} — Stock actual: {linkedPart.stock} unid.
                              </p>
                            )}
                            {task.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold">{formatCurrency(task.totalPrice)}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.quantity} x {formatCurrency(task.unitPrice)}
                            </p>
                          </div>
                        </div>
                        
                        {!readOnly && canEdit && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Estado:</span>
                            <div className="flex gap-1">
                              {(['pendiente', 'en_progreso', 'completado'] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateTaskStatus(task.id, status)}
                                  className={cn(
                                    "px-2 py-1 text-xs rounded border transition-colors",
                                    task.status === status ? STATUS_CONFIG[status].color : 'hover:bg-muted'
                                  )}
                                >
                                  {STATUS_CONFIG[status].label}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => deleteWorkOrderTask(task.id)}
                              className="ml-auto text-red-500 hover:text-red-700 p-1"
                              title={task.stockDeducted ? 'Eliminar (el stock se devolverá)' : 'Eliminar ítem'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No hay items de trabajo registrados</p>
          {canEdit && <p className="text-sm">Haz clic en "Agregar Item" para comenzar</p>}
        </div>
      )}
      
      {/* Formulario para agregar */}
      {canEdit && !readOnly && (
        <>
          {!showAddForm ? (
            <Button variant="outline" className="w-full" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Item de Trabajo
            </Button>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <h5 className="font-medium">Nuevo Item #{tasks.length + 1}</h5>
                
                {/* Tipo */}
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {TASK_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, type: type.id, partId: '', description: type.id !== newTask.type ? '' : newTask.description })}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded border text-xs transition-colors",
                          newTask.type === type.id ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                        )}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* SELECTOR DE REPUESTO DEL INVENTARIO */}
                {newTask.type === 'repuesto' && (
                  <div className="space-y-2 p-3 bg-green-50/50 border border-green-200 rounded-lg">
                    <Label className="text-xs flex items-center gap-1 text-green-700">
                      <Package className="w-3.5 h-3.5" />
                      Seleccionar del Inventario (se descontará stock)
                    </Label>
                    <Select value={newTask.partId || 'none'} onValueChange={(v) => v === 'none' ? setNewTask({...newTask, partId: ''}) : handleSelectPart(v)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Buscar repuesto en inventario..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="none">— Escribir manualmente (sin descontar stock) —</SelectItem>
                        {availableParts.map(part => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.name} ({part.sku}) — Stock: {part.stock} — S/ {part.salePrice.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Alerta de stock */}
                    {newTask.partId && (() => {
                      const part = parts.find(p => p.id === newTask.partId);
                      if (!part) return null;
                      if (part.stock < newTask.quantity) {
                        return (
                          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>Stock insuficiente. Disponible: <strong>{part.stock}</strong> — Solicitado: <strong>{newTask.quantity}</strong></span>
                          </div>
                        );
                      }
                      if (part.stock <= part.minStock) {
                        return (
                          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>Stock bajo. Quedan <strong>{part.stock}</strong> unidades (mínimo: {part.minStock})</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>Disponible: <strong>{part.stock}</strong> unidades — Se descontarán <strong>{newTask.quantity}</strong></span>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* Descripción */}
                <div>
                  <Label className="text-xs">Descripción *</Label>
                  <Input
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder={newTask.type === 'repuesto' ? "Nombre del repuesto o selecciona arriba" : "Ej: Cambio de aceite, revisión de frenos..."}
                  />
                </div>
                
                {/* Cantidad y Precio */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Cantidad</Label>
                    <Input type="number" min={1} value={newTask.quantity}
                      onChange={(e) => setNewTask({ ...newTask, quantity: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <Label className="text-xs">Precio Unit.</Label>
                    <Input type="number" min={0} step={0.01} value={newTask.unitPrice}
                      onChange={(e) => setNewTask({ ...newTask, unitPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label className="text-xs">Total</Label>
                    <Input value={formatCurrency(newTask.quantity * newTask.unitPrice)} disabled className="bg-muted" />
                  </div>
                </div>
                
                {/* Notas */}
                <div>
                  <Label className="text-xs">Notas (opcional)</Label>
                  <Input value={newTask.notes} onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })} placeholder="Detalles adicionales..." />
                </div>
                
                {/* Botones */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowAddForm(false); setNewTask({...newTask, partId: ''}); }}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleAddTask}
                    disabled={!newTask.description || (newTask.type === 'repuesto' && newTask.partId ? (parts.find(p => p.id === newTask.partId)?.stock || 0) < newTask.quantity : false)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar{newTask.type === 'repuesto' && newTask.partId ? ' y descontar stock' : ''}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Resumen */}
      {tasks.length > 0 && (
        <div className="border-t pt-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mano de Obra:</span>
              <span>{formatCurrency(tasks.filter(t => t.type === 'mano_obra').reduce((s, t) => s + t.totalPrice, 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                Repuestos:
                {tasks.some(t => t.type === 'repuesto' && t.stockDeducted) && <Link2 className="w-3 h-3 text-green-600" />}
              </span>
              <span>{formatCurrency(tasks.filter(t => t.type === 'repuesto').reduce((s, t) => s + t.totalPrice, 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Servicios Externos:</span>
              <span>{formatCurrency(tasks.filter(t => t.type === 'servicio_externo').reduce((s, t) => s + t.totalPrice, 0))}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkOrderTasks;
