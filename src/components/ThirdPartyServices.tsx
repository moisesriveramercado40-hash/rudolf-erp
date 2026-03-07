import { useState } from 'react';
import { useERP } from '@/context/ERPContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Phone, Package,
  Clock, DollarSign, CheckCircle2, Truck, RotateCcw,
  AlertCircle, Wrench
} from 'lucide-react';
import type { ThirdPartyService, ThirdPartyServiceType, ThirdPartyServiceStatus, User } from '@/types';

// Tipos de servicios de terceros
const SERVICE_TYPES: { id: ThirdPartyServiceType; label: string; icon: React.ElementType }[] = [
  { id: 'torno', label: 'Torno', icon: RotateCcw },
  { id: 'soldadura', label: 'Soldadura', icon: Wrench },
  { id: 'pintura', label: 'Pintura', icon: Package },
  { id: 'cromado', label: 'Cromado', icon: CheckCircle2 },
  { id: 'rectificadora', label: 'Rectificadora', icon: RotateCcw },
  { id: 'llaves', label: 'Duplicado Llaves', icon: KeyIcon },
  { id: 'electronica', label: 'Electrónica', icon: AlertCircle },
  { id: 'otros', label: 'Otros', icon: Package },
];

function KeyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5"/>
      <path d="m21 2-9.6 9.6"/>
      <path d="m15.5 7.5 3 3L22 7l-3-3"/>
    </svg>
  );
}

// Estados de servicio
const SERVICE_STATUSES: { id: ThirdPartyServiceStatus; label: string; color: string }[] = [
  { id: 'pendiente_envio', label: 'Pendiente Envío', color: 'bg-slate-500' },
  { id: 'enviado', label: 'Enviado', color: 'bg-blue-500' },
  { id: 'en_proceso', label: 'En Proceso', color: 'bg-amber-500' },
  { id: 'completado', label: 'Completado', color: 'bg-green-500' },
  { id: 'recibido', label: 'Recibido', color: 'bg-emerald-600' },
  { id: 'cancelado', label: 'Cancelado', color: 'bg-red-500' },
];

