import { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, AlertCircle, CheckCircle2, Wrench, 
  Package, User, Phone, Calendar,
  MessageSquare, ExternalLink, ChevronLeft, ChevronRight, MoreHorizontal, Trash2,
  MessageCircle, Users
} from 'lucide-react';
import type { WorkOrder, WorkOrderStatus, User as UserType } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Columnas del tablero Kanban
const BOARD_COLUMNS: { id: WorkOrderStatus; label: string; color: string; icon: React.ElementType }[] = [
  { id: 'pendiente', label: 'Pendiente', color: 'bg-slate-500', icon: Clock },
  { id: 'asignado', label: 'Asignado', color: 'bg-blue-500', icon: User },
  { id: 'en_progreso', label: 'En Progreso', color: 'bg-amber-500', icon: Wrench },
  { id: 'espera_repuestos', label: 'Espera Repuestos', color: 'bg-orange-500', icon: Package },
  { id: 'calidad', label: 'Control Calidad', color: 'bg-purple-500', icon: CheckCircle2 },
  { id: 'completado', label: 'Completado', color: 'bg-green-500', icon: CheckCircle2 },
  { id: 'entregado', label: 'Entregado', color: 'bg-emerald-600', icon: CheckCircle2 },
];

// Prioridad colores
const PRIORITY_COLORS = {
  baja: 'bg-slate-200 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700 border-red-300',
};

// Obtener estados anterior y siguiente
function getAdjacentStatuses(currentStatus: WorkOrderStatus): { prev: WorkOrderStatus | null; next: WorkOrderStatus | null } {
  const statusFlow: WorkOrderStatus[] = ['pendiente', 'asignado', 'en_progreso', 'espera_repuestos', 'calidad', 'completado', 'entregado'];
  const currentIndex = statusFlow.indexOf(currentStatus);
  
  return {
    prev: currentIndex > 0 ? statusFlow[currentIndex - 1] : null,
    next: currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null,
  };
}

// Función para generar mensaje de WhatsApp
function generateWhatsAppMessage(order: WorkOrder, client: any, motorcycle: any): string {
  const total = order.totalCost.toFixed(2);
  const labor = order.laborCost.toFixed(2);
  const parts = order.partsCost.toFixed(2);
  
  const message = `¡Hola ${client?.firstName || 'Cliente'}! 👋

*RUDOLF Taller de Motos*

Tu moto está lista para recoger ✅

📋 *Orden:* ${order.orderNumber}
🏍️ *Moto:* ${motorcycle?.brand || ''} ${motorcycle?.model || ''} ${motorcycle?.plate ? `(${motorcycle.plate})` : ''}

💰 *Resumen de costos:*
• Mano de Obra: S/ ${labor}
• Repuestos: S/ ${parts}
━━━━━━━━━━━━━━━
• *Total a pagar: S/ ${total}*

📍 Puedes pasar a recoger tu moto en nuestro taller.

¡Gracias por confiar en RUDOLF! 🏍️`;

  return encodeURIComponent(message);
}

