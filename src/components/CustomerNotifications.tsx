import { useState } from 'react';
import { useERP } from '@/context/ERPContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, Send, Phone, Mail, CheckCircle2, 
  Clock, AlertCircle, Bell, MessageCircle, User,
  ExternalLink, Copy, Check, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  openWhatsApp, generateMessage, formatPhoneForWhatsApp,
  type MessageTemplateType, type MessageTemplateData 
} from '@/services/whatsapp';
import type { CustomerNotificationType, NotificationChannel } from '@/types';

// Tipos de notificación
const NOTIFICATION_TYPES: { id: CustomerNotificationType; templateKey: MessageTemplateType; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'trabajo_iniciado', templateKey: 'trabajo_iniciado', label: 'Trabajo Iniciado', icon: Clock, color: 'text-blue-600' },
  { id: 'trabajo_completado', templateKey: 'trabajo_completado', label: 'Trabajo Completado', icon: CheckCircle2, color: 'text-green-600' },
  { id: 'listo_para_entrega', templateKey: 'listo_para_entrega', label: 'Listo para Entrega', icon: CheckCircle2, color: 'text-green-600' },
  { id: 'faltan_repuestos', templateKey: 'faltan_repuestos', label: 'Faltan Repuestos', icon: AlertCircle, color: 'text-orange-600' },
  { id: 'falla_adicional', templateKey: 'falla_adicional', label: 'Falla Adicional', icon: AlertTriangle, color: 'text-red-600' },
  { id: 'recordatorio', templateKey: 'recordatorio', label: 'Recordatorio', icon: Bell, color: 'text-purple-600' },
  { id: 'cotizacion_lista', templateKey: 'cotizacion_lista', label: 'Cotización Lista', icon: MessageSquare, color: 'text-indigo-600' },
];

const CHANNELS: { id: NotificationChannel; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500 hover:bg-green-600' },
  { id: 'llamada', label: 'Llamada', icon: Phone, color: 'bg-blue-500 hover:bg-blue-600' },
  { id: 'sms', label: 'SMS', icon: MessageSquare, color: 'bg-purple-500 hover:bg-purple-600' },
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-slate-500 hover:bg-slate-600' },
];

