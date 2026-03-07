import { useState } from 'react';
import { useERP } from '@/context/ERPContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, Send, Phone, Mail, CheckCircle2, 
  Clock, AlertCircle, Bell, MessageCircle, User
} from 'lucide-react';
import type { CustomerNotificationType, NotificationChannel } from '@/types';

// Tipos de notificación con iconos y colores
const NOTIFICATION_TYPES: { id: CustomerNotificationType; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'trabajo_completado', label: 'Trabajo Completado', icon: CheckCircle2, color: 'text-green-600' },
  { id: 'faltan_repuestos', label: 'Faltan Repuestos', icon: AlertCircle, color: 'text-orange-600' },
  { id: 'falla_adicional', label: 'Falla Adicional', icon: AlertCircle, color: 'text-red-600' },
  { id: 'trabajo_iniciado', label: 'Trabajo Iniciado', icon: Clock, color: 'text-blue-600' },
  { id: 'listo_para_entrega', label: 'Listo para Entrega', icon: CheckCircle2, color: 'text-green-600' },
  { id: 'recordatorio', label: 'Recordatorio', icon: Bell, color: 'text-purple-600' },
  { id: 'cotizacion_lista', label: 'Cotización Lista', icon: MessageSquare, color: 'text-indigo-600' },
];

// Canales de notificación
const CHANNELS: { id: NotificationChannel; label: string; icon: React.ElementType }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'llamada', label: 'Llamada', icon: Phone },
];

// Plantillas de mensajes predefinidos
const MESSAGE_TEMPLATES: Record<CustomerNotificationType, string> = {
  trabajo_completado: 'Estimado/a {cliente}, su moto {moto} está lista para recoger. Total a pagar: S/{total}. Horario de atención: 8AM-6PM. Gracias por confiar en Taller RUDOLF.',
  faltan_repuestos: 'Estimado/a {cliente}, para continuar con la reparación de su moto {moto} necesitamos el repuesto: {repuesto}. ¿Desea que lo ordenemos? Costo aproximado: S/{costo}.',
  falla_adicional: 'Estimado/a {cliente}, al revisar su moto {moto} encontramos una falla adicional: {falla}. Costo adicional: S/{costo}. ¿Desea que lo reparemos?',
  trabajo_iniciado: 'Estimado/a {cliente}, hemos iniciado el trabajo en su moto {moto}. Tiempo estimado: {tiempo}. Le informaremos cuando esté lista.',
  listo_para_entrega: 'Estimado/a {cliente}, su moto {moto} está lista para entrega. Puede pasar a recogerla. Total: S/{total}. Horario: 8AM-6PM.',
  recordatorio: 'Estimado/a {cliente}, le recordamos que su moto {moto} está lista para recoger desde el {fecha}. Quedamos atentos.',
  cotizacion_lista: 'Estimado/a {cliente}, su cotización {cotizacion} para {moto} está lista. Total: S/{total}. Válida hasta {fecha}.',
};

