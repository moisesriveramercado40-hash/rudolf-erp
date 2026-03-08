import { useState, useMemo, useRef } from 'react';
import { useERP } from '@/context/ERPContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, AlertCircle, CheckCircle2, Wrench, 
  Package, User, Phone, Calendar,
  MessageSquare, ExternalLink, ChevronLeft, ChevronRight, MoreHorizontal, Trash2,
  MessageCircle, Users, Plus, Minus, FileText, X
} from 'lucide-react';
import type { WorkOrder, WorkOrderStatus, User as UserType } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

// Modal para registrar repuestos necesarios (Progreso → Espera Repuestos)
function PartsRequestModal({
  isOpen,
  onClose,
  onConfirm,
  order,
  parts,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partsList: Array<{ partId: string; name: string; quantity: number; price: number }>) => void;
  order: WorkOrder | null;
  parts: Array<{ id: string; name: string; stock: number; price: number }>;
}) {
  const [requestedParts, setRequestedParts] = useState<Array<{ partId: string; name: string; quantity: number; price: number }>>([]);
  const [selectedPart, setSelectedPart] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  
  const handleAddPart = () => {
    if (selectedPart === 'custom') {
      if (customName && quantity > 0) {
        setRequestedParts([...requestedParts, { 
          partId: `custom_${Date.now()}`, 
          name: customName, 
          quantity, 
          price: customPrice 
        }]);
        setCustomName('');
        setCustomPrice(0);
        setQuantity(1);
      }
    } else if (selectedPart) {
      const part = parts.find(p => p.id === selectedPart);
      if (part && quantity > 0) {
        setRequestedParts([...requestedParts, { 
          partId: part.id, 
          name: part.name, 
          quantity, 
          price: part.price 
        }]);
        setSelectedPart('');
        setQuantity(1);
      }
    }
  };
  
  const handleRemovePart = (index: number) => {
    setRequestedParts(requestedParts.filter((_, i) => i !== index));
  };
  
  const handleConfirm = () => {
    if (requestedParts.length > 0) {
      onConfirm(requestedParts);
      setRequestedParts([]);
    }
  };
  
  const total = requestedParts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  if (!order) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Solicitar Repuestos
          </DialogTitle>
          <DialogDescription>
            Orden: {order.orderNumber} - Registra los repuestos necesarios
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 py-4">
            {/* Formulario para agregar repuesto */}
            <div className="space-y-3 border rounded-lg p-3 bg-muted/50">
              <Label className="text-sm">Agregar Repuesto</Label>
              
              <Select value={selectedPart} onValueChange={setSelectedPart}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar repuesto..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Otro (no en inventario)</SelectItem>
                  {parts.map(part => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name} (Stock: {part.stock}) - S/ {part.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedPart === 'custom' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Nombre del repuesto"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Precio unitario (S/)"
                    value={customPrice || ''}
                    onChange={e => setCustomPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddPart}
                    disabled={!selectedPart || (selectedPart === 'custom' && !customName)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Lista de repuestos solicitados */}
            {requestedParts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Repuestos Solicitados ({requestedParts.length})</Label>
                <div className="space-y-2">
                  {requestedParts.map((part, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <p className="text-sm font-medium">{part.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {part.quantity} x S/ {part.price.toFixed(2)} = S/ {(part.quantity * part.price).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePart(index)}
                        className="text-red-500"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Total estimado:</span>
                  <span className="font-bold text-lg">S/ {total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleConfirm}
            disabled={requestedParts.length === 0}
          >
            Solicitar Repuestos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal para checklist de repuestos (Espera Repuestos → Control Calidad)
function PartsChecklistModal({
  isOpen,
  onClose,
  onConfirm,
  order,
  parts,
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (checkedParts: Array<{ partId: string; name: string; received: boolean; missing: boolean }>, notes: string) => void;
  order: WorkOrder | null;
  parts: Array<{ partId: string; name: string; quantity: number; price: number }>;
  currentUser: UserType | null;
}) {
  const [checkedParts, setCheckedParts] = useState<Array<{ partId: string; name: string; received: boolean; missing: boolean }>>([]);
  const [notes, setNotes] = useState('');
  
  // Inicializar el checklist cuando se abre el modal
  useState(() => {
    if (parts.length > 0) {
      setCheckedParts(parts.map(p => ({ 
        partId: p.partId, 
        name: p.name, 
        received: false, 
        missing: false 
      })));
    }
  });
  
  const handleToggleReceived = (index: number) => {
    const newChecked = [...checkedParts];
    newChecked[index].received = !newChecked[index].received;
    if (newChecked[index].received) {
      newChecked[index].missing = false;
    }
    setCheckedParts(newChecked);
  };
  
  const handleToggleMissing = (index: number) => {
    const newChecked = [...checkedParts];
    newChecked[index].missing = !newChecked[index].missing;
    if (newChecked[index].missing) {
      newChecked[index].received = false;
    }
    setCheckedParts(newChecked);
  };
  
  const allReceived = checkedParts.length > 0 && checkedParts.every(p => p.received);
  const hasMissing = checkedParts.some(p => p.missing);
  
  const handleConfirm = () => {
    onConfirm(checkedParts, notes);
    setCheckedParts([]);
    setNotes('');
  };
  
  const canConfirm = currentUser?.role === 'admin' || currentUser?.role === 'maestro';
  
  if (!order) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Checklist de Repuestos
          </DialogTitle>
          <DialogDescription>
            Orden: {order.orderNumber} - Verifica los repuestos recibidos
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 py-4">
            {!canConfirm && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  ⚠️ Solo el administrador o el maestro pueden completar este checklist.
                </p>
              </div>
            )}
            
            {parts.length === 0 ? (
              <p className="text-center text-muted-foreground">No hay repuestos registrados para esta orden.</p>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm">Repuestos Solicitados ({parts.length})</Label>
                <div className="space-y-2">
                  {parts.map((part, index) => (
                    <div key={index} className="p-3 bg-white rounded border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{part.name}</p>
                          <p className="text-xs text-muted-foreground">Cantidad: {part.quantity}</p>
                        </div>
                        {canConfirm && (
                          <div className="flex gap-2">
                            <Button
                              variant={checkedParts[index]?.received ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleReceived(index)}
                              className="text-xs"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Recibido
                            </Button>
                            <Button
                              variant={checkedParts[index]?.missing ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleMissing(index)}
                              className="text-xs"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Falta
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {canConfirm && (
              <div className="space-y-2">
                <Label className="text-sm">Notas adicionales</Label>
                <textarea
                  className="w-full p-2 border rounded-md text-sm min-h-[80px]"
                  placeholder="Observaciones sobre los repuestos..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex-col gap-2">
          {hasMissing && (
            <div className="w-full p-2 bg-red-50 border border-red-200 rounded text-center">
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Hay repuestos faltantes. La orden se marcará como urgente.
              </p>
            </div>
          )}
          {allReceived && (
            <div className="w-full p-2 bg-green-50 border border-green-200 rounded text-center">
              <p className="text-sm text-green-600 font-medium">
                ✅ Todos los repuestos recibidos. Listo para Control de Calidad.
              </p>
            </div>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            {canConfirm && (
              <Button 
                onClick={handleConfirm}
                className="flex-1"
              >
                {hasMissing ? 'Marcar con Faltantes' : 'Confirmar y Pasar a Calidad'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal para acta de entrega (Completado → Entregado)
function DeliveryActModal({
  isOpen,
  onClose,
  onConfirm,
  order,
  client,
  motorcycle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signature: string, photo: string | null, notes: string) => void;
  order: WorkOrder | null;
  client: any;
  motorcycle: any;
}) {
  const [signature, setSignature] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setSignature('');
    }
  };
  
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleConfirm = () => {
    if (signature) {
      onConfirm(signature, photo, notes);
      setSignature('');
      setPhoto(null);
      setNotes('');
      clearSignature();
    }
  };
  
  if (!order || !client || !motorcycle) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Acta de Entrega
          </DialogTitle>
          <DialogDescription>
            Orden: {order.orderNumber} - Entrega de moto al cliente
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 py-4">
            {/* Información de la orden */}
            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="text-sm"><strong>Cliente:</strong> {client.firstName} {client.lastName}</p>
              <p className="text-sm"><strong>Moto:</strong> {motorcycle.brand} {motorcycle.model} - {motorcycle.plate}</p>
              <p className="text-sm"><strong>Total a pagar:</strong> S/ {order.totalCost.toFixed(2)}</p>
            </div>
            
            {/* Firma del cliente */}
            <div className="space-y-2">
              <Label className="text-sm">Firma del Cliente *</Label>
              <div className="border rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ cursor: 'crosshair' }}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSignature}
                className="w-full"
              >
                Limpiar Firma
              </Button>
            </div>
            
            {/* Foto del cliente con la moto */}
            <div className="space-y-2">
              <Label className="text-sm">Foto del Cliente con la Moto (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoCapture}
                  className="flex-1"
                />
              </div>
              {photo && (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img src={photo} alt="Cliente con moto" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setPhoto(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Notas */}
            <div className="space-y-2">
              <Label className="text-sm">Notas de entrega</Label>
              <textarea
                className="w-full p-2 border rounded-md text-sm min-h-[80px]"
                placeholder="Observaciones adicionales..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleConfirm}
            disabled={!signature}
          >
            Confirmar Entrega
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
  onRequestParts,
  onRequestChecklist,
  onRequestDelivery,
  hasMissingParts,
}: { 
  order: WorkOrder; 
  onClick: (order: WorkOrder) => void;
  onRequestAssign: (order: WorkOrder, newStatus: WorkOrderStatus) => void;
  onRequestParts: (order: WorkOrder, newStatus: WorkOrderStatus) => void;
  onRequestChecklist: (order: WorkOrder, newStatus: WorkOrderStatus) => void;
  onRequestDelivery: (order: WorkOrder, newStatus: WorkOrderStatus) => void;
  hasMissingParts?: boolean;
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
    // Si es cambio de progreso a espera repuestos, requerir registro de repuestos
    else if (order.status === 'en_progreso' && newStatus === 'espera_repuestos') {
      onRequestParts(order, newStatus);
    }
    // Si es cambio de espera repuestos a calidad, requerir checklist
    else if (order.status === 'espera_repuestos' && newStatus === 'calidad') {
      onRequestChecklist(order, newStatus);
    }
    // Si es cambio de completado a entregado, requerir acta de entrega
    else if (order.status === 'completado' && newStatus === 'entregado') {
      onRequestDelivery(order, newStatus);
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
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 hover:scale-[1.02] ${hasMissingParts ? 'bg-red-50 border-red-300' : ''}`}
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
        
        {/* Botón de repuestos pendiente urgente */}
        {hasMissingParts && (
          <div className="mt-3 pt-2 border-t">
            <Button 
              size="sm" 
              variant="destructive"
              className="w-full rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onRequestChecklist(order, 'calidad');
              }}
            >
              <Package className="w-4 h-4 mr-2" />
              Repuestos Pendiente Urgente
            </Button>
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
  const { workOrders, updateWorkOrder, parts, clients, getMotorcyclesByClient } = useERP();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Estado para el modal de asignación de mecánicos
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<WorkOrder | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<WorkOrderStatus | null>(null);
  
  // Estado para el modal de solicitud de repuestos
  const [partsRequestModalOpen, setPartsRequestModalOpen] = useState(false);
  const [orderToRequestParts, setOrderToRequestParts] = useState<WorkOrder | null>(null);
  const [pendingPartsStatusChange, setPendingPartsStatusChange] = useState<WorkOrderStatus | null>(null);
  const [orderRequestedParts, setOrderRequestedParts] = useState<Record<string, Array<{ partId: string; name: string; quantity: number; price: number }>>>({});
  const [orderMissingParts, setOrderMissingParts] = useState<Record<string, boolean>>({});
  
  // Estado para el modal de checklist de repuestos
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [orderToChecklist, setOrderToChecklist] = useState<WorkOrder | null>(null);
  const [pendingChecklistStatusChange, setPendingChecklistStatusChange] = useState<WorkOrderStatus | null>(null);
  
  // Estado para el modal de acta de entrega
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [orderToDeliver, setOrderToDeliver] = useState<WorkOrder | null>(null);
  const [pendingDeliveryStatusChange, setPendingDeliveryStatusChange] = useState<WorkOrderStatus | null>(null);
  
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
  
  // Manejar solicitud de repuestos
  const handleRequestParts = (order: WorkOrder, newStatus: WorkOrderStatus) => {
    setOrderToRequestParts(order);
    setPendingPartsStatusChange(newStatus);
    setPartsRequestModalOpen(true);
  };
  
  // Manejar confirmación de solicitud de repuestos
  const handleConfirmPartsRequest = async (partsList: Array<{ partId: string; name: string; quantity: number; price: number }>) => {
    if (orderToRequestParts && pendingPartsStatusChange) {
      // Guardar los repuestos solicitados
      setOrderRequestedParts(prev => ({
        ...prev,
        [orderToRequestParts.id]: partsList
      }));
      // Cambiar el estado de la orden
      await updateWorkOrder(orderToRequestParts.id, {
        status: pendingPartsStatusChange,
      });
      setPartsRequestModalOpen(false);
      setOrderToRequestParts(null);
      setPendingPartsStatusChange(null);
    }
  };
  
  // Manejar solicitud de checklist
  const handleRequestChecklist = (order: WorkOrder, newStatus: WorkOrderStatus) => {
    setOrderToChecklist(order);
    setPendingChecklistStatusChange(newStatus);
    setChecklistModalOpen(true);
  };
  
  // Manejar confirmación de checklist
  const handleConfirmChecklist = async (checkedParts: Array<{ partId: string; name: string; received: boolean; missing: boolean }>, notes: string) => {
    if (orderToChecklist && pendingChecklistStatusChange) {
      // Verificar si hay repuestos faltantes
      const hasMissing = checkedParts.some(p => p.missing);
      
      // Guardar el estado de repuestos faltantes
      setOrderMissingParts(prev => ({
        ...prev,
        [orderToChecklist.id]: hasMissing
      }));
      
      // Cambiar el estado de la orden
      await updateWorkOrder(orderToChecklist.id, {
        status: pendingChecklistStatusChange,
        notes: notes ? `${orderToChecklist.notes || ''}\n${notes}`.trim() : orderToChecklist.notes,
      });
      
      setChecklistModalOpen(false);
      setOrderToChecklist(null);
      setPendingChecklistStatusChange(null);
    }
  };
  
  // Manejar solicitud de entrega
  const handleRequestDelivery = (order: WorkOrder, newStatus: WorkOrderStatus) => {
    setOrderToDeliver(order);
    setPendingDeliveryStatusChange(newStatus);
    setDeliveryModalOpen(true);
  };
  
  // Manejar confirmación de entrega
  const handleConfirmDelivery = async (signatureData: string, photoData: string | null, notes: string) => {
    if (orderToDeliver && pendingDeliveryStatusChange) {
      // TODO: Guardar firma y foto en el backend
      console.log('Firma del cliente:', signatureData.substring(0, 50) + '...');
      if (photoData) {
        console.log('Foto del cliente:', photoData.substring(0, 50) + '...');
      }
      // Cambiar el estado de la orden
      await updateWorkOrder(orderToDeliver.id, {
        status: pendingDeliveryStatusChange,
        notes: notes ? `${orderToDeliver.notes || ''}\nActa de entrega: ${notes}`.trim() : orderToDeliver.notes,
      });
      setDeliveryModalOpen(false);
      setOrderToDeliver(null);
      setPendingDeliveryStatusChange(null);
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
                      onRequestParts={handleRequestParts}
                      onRequestChecklist={handleRequestChecklist}
                      onRequestDelivery={handleRequestDelivery}
                      hasMissingParts={orderMissingParts[order.id]}
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
      
      {/* Modal de solicitud de repuestos */}
      <PartsRequestModal
        isOpen={partsRequestModalOpen}
        onClose={() => {
          setPartsRequestModalOpen(false);
          setOrderToRequestParts(null);
          setPendingPartsStatusChange(null);
        }}
        onConfirm={handleConfirmPartsRequest}
        order={orderToRequestParts}
        parts={parts.map(p => ({ id: p.id, name: p.name, stock: p.stock, price: p.salePrice }))}
      />
      
      {/* Modal de checklist de repuestos */}
      <PartsChecklistModal
        isOpen={checklistModalOpen}
        onClose={() => {
          setChecklistModalOpen(false);
          setOrderToChecklist(null);
          setPendingChecklistStatusChange(null);
        }}
        onConfirm={handleConfirmChecklist}
        order={orderToChecklist}
        parts={orderToChecklist ? (orderRequestedParts[orderToChecklist.id] || []) : []}
        currentUser={user}
      />
      
      {/* Modal de acta de entrega */}
      <DeliveryActModal
        isOpen={deliveryModalOpen}
        onClose={() => {
          setDeliveryModalOpen(false);
          setOrderToDeliver(null);
          setPendingDeliveryStatusChange(null);
        }}
        onConfirm={handleConfirmDelivery}
        order={orderToDeliver}
        client={orderToDeliver ? clients.find(c => c.id === orderToDeliver.clientId) : null}
        motorcycle={orderToDeliver ? getMotorcyclesByClient(orderToDeliver.clientId).find(m => m.id === orderToDeliver.motorcycleId) : null}
      />
    </div>
  );
}