// ============ DIALOGO PARA ENVIAR NOTIFICACIÓN ============
function SendNotificationDialog({ workOrderId }: { workOrderId?: string }) {
  const { addCustomerNotification, sendCustomerNotification, workOrders, clients, motorcycles } = useERP();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(workOrderId || '');
  const [notificationType, setNotificationType] = useState<CustomerNotificationType>('trabajo_completado');
  const [channel, setChannel] = useState<NotificationChannel>('whatsapp');
  const [customMessage, setCustomMessage] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [additionalCost, setAdditionalCost] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  
  const selectedWorkOrder = workOrders.find(o => o.id === selectedOrder);
  const client = selectedWorkOrder ? clients.find(c => c.id === selectedWorkOrder.clientId) : null;
  const motorcycle = selectedWorkOrder ? motorcycles.find(m => m.id === selectedWorkOrder.motorcycleId) : null;
  
  // Datos para la plantilla
  const templateData: MessageTemplateData & { customMessage?: string } = {
    clientName: client ? `${client.firstName} ${client.lastName}` : '',
    motoInfo: motorcycle ? `${motorcycle.brand} ${motorcycle.model} (${motorcycle.plate || 'S/P'})` : '',
    orderNumber: selectedWorkOrder?.orderNumber || '',
    totalCost: notificationType === 'falla_adicional' || notificationType === 'faltan_repuestos' 
      ? additionalCost 
      : selectedWorkOrder?.totalCost,
    laborCost: selectedWorkOrder?.laborCost,
    partsCost: selectedWorkOrder?.partsCost,
    additionalInfo: additionalInfo || undefined,
    date: selectedWorkOrder?.completedAt 
      ? new Date(selectedWorkOrder.completedAt).toLocaleDateString('es-PE') 
      : new Date().toLocaleDateString('es-PE'),
    customMessage: customMessage || undefined,
  };
  
  // Obtener la plantilla correspondiente
  const typeConfig = NOTIFICATION_TYPES.find(t => t.id === notificationType);
  const templateKey = typeConfig?.templateKey || 'trabajo_completado';
  
  // Generar vista previa del mensaje
  const previewMessage = customMessage 
    ? generateMessage('mensaje_libre', { ...templateData, customMessage })
    : generateMessage(templateKey, templateData);
  
  const handleSendWhatsApp = async () => {
    if (!selectedOrder || !client?.phone) return;
    
    // 1. Registrar la notificación en el sistema
    const notifId = await addCustomerNotification({
      workOrderId: selectedOrder,
      clientId: client.id,
      type: notificationType,
      channel: 'whatsapp',
      message: previewMessage,
      createdBy: user?.id || '',
    });
    
    // 2. Abrir WhatsApp con el mensaje
    openWhatsApp(client.phone, previewMessage);
    
    // 3. Marcar como enviada
    if (notifId) {
      await sendCustomerNotification(notifId, 'whatsapp');
    }
    
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setIsOpen(false);
      setCustomMessage('');
      setAdditionalInfo('');
      setAdditionalCost(0);
    }, 1500);
  };
  
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleRegisterOtherChannel = async () => {
    if (!selectedOrder || !client) return;
    
    const notifId = await addCustomerNotification({
      workOrderId: selectedOrder,
      clientId: client.id,
      type: notificationType,
      channel,
      message: previewMessage,
      createdBy: user?.id || '',
    });
    
    if (notifId) {
      await sendCustomerNotification(notifId, channel);
    }
    
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setIsOpen(false);
    }, 1500);
  };
  
  const needsAdditionalInfo = notificationType === 'faltan_repuestos' || notificationType === 'falla_adicional';
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setSent(false); }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
          <MessageCircle className="w-4 h-4" />
          Enviar Notificación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh]" style={{ maxHeight: '90vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(90vh - 48px)', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0 }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                Enviar Notificación al Cliente
              </DialogTitle>
            </DialogHeader>
          </div>
        
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '4px 0' }} className="space-y-4">
            {/* Seleccionar Orden */}
            <div className="space-y-2">
              <Label>Orden de Trabajo</Label>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar orden..." />
                </SelectTrigger>
                <SelectContent>
                  {workOrders
                    .filter(o => o.status !== 'entregado' && o.status !== 'cancelado')
                    .map(order => {
                      const c = clients.find(cl => cl.id === order.clientId);
                      return (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNumber} — {c?.firstName} {c?.lastName}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            
            {/* Info del cliente con teléfono */}
            {client && (
              <div className="bg-muted p-3 rounded-lg flex items-center gap-3">
                <User className="w-8 h-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{client.firstName} {client.lastName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {client.phone}
                    {client.phone && (
                      <span className="text-xs text-green-600 ml-1">
                        (+{formatPhoneForWhatsApp(client.phone).substring(0, 2)})
                      </span>
                    )}
                  </p>
                </div>
                {!client.phone && (
                  <Badge variant="destructive" className="text-xs">Sin teléfono</Badge>
                )}
              </div>
            )}
            
            {/* Tipo de notificación */}
            <div className="space-y-2">
              <Label>Tipo de Mensaje</Label>
              <Select value={notificationType} onValueChange={(v) => { setNotificationType(v as CustomerNotificationType); setCustomMessage(''); }}>
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
            
            {/* Info adicional para ciertos tipos */}
            {needsAdditionalInfo && (
              <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Label className="text-xs text-amber-700">
                  {notificationType === 'faltan_repuestos' ? 'Repuesto necesario' : 'Descripción de la falla'}
                </Label>
                <Input
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                  placeholder={notificationType === 'faltan_repuestos' 
                    ? 'Ej: Kit de arrastre cadena + piñones' 
                    : 'Ej: Desgaste en los rodamientos del cigüeñal'}
                />
                <Label className="text-xs text-amber-700">Costo estimado (S/)</Label>
                <Input
                  type="number" min={0} step={0.01}
                  value={additionalCost}
                  onChange={e => setAdditionalCost(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
            
            {/* Canal */}
            <div className="space-y-2">
              <Label>Canal de Envío</Label>
              <div className="grid grid-cols-4 gap-2">
                {CHANNELS.map(ch => (
                  <Button
                    key={ch.id}
                    type="button"
                    variant={channel === ch.id ? 'default' : 'outline'}
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto py-2",
                      channel === ch.id && ch.id === 'whatsapp' && 'bg-green-600 hover:bg-green-700'
                    )}
                    onClick={() => setChannel(ch.id)}
                  >
                    <ch.icon className="w-5 h-5" />
                    <span className="text-xs">{ch.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Mensaje personalizado (opcional) */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Mensaje personalizado (deja vacío para usar plantilla)</Label>
              <Textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="Escribe un mensaje personalizado o deja vacío para usar la plantilla automática..."
                rows={2}
              />
            </div>
            
            {/* Vista previa del mensaje */}
            {selectedOrder && client && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs">
                  <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                  Vista previa del mensaje
                </Label>
                <div className="bg-[#e5ddd5] rounded-lg p-3 relative">
                  {/* Simular burbuja de WhatsApp */}
                  <div className="bg-[#dcf8c6] rounded-lg p-3 shadow-sm max-w-[95%] ml-auto">
                    <p className="text-[13px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {previewMessage}
                    </p>
                    <p className="text-[10px] text-slate-500 text-right mt-1">
                      {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={handleCopyMessage}>
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? 'Copiado' : 'Copiar mensaje'}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Botón de envío fijo abajo */}
          <div style={{ flexShrink: 0, paddingTop: '12px', borderTop: '1px solid hsl(var(--border))', marginTop: '8px' }}>
            {sent ? (
              <div className="flex items-center justify-center gap-2 py-3 text-green-600 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                ¡Notificación registrada!
              </div>
            ) : channel === 'whatsapp' ? (
              <Button 
                onClick={handleSendWhatsApp} 
                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                disabled={!selectedOrder || !client?.phone}
              >
                <MessageCircle className="w-4 h-4" />
                Abrir WhatsApp y Enviar
                <ExternalLink className="w-3 h-3" />
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  {channel === 'llamada' ? 'Registrar que se realizó la llamada' :
                   channel === 'sms' ? 'Registrar que se envió el SMS' :
                   'Registrar que se envió el email'}
                </p>
                <Button 
                  onClick={handleRegisterOtherChannel} 
                  className="w-full gap-2"
                  disabled={!selectedOrder}
                >
                  <Check className="w-4 h-4" />
                  Registrar como Enviado
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ COMPONENTE PRINCIPAL ============
export function CustomerNotifications() {
  const { customerNotifications, clients, workOrders, motorcycles, sendCustomerNotification } = useERP();
  const [activeTab, setActiveTab] = useState('pending');
  
  const pendingNotifications = customerNotifications.filter(n => n.status === 'pendiente');
  const sentNotifications = customerNotifications.filter(n => n.status === 'enviado');
  const confirmedNotifications = customerNotifications.filter(n => n.status === 'confirmado' || n.status === 'leido');
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Desconocido';
  };
  
  const getClientPhone = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.phone || '';
  };
  
  const getOrderNumber = (workOrderId?: string) => {
    if (!workOrderId) return '-';
    return workOrders.find(o => o.id === workOrderId)?.orderNumber || '-';
  };
  
  const getTypeConfig = (type: CustomerNotificationType) => {
    return NOTIFICATION_TYPES.find(t => t.id === type);
  };
  
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  
  // Re-enviar por WhatsApp una notificación pendiente
  const handleResendWhatsApp = (notificationId: string, clientId: string, message: string) => {
    const phone = getClientPhone(clientId);
    if (phone) {
      openWhatsApp(phone, message);
      sendCustomerNotification(notificationId, 'whatsapp');
    }
  };
  
  const NotificationList = ({ notifications }: { notifications: typeof customerNotifications }) => (
    <div className="space-y-3">
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No hay notificaciones</p>
        </div>
      ) : (
        notifications.map(notification => {
          const typeConfig = getTypeConfig(notification.type);
          const Icon = typeConfig?.icon || MessageSquare;
          
          return (
            <Card key={notification.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn("p-2 rounded-lg bg-muted flex-shrink-0", typeConfig?.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{typeConfig?.label || notification.type}</p>
                        <Badge variant="outline" className={cn("text-xs",
                          notification.channel === 'whatsapp' && 'bg-green-50 text-green-700 border-green-200'
                        )}>
                          {notification.channel === 'whatsapp' && <MessageCircle className="w-3 h-3 mr-1" />}
                          {notification.channel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getClientName(notification.clientId)} — Orden: {getOrderNumber(notification.workOrderId)}
                      </p>
                      <p className="text-sm mt-2 line-clamp-2 text-slate-600">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.createdAt)}
                        {notification.sentAt && ` — Enviado: ${formatDate(notification.sentAt)}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge className={cn("text-xs",
                      notification.status === 'confirmado' ? 'bg-green-100 text-green-700' : 
                      notification.status === 'enviado' ? 'bg-blue-100 text-blue-700' :
                      notification.status === 'leido' ? 'bg-teal-100 text-teal-700' :
                      'bg-yellow-100 text-yellow-700'
                    )}>
                      {notification.status === 'confirmado' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {notification.status === 'enviado' && <Send className="w-3 h-3 mr-1" />}
                      {notification.status === 'pendiente' && <Clock className="w-3 h-3 mr-1" />}
                      {notification.status}
                    </Badge>
                    
                    {notification.status === 'pendiente' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 gap-1"
                        onClick={() => handleResendWhatsApp(notification.id, notification.clientId, notification.message)}
                      >
                        <MessageCircle className="w-3 h-3" />
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            Notificaciones a Clientes
          </h2>
          <p className="text-muted-foreground">Envía mensajes de WhatsApp a tus clientes</p>
        </div>
        <SendNotificationDialog />
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingNotifications.length}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{sentNotifications.length}</p>
                <p className="text-xs text-muted-foreground">Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{confirmedNotifications.length}</p>
                <p className="text-xs text-muted-foreground">Confirmadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{customerNotifications.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
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
          <NotificationList notifications={[...customerNotifications].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
