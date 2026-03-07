import { useState } from 'react';
import { useERP } from '@/context/ERPContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Trash2, CheckCircle2, Clock, Package, 
  Wrench, DollarSign, AlertCircle
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
  const { workOrderTasks, addWorkOrderTask, deleteWorkOrderTask, updateTaskStatus } = useERP();
  const { canAccessModule, user } = useAuth();
  
  // Permisos: Maestro puede editar, Ayudante solo puede ver
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
  });
  
  const handleAddTask = () => {
    if (!newTask.description || !currentUserId) return;
    
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
    });
    
    setNewTask({
      description: '',
      type: 'mano_obra',
      quantity: 1,
      unitPrice: 0,
      notes: '',
    });
    setShowAddForm(false);
  };
  
  const handleStatusChange = (taskId: string, newStatus: WorkOrderTask['status']) => {
    updateTaskStatus(taskId, newStatus);
  };
  
  const totalAmount = tasks.reduce((sum, task) => sum + task.totalPrice, 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };
  
  return (
    <div className="space-y-4">
      {/* Header con total */}
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
                      {/* Número de ítem */}
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                        {task.itemNumber}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Header del ítem */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={typeConfig?.color || ''}>
                                <Icon className="w-3 h-3 mr-1" />
                                {typeConfig?.label}
                              </Badge>
                              <Badge className={statusConfig.color}>
                                {task.status === 'pendiente' && <Clock className="w-3 h-3 mr-1" />}
                                {task.status === 'en_progreso' && <Clock className="w-3 h-3 mr-1" />}
                                {task.status === 'completado' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="font-medium mt-1">{task.description}</p>
                            {task.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>
                            )}
                          </div>
                          
                          {/* Precio */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold">{formatCurrency(task.totalPrice)}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.quantity} x {formatCurrency(task.unitPrice)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Acciones - Solo el Maestro puede editar */}
                        {!readOnly && canEdit && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Cambiar estado:</span>
                            <div className="flex gap-1">
                              {(['pendiente', 'en_progreso', 'completado'] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(task.id, status)}
                                  className={cn(
                                    "px-2 py-1 text-xs rounded border transition-colors",
                                    task.status === status 
                                      ? STATUS_CONFIG[status].color 
                                      : 'hover:bg-muted'
                                  )}
                                >
                                  {STATUS_CONFIG[status].label}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => deleteWorkOrderTask(task.id)}
                              className="ml-auto text-red-500 hover:text-red-700 p-1"
                              title="Eliminar ítem"
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
          {canEdit && (
            <p className="text-sm">Haz clic en "Agregar Item" para comenzar</p>
          )}
        </div>
      )}
      
      {/* Formulario para agregar nuevo ítem - Solo Maestro puede agregar */}
      {canEdit && !readOnly && (
        <>
          {!showAddForm ? (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Item de Trabajo
            </Button>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <h5 className="font-medium">Nuevo Item #{tasks.length + 1}</h5>
                
                {/* Tipo de ítem */}
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {TASK_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, type: type.id })}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded border text-xs transition-colors",
                          newTask.type === type.id 
                            ? 'border-primary bg-primary/10' 
                            : 'hover:bg-muted'
                        )}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Descripción */}
                <div>
                  <Label className="text-xs">Descripción del trabajo *</Label>
                  <Input
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Ej: Cambio de aceite, revisión de frenos..."
                  />
                </div>
                
                {/* Cantidad y Precio */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newTask.quantity}
                      onChange={(e) => setNewTask({ 
                        ...newTask, 
                        quantity: parseInt(e.target.value) || 1 
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Precio Unit.</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={newTask.unitPrice}
                      onChange={(e) => setNewTask({ 
                        ...newTask, 
                        unitPrice: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Total</Label>
                    <Input
                      value={formatCurrency(newTask.quantity * newTask.unitPrice)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                {/* Notas */}
                <div>
                  <Label className="text-xs">Notas (opcional)</Label>
                  <Input
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    placeholder="Detalles adicionales..."
                  />
                </div>
                
                {/* Botones */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleAddTask}
                    disabled={!newTask.description}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Resumen de costos */}
      {tasks.length > 0 && (
        <div className="border-t pt-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mano de Obra:</span>
              <span>{formatCurrency(tasks.filter(t => t.type === 'mano_obra').reduce((s, t) => s + t.totalPrice, 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Repuestos:</span>
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