// Diálogo para nuevo servicio de terceros
function NewServiceDialog() {
  const { addThirdPartyService, workOrders } = useERP();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    workOrderId: '',
    type: 'torno' as ThirdPartyServiceType,
    providerName: '',
    providerPhone: '',
    providerContact: '',
    description: '',
    partsIncluded: '',
    estimatedCost: '',
    estimatedDays: '2',
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addThirdPartyService({
      workOrderId: formData.workOrderId,
      type: formData.type,
      providerName: formData.providerName,
      providerPhone: formData.providerPhone,
      providerContact: formData.providerContact,
      description: formData.description,
      partsIncluded: formData.partsIncluded,
      estimatedCost: parseFloat(formData.estimatedCost) || 0,
      finalCost: undefined,
      status: 'pendiente_envio',
      estimatedDays: parseInt(formData.estimatedDays) || 2,
      managedBy: user?.id || '',
      notes: '',
    });
    
    setIsOpen(false);
    setFormData({
      workOrderId: '',
      type: 'torno',
      providerName: '',
      providerPhone: '',
      providerContact: '',
      description: '',
      partsIncluded: '',
      estimatedCost: '',
      estimatedDays: '2',
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Servicio Externo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Registrar Servicio de Terceros</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-4 p-1">
            {/* Orden de Trabajo */}
            <div className="space-y-2">
              <Label>Orden de Trabajo *</Label>
              <Select 
                value={formData.workOrderId} 
                onValueChange={(v) => setFormData({ ...formData, workOrderId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar orden" />
                </SelectTrigger>
                <SelectContent>
                  {workOrders
                    .filter(o => o.status !== 'entregado' && o.status !== 'cancelado')
                    .map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNumber} - {order.description.substring(0, 40)}...
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Tipo de Servicio */}
            <div className="space-y-2">
              <Label>Tipo de Servicio *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData({ ...formData, type: v as ThirdPartyServiceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Proveedor */}
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Input
                value={formData.providerName}
                onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                placeholder="Nombre del proveedor/taller"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={formData.providerPhone}
                  onChange={(e) => setFormData({ ...formData, providerPhone: e.target.value })}
                  placeholder="987-654-321"
                />
              </div>
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Input
                  value={formData.providerContact}
                  onChange={(e) => setFormData({ ...formData, providerContact: e.target.value })}
                  placeholder="Nombre del contacto"
                />
              </div>
            </div>
            
            {/* Descripción */}
            <div className="space-y-2">
              <Label>Descripción del Trabajo *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalle el trabajo a realizar..."
                rows={3}
                required
              />
            </div>
            
            {/* Piezas incluidas */}
            <div className="space-y-2">
              <Label>Piezas Enviadas</Label>
              <Textarea
                value={formData.partsIncluded}
                onChange={(e) => setFormData({ ...formData, partsIncluded: e.target.value })}
                placeholder="¿Qué piezas se envían al proveedor?"
                rows={2}
              />
            </div>
            
            {/* Costo y tiempo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Costo Estimado (S/)</Label>
                <Input
                  type="number"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Días Estimados</Label>
                <Input
                  type="number"
                  value={formData.estimatedDays}
                  onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                  placeholder="2"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Servicio
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Tarjeta de servicio
function ServiceCard({ service }: { service: ThirdPartyService }) {
  const { workOrders, updateThirdPartyServiceStatus } = useERP();
  const { users } = useAuth();
  const order = workOrders.find(o => o.id === service.workOrderId);
  const manager = users.find((u: User) => u.id === service.managedBy);
  const statusInfo = SERVICE_STATUSES.find(s => s.id === service.status);
  const serviceType = SERVICE_TYPES.find(t => t.id === service.type);
  
  const daysElapsed = service.sentAt 
    ? Math.floor((Date.now() - service.sentAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
              {serviceType && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <serviceType.icon className="w-3 h-3" />
                  {serviceType.label}
                </Badge>
              )}
            </div>
            
            <p className="font-medium">{service.providerName}</p>
            <p className="text-sm text-muted-foreground mb-2">
              {order?.orderNumber} - {service.description.substring(0, 50)}...
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="w-4 h-4" />
                {service.providerPhone || 'Sin teléfono'}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                Est: S/ {service.estimatedCost.toFixed(2)}
              </div>
            </div>
            
            {service.partsIncluded && (
              <p className="text-sm text-muted-foreground mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                {service.partsIncluded}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {service.sentAt && (
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Enviado: {service.sentAt.toLocaleDateString()}
                </span>
              )}
              {service.receivedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Recibido: {service.receivedAt.toLocaleDateString()}
                </span>
              )}
              {daysElapsed > 0 && service.status !== 'recibido' && service.status !== 'cancelado' && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysElapsed}d transcurridos
                </span>
              )}
            </div>
            
            {manager && (
              <p className="text-xs text-muted-foreground mt-2">
                Gestionado por: {manager.name}
              </p>
            )}
          </div>
          
          {/* Acciones de cambio de estado */}
          <div className="flex flex-col gap-1 ml-2">
            {service.status === 'pendiente_envio' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateThirdPartyServiceStatus(service.id, 'enviado')}
              >
                <Truck className="w-3 h-3 mr-1" />
                Enviar
              </Button>
            )}
            {service.status === 'enviado' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateThirdPartyServiceStatus(service.id, 'en_proceso')}
              >
                <Wrench className="w-3 h-3 mr-1" />
                En Proceso
              </Button>
            )}
            {service.status === 'en_proceso' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => updateThirdPartyServiceStatus(service.id, 'completado')}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completado
              </Button>
            )}
            {service.status === 'completado' && (
              <Button 
                size="sm"
                onClick={() => updateThirdPartyServiceStatus(service.id, 'recibido')}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Recibir
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal
export function ThirdPartyServices() {
  const { thirdPartyServices, getPendingThirdPartyServices } = useERP();
  const [activeTab, setActiveTab] = useState('pending');
  
  const pendingServices = getPendingThirdPartyServices();
  const completedServices = thirdPartyServices.filter(s => s.status === 'recibido');
  const cancelledServices = thirdPartyServices.filter(s => s.status === 'cancelado');
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Servicios de Terceros</h2>
          <p className="text-muted-foreground">Gestiona trabajos externos (torno, soldadura, etc.)</p>
        </div>
        <NewServiceDialog />
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{pendingServices.length}</p>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              {thirdPartyServices.filter(s => s.status === 'enviado' || s.status === 'en_proceso').length}
            </p>
            <p className="text-sm text-muted-foreground">En Proceso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{completedServices.length}</p>
            <p className="text-sm text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              S/ {thirdPartyServices.reduce((sum, s) => sum + (s.finalCost || s.estimatedCost), 0).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Costo Total</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pendientes
            {pendingServices.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingServices.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <div className="space-y-3">
            {pendingServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay servicios pendientes
              </div>
            ) : (
              pendingServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="space-y-3">
            {completedServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay servicios completados
              </div>
            ) : (
              completedServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="cancelled">
          <div className="space-y-3">
            {cancelledServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay servicios cancelados
              </div>
            ) : (
              cancelledServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all">
          <div className="space-y-3">
            {thirdPartyServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay servicios registrados
              </div>
            ) : (
              thirdPartyServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