// Modal para asignar mecánicos
function AssignMechanicModal({
  isOpen,
  onClose,
  onAssign,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (mechanicIds: string[]) => void;
  order: WorkOrder | null;
}) {
  const { users } = useAuth();
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>([]);
  
  // Obtener mecánicos y ayudantes
  const mechanics = users.filter(u => u.role === 'maestro' && u.isActive);
  const assistants = users.filter(u => u.role === 'ayudante' && u.isActive);
  
  const handleToggleMechanic = (id: string) => {
    setSelectedMechanics(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };
  
  const handleAssign = () => {
    if (selectedMechanics.length > 0) {
      onAssign(selectedMechanics);
      setSelectedMechanics([]);
    }
  };
  
  const hasMechanic = selectedMechanics.some(id => 
    mechanics.some(m => m.id === id)
  );
  
  if (!order) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Asignar Mecánicos
          </DialogTitle>
          <DialogDescription>
            Selecciona al menos un mecánico para la orden {order.orderNumber}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Mecánicos (obligatorio al menos uno) */}
          <div>
            <p className="text-sm font-medium mb-2">Mecánicos *</p>
            <div className="space-y-2">
              {mechanics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay mecánicos registrados</p>
              ) : (
                mechanics.map(mechanic => (
                  <div key={mechanic.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`mech-${mechanic.id}`}
                      checked={selectedMechanics.includes(mechanic.id)}
                      onCheckedChange={() => handleToggleMechanic(mechanic.id)}
                    />
                    <Label htmlFor={`mech-${mechanic.id}`} className="cursor-pointer">
                      {mechanic.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Ayudantes (opcional) */}
          {assistants.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Ayudantes (opcional)</p>
              <div className="space-y-2">
                {assistants.map(assistant => (
                  <div key={assistant.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`assist-${assistant.id}`}
                      checked={selectedMechanics.includes(assistant.id)}
                      onCheckedChange={() => handleToggleMechanic(assistant.id)}
                    />
                    <Label htmlFor={`assist-${assistant.id}`} className="cursor-pointer">
                      {assistant.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!hasMechanic && selectedMechanics.length > 0 && (
            <p className="text-xs text-amber-600">
              ⚠️ Debes seleccionar al menos un mecánico (no solo ayudantes)
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleAssign}
            disabled={!hasMechanic}
          >
            Asignar y Cambiar Estado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Tarjeta de orden de trabajo
function WorkOrderCard({ 
  order, 
  onClick,
  onRequestAssign,
}: { 
  order: WorkOrder; 
  onClick: (order: WorkOrder) => void;
  onRequestAssign: (order: WorkOrder, newStatus: WorkOrderStatus) => void;
}) {
  const { clients, getMotorcyclesByClient, updateWorkOrderStatus, deleteWorkOrder } = useERP();
  const { users, user: currentUser } = useAuth();
  
  const client = clients.find(c => c.id === order.clientId);
  const motorcycle = getMotorcyclesByClient(order.clientId).find(m => m.id === order.motorcycleId);
  
  // Calcular tiempo en el taller
  const daysInShop = Math.floor((Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Mecánicos asignados
  const assignedMechanics = order.assignedTo.map(id => users.find((u: UserType) => u.id === id)).filter(Boolean);
  
  // Verificar si tiene servicios de terceros pendientes
  const { thirdPartyServices } = useERP();
  const pendingThirdParty = thirdPartyServices.filter(
    s => s.workOrderId === order.id && 
    ['pendiente_envio', 'enviado', 'en_proceso'].includes(s.status)
  );
  
  const { prev, next } = getAdjacentStatuses(order.status);
  const currentColumn = BOARD_COLUMNS.find(c => c.id === order.status);
  
  // Verificar si el usuario puede pasar de calidad a completado
  const canCompleteOrder = () => {
    const allowedRoles = ['admin', 'maestro'];
    return currentUser && allowedRoles.includes(currentUser.role);
  };
  
  const handleStatusChange = (e: React.MouseEvent, newStatus: WorkOrderStatus) => {
    e.stopPropagation();
    // Si es cambio de pendiente a asignado, requerir asignación de mecánico
    if (order.status === 'pendiente' && newStatus === 'asignado') {
      onRequestAssign(order, newStatus);
    } 
    // Si es cambio de calidad a completado, verificar permisos
    else if (order.status === 'calidad' && newStatus === 'completado') {
      if (!canCompleteOrder()) {
        alert('Solo el administrador o el maestro pueden completar una orden.');
        return;
      }
      updateWorkOrderStatus(order.id, newStatus);
    }
    else {
      updateWorkOrderStatus(order.id, newStatus);
    }
  };
  
  // Generar enlace de WhatsApp
  const whatsappLink = client?.phone 
    ? `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${generateWhatsAppMessage(order, client, motorcycle)}`
    : null;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 hover:scale-[1.02]"
      style={{ borderLeftColor: order.priority === 'urgente' ? '#ef4444' : order.priority === 'alta' ? '#f97316' : '#3b82f6' }}
      onClick={() => onClick(order)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-sm">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{daysInShop}d en taller</p>
          </div>
          <Badge className={PRIORITY_COLORS[order.priority]} variant="secondary">
            {order.priority}
          </Badge>
        </div>
        
        <div className="space-y-1 mb-2">
          <p className="text-sm font-medium truncate">{client?.firstName} {client?.lastName}</p>
          <p className="text-xs text-muted-foreground">
            {motorcycle?.brand} {motorcycle?.model} - {motorcycle?.plate}
          </p>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {order.description}
        </p>
        
        {/* Controles de cambio de estado */}
        <div className="flex items-center justify-between gap-1 mb-2 pt-2 border-t">
          <div className="flex items-center gap-1">
            {prev && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-1 text-xs"
                onClick={(e) => handleStatusChange(e, prev!)}
                title={`Mover a: ${BOARD_COLUMNS.find(c => c.id === prev)?.label}`}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
            )}
            <Badge 
              variant="outline" 
              className="text-[10px] h-6"
              style={{ borderColor: currentColumn?.color.replace('bg-', '') }}
            >
              {currentColumn?.label}
            </Badge>
            {next && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-1 text-xs"
                onClick={(e) => handleStatusChange(e, next!)}
                title={`Mover a: ${BOARD_COLUMNS.find(c => c.id === next)?.label}`}
                disabled={order.status === 'calidad' && next === 'completado' && currentUser?.role === 'ayudante'}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          {/* Menú de cambio de estado directo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <p className="text-xs text-muted-foreground px-2 py-1">Cambiar estado a:</p>
              {BOARD_COLUMNS.filter(col => col.id !== order.status).filter(col => {
                // Si es ayudante y la orden está en calidad, no mostrar opción de completado
                if (order.status === 'calidad' && col.id === 'completado' && currentUser?.role === 'ayudante') {
                  return false;
                }
                return true;
              }).map(col => (
                <DropdownMenuItem 
                  key={col.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Si es cambio de pendiente a asignado, requerir asignación de mecánico
                    if (order.status === 'pendiente' && col.id === 'asignado') {
                      onRequestAssign(order, col.id);
                    } 
                    // Si es cambio de calidad a completado, verificar permisos
                    else if (order.status === 'calidad' && col.id === 'completado') {
                      if (!canCompleteOrder()) {
                        alert('Solo el administrador o el maestro pueden completar una orden.');
                        return;
                      }
                      updateWorkOrderStatus(order.id, col.id);
                    }
                    else {
                      updateWorkOrderStatus(order.id, col.id);
                    }
                  }}
                  className="text-xs"
                >
                  <col.icon className="w-3 h-3 mr-2" />
                  {col.label}
                </DropdownMenuItem>
              ))}
              <div className="border-t my-1" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-red-600 text-xs"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Eliminar orden
                  </DropdownMenuItem>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex -space-x-1">
            {assignedMechanics.slice(0, 3).map((mechanic, i) => (
              <div 
                key={mechanic?.id || i}
                className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] border-2 border-background"
                title={mechanic?.name}
              >
                {mechanic?.name?.charAt(0)}
              </div>
            ))}
            {assignedMechanics.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background">
                +{assignedMechanics.length - 3}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {pendingThirdParty.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">
                <ExternalLink className="w-3 h-3 mr-1" />
                {pendingThirdParty.length} ext.
              </Badge>
            )}
            {order.estimatedCompletion && (
              <span className="text-muted-foreground">
                {order.estimatedCompletion.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        {/* Botón de WhatsApp para órdenes completadas */}
        {order.status === 'completado' && whatsappLink && (
          <div className="mt-3 pt-2 border-t">
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                size="sm" 
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Notificar al cliente por WhatsApp
              </Button>
            </a>
          </div>
        )}
        
        {order.status === 'completado' && !whatsappLink && (
          <div className="mt-3 pt-2 border-t">
            <div className="text-xs text-center text-muted-foreground bg-muted rounded-full py-2">
              <Phone className="w-3 h-3 inline mr-1" />
              Cliente sin número de teléfono
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Modal de detalle de orden
function WorkOrderDetailModal({ 
  order, 
  isOpen, 
  onClose 
}: { 
  order: WorkOrder | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { clients, getMotorcyclesByClient, thirdPartyServices, customerNotifications } = useERP();
  const { users } = useAuth();
  
  if (!order) return null;
  
  const client = clients.find(c => c.id === order.clientId);
  const motorcycle = getMotorcyclesByClient(order.clientId).find(m => m.id === order.motorcycleId);
  const assignedMechanics = order.assignedTo.map(id => users.find((u: UserType) => u.id === id)).filter(Boolean);
  const orderThirdPartyServices = thirdPartyServices.filter(s => s.workOrderId === order.id);
  const orderNotifications = customerNotifications.filter(n => n.workOrderId === order.id);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {order.orderNumber}
            <Badge className={PRIORITY_COLORS[order.priority]}>{order.priority}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-1">
            {/* Cliente y Moto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                <p className="font-medium">{client?.firstName} {client?.lastName}</p>
                <p className="text-sm flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {client?.phone}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Moto</p>
                <p className="font-medium">{motorcycle?.brand} {motorcycle?.model}</p>
                <p className="text-sm text-muted-foreground">Placa: {motorcycle?.plate}</p>
              </div>
            </div>
            
            {/* Descripción */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Trabajo Solicitado</p>
              <p className="text-sm bg-muted p-3 rounded-md">{order.description}</p>
            </div>
            
            {/* Diagnóstico */}
            {order.diagnosis && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Diagnóstico</p>
                <p className="text-sm bg-amber-50 p-3 rounded-md border border-amber-200">{order.diagnosis}</p>
              </div>
            )}
            
            {/* Mecánicos Asignados */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Mecánicos Asignados</p>
              <div className="flex flex-wrap gap-2">
                {assignedMechanics.map(mechanic => (
                  <Badge key={mechanic?.id} variant="secondary" className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {mechanic?.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Servicios de Terceros */}
            {orderThirdPartyServices.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Servicios de Terceros</p>
                <div className="space-y-2">
                  {orderThirdPartyServices.map(service => (
                    <div key={service.id} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                      <div>
                        <span className="font-medium">{service.type}</span>
                        <span className="text-muted-foreground"> - {service.providerName}</span>
                      </div>
                      <Badge 
                        variant={service.status === 'recibido' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Notificaciones Enviadas */}
            {orderNotifications.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Notificaciones al Cliente</p>
                <div className="space-y-2">
                  {orderNotifications.map(notification => (
                    <div key={notification.id} className="flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">{notification.type.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-xs">
                        {notification.channel}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {notification.sentAt?.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tiempos */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Ingreso</p>
                <p className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {order.createdAt.toLocaleDateString()}
                </p>
              </div>
              {order.estimatedCompletion && (
                <div>
                  <p className="text-muted-foreground">Entrega Estimada</p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {order.estimatedCompletion.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            
            {/* Costos */}
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>Mano de Obra:</span>
                <span>S/ {order.laborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Repuestos:</span>
                <span>S/ {order.partsCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg mt-2">
                <span>Total:</span>
                <span>S/ {order.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button>Ver Orden Completa</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente principal del Tablero Visual
export function VisualBoard() {
  const { workOrders, updateWorkOrder } = useERP();
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Estado para el modal de asignación de mecánicos
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<WorkOrder | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<WorkOrderStatus | null>(null);
  
  // Agrupar órdenes por estado
  const ordersByStatus = useMemo(() => {
    const grouped: Record<WorkOrderStatus, WorkOrder[]> = {
      pendiente: [],
      asignado: [],
      en_progreso: [],
      espera_repuestos: [],
      calidad: [],
      completado: [],
      entregado: [],
      cancelado: [],
    };
    
    workOrders.forEach(order => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });
    
    return grouped;
  }, [workOrders]);
  
  const handleCardClick = (order: WorkOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };
  
  // Manejar solicitud de asignación de mecánicos
  const handleRequestAssign = (order: WorkOrder, newStatus: WorkOrderStatus) => {
    setOrderToAssign(order);
    setPendingStatusChange(newStatus);
    setAssignModalOpen(true);
  };
  
  // Manejar asignación de mecánicos
  const handleAssignMechanics = async (mechanicIds: string[]) => {
    if (orderToAssign && pendingStatusChange) {
      // Actualizar la orden con los mecánicos asignados y el nuevo estado
      await updateWorkOrder(orderToAssign.id, {
        assignedTo: mechanicIds,
        status: pendingStatusChange,
      });
      setAssignModalOpen(false);
      setOrderToAssign(null);
      setPendingStatusChange(null);
    }
  };
  
  // Contar órdenes urgentes
  const urgentOrders = workOrders.filter(o => o.priority === 'urgente' && o.status !== 'entregado' && o.status !== 'cancelado');
  
  return (
    <div className="space-y-4">
      {/* Header con alertas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tablero de Control Visual</h2>
          <p className="text-muted-foreground">Vista general de todas las órdenes de trabajo</p>
        </div>
        
        {urgentOrders.length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{urgentOrders.length} orden(es) urgente(s)</span>
          </div>
        )}
      </div>
      
      {/* Resumen rápido */}
      <div className="grid grid-cols-7 gap-2">
        {BOARD_COLUMNS.map(column => {
          const count = ordersByStatus[column.id]?.length || 0;
          return (
            <div key={column.id} className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{column.label}</p>
            </div>
          );
        })}
      </div>
      
      {/* Tablero Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
        {BOARD_COLUMNS.map(column => {
          const orders = ordersByStatus[column.id] || [];
          const Icon = column.icon;
          
          return (
            <div 
              key={column.id} 
              className="flex-shrink-0 w-72 flex flex-col bg-muted/50 rounded-lg"
            >
              {/* Header de columna */}
              <div className={`p-3 rounded-t-lg ${column.color} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{column.label}</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {orders.length}
                  </Badge>
                </div>
              </div>
              
              {/* Cards */}
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-2">
                  {orders.map(order => (
                    <WorkOrderCard 
                      key={order.id} 
                      order={order} 
                      onClick={handleCardClick}
                      onRequestAssign={handleRequestAssign}
                    />
                  ))}
                  {orders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Sin órdenes
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
      
      {/* Modal de detalle */}
      <WorkOrderDetailModal 
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
      
      {/* Modal de asignación de mecánicos */}
      <AssignMechanicModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setOrderToAssign(null);
          setPendingStatusChange(null);
        }}
        onAssign={handleAssignMechanics}
        order={orderToAssign}
      />
    </div>
  );
}