// Componente para enviar nueva notificación
function SendNotificationDialog({ workOrderId }: { workOrderId?: string }) {
  const { addCustomerNotification, workOrders, clients, getMotorcyclesByClient } = useERP();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(workOrderId || '');
  const [notificationType, setNotificationType] = useState<CustomerNotificationType>('trabajo_completado');
  const [channel, setChannel] = useState<NotificationChannel>('whatsapp');
  const [message, setMessage] = useState('');
  
  const selectedWorkOrder = workOrders.find(o => o.id === selectedOrder);
  const client = selectedWorkOrder ? clients.find(c => c.id === selectedWorkOrder.clientId) : null;
  const motorcycle = selectedWorkOrder ? getMotorcyclesByClient(selectedWorkOrder.clientId).find(m => m.id === selectedWorkOrder.motorcycleId) : null;
  
  // Generar mensaje basado en plantilla
  const generateMessage = () => {
    const template = MESSAGE_TEMPLATES[notificationType];
    return template
      .replace('{cliente}', client?.firstName || '')
      .replace('{moto}', motorcycle ? `${motorcycle.brand} ${motorcycle.model}` : '')
      .replace('{total}', selectedWorkOrder?.totalCost.toFixed(2) || '0')
      .replace('{fecha}', new Date().toLocaleDateString());
  };
  
  const handleSend = () => {
    if (!selectedOrder || !client) return;
    
    addCustomerNotification({
      workOrderId: selectedOrder,
      clientId: client.id,
      type: notificationType,
      channel,
      message: message || generateMessage(),
      createdBy: user?.id || '',
    });
    
    setIsOpen(false);
    setMessage('');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          Enviar Notificación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Notificación al Cliente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Seleccionar Orden */}
          <div className="space-y-2">
            <Label>Orden de Trabajo</Label>
            <Select value={selectedOrder} onValueChange={setSelectedOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar orden" />
              </SelectTrigger>
              <SelectContent>
                {workOrders
                  .filter(o => o.status !== 'entregado' && o.status !== 'cancelado')
                  .map(order => {
                    const c = clients.find(cl => cl.id === order.clientId);
                    return (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNumber} - {c?.firstName} {c?.lastName}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>
          
          {/* Info del cliente */}
          {client && (
            <div className="bg-muted p-3 rounded-lg flex items-center gap-3">
              <User className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{client.firstName} {client.lastName}</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
            </div>
          )}
          
          {/* Tipo de notificación */}
          <div className="space-y-2">
            <Label>Tipo de Notificación</Label>
            <Select value={notificationType} onValueChange={(v) => setNotificationType(v as CustomerNotificationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <type.icon className={`w-4 h-4 ${type.color}`} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Canal */}
          <div className="space-y-2">
            <Label>Canal de Envío</Label>
            <div className="grid grid-cols-4 gap-2">
              {CHANNELS.map(ch => (
                <Button
                  key={ch.id}
                  type="button"
                  variant={channel === ch.id ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => setChannel(ch.id)}
                >
                  <ch.icon className="w-5 h-5" />
                  <span className="text-xs">{ch.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Mensaje */}
          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={generateMessage()}
              rows={4}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setMessage(generateMessage())}
            >
              Usar Plantilla
            </Button>
          </div>
          
          <Button 
            onClick={handleSend} 
            className="w-full"
            disabled={!selectedOrder}
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Notificación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente principal
export function CustomerNotifications() {
  const { customerNotifications, clients, workOrders, sendCustomerNotification } = useERP();
  const [activeTab, setActiveTab] = useState('pending');
  
  const pendingNotifications = customerNotifications.filter(n => n.status === 'pendiente');
  const sentNotifications = customerNotifications.filter(n => n.status === 'enviado');
  const confirmedNotifications = customerNotifications.filter(n => n.status === 'confirmado' || n.status === 'leido');
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Desconocido';
  };
  
  const getOrderNumber = (workOrderId?: string) => {
    if (!workOrderId) return '-';
    const order = workOrders.find(o => o.id === workOrderId);
    return order?.orderNumber || '-';
  };
  
  const getNotificationTypeLabel = (type: CustomerNotificationType) => {
    const typeInfo = NOTIFICATION_TYPES.find(t => t.id === type);
    return typeInfo?.label || type;
  };
  
  const getNotificationIcon = (type: CustomerNotificationType) => {
    const typeInfo = NOTIFICATION_TYPES.find(t => t.id === type);
    return typeInfo?.icon || MessageSquare;
  };
  
  const NotificationList = ({ notifications }: { notifications: typeof customerNotifications }) => (
    <div className="space-y-3">
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay notificaciones
        </div>
      ) : (
        notifications.map(notification => {
          const Icon = getNotificationIcon(notification.type);
          const typeInfo = NOTIFICATION_TYPES.find(t => t.id === notification.type);
          
          return (
            <Card key={notification.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${typeInfo?.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{getNotificationTypeLabel(notification.type)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getClientName(notification.clientId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Orden: {getOrderNumber(notification.workOrderId)}
                      </p>
                      <p className="text-sm mt-2 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.channel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {notification.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant={notification.status === 'confirmado' ? 'default' : 
                               notification.status === 'enviado' ? 'secondary' : 'outline'}
                    >
                      {notification.status}
                    </Badge>
                    
                    {notification.status === 'pendiente' && (
                      <Button 
                        size="sm" 
                        onClick={() => sendCustomerNotification(notification.id, notification.channel)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notificaciones a Clientes</h2>
          <p className="text-muted-foreground">Gestiona la comunicación con los clientes</p>
        </div>
        <SendNotificationDialog />
      </div>
      
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{pendingNotifications.length}</p>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{sentNotifications.length}</p>
            <p className="text-sm text-muted-foreground">Enviadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{confirmedNotifications.length}</p>
            <p className="text-sm text-muted-foreground">Confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{customerNotifications.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pendientes
            {pendingNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingNotifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Enviadas</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <NotificationList notifications={pendingNotifications} />
        </TabsContent>
        <TabsContent value="sent">
          <NotificationList notifications={sentNotifications} />
        </TabsContent>
        <TabsContent value="confirmed">
          <NotificationList notifications={confirmedNotifications} />
        </TabsContent>
        <TabsContent value="all">
          <NotificationList notifications={customerNotifications} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
