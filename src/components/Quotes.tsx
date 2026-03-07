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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Send, CheckCircle2, XCircle, Clock,
  Calendar, ArrowRight, Printer, Trash2
} from 'lucide-react';
import type { Quote, QuoteStatus, WorkType } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Estados de cotización
const QUOTE_STATUSES: { id: QuoteStatus; label: string; color: string }[] = [
  { id: 'borrador', label: 'Borrador', color: 'bg-slate-500' },
  { id: 'enviada', label: 'Enviada', color: 'bg-blue-500' },
  { id: 'aprobada', label: 'Aprobada', color: 'bg-green-500' },
  { id: 'rechazada', label: 'Rechazada', color: 'bg-red-500' },
  { id: 'expirada', label: 'Expirada', color: 'bg-orange-500' },
  { id: 'convertida', label: 'Convertida', color: 'bg-emerald-600' },
];

// Tipos de trabajo
const WORK_TYPES: { id: WorkType; label: string }[] = [
  { id: 'mantenimiento', label: 'Mantenimiento' },
  { id: 'reparacion', label: 'Reparación' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'modificacion', label: 'Modificación' },
  { id: 'garantia', label: 'Garantía' },
];

// Diálogo para nueva cotización
function NewQuoteDialog() {
  const { addQuote, clients, getMotorcyclesByClient, getActivePolicies } = useERP();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    clientId: '',
    motorcycleId: '',
    workType: 'mantenimiento' as WorkType,
    description: '',
    diagnosis: '',
    laborItems: [{ id: '1', description: '', hours: 1, ratePerHour: 80, total: 80 }],
    partsItems: [] as { id: string; partId?: string; description: string; quantity: number; unitPrice: number; total: number; isAvailable: boolean }[],
    estimatedHours: 1,
    estimatedDays: 1,
    validDays: 7,
    policiesAcknowledged: false,
    timeEstimateAcknowledged: false,
  });
  
  const selectedClient = clients.find(c => c.id === formData.clientId);
  const clientMotorcycles = selectedClient ? getMotorcyclesByClient(selectedClient.id) : [];
  const activePolicies = getActivePolicies();
  
  const calculateTotals = () => {
    const laborTotal = formData.laborItems.reduce((sum, item) => sum + item.total, 0);
    const partsTotal = formData.partsItems.reduce((sum, item) => sum + item.total, 0);
    return { subtotal: laborTotal + partsTotal, laborTotal, partsTotal };
  };
  
  const addLaborItem = () => {
    const newId = String(formData.laborItems.length + 1);
    setFormData({
      ...formData,
      laborItems: [...formData.laborItems, { id: newId, description: '', hours: 1, ratePerHour: 80, total: 80 }],
    });
  };
  
  const updateLaborItem = (id: string, field: string, value: string | number) => {
    setFormData({
      ...formData,
      laborItems: formData.laborItems.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'hours' || field === 'ratePerHour') {
          updated.total = updated.hours * updated.ratePerHour;
        }
        return updated;
      }),
    });
  };
  
  const addPartItem = () => {
    const newId = String(formData.partsItems.length + 1);
    setFormData({
      ...formData,
      partsItems: [...formData.partsItems, { id: newId, description: '', quantity: 1, unitPrice: 0, total: 0, isAvailable: true }],
    });
  };
  
  const updatePartItem = (id: string, field: string, value: string | number | boolean) => {
    setFormData({
      ...formData,
      partsItems: formData.partsItems.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }),
    });
  };
  
  const handleSubmit = () => {
    const { subtotal } = calculateTotals();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + formData.validDays);
    
    addQuote({
      clientId: formData.clientId,
      motorcycleId: formData.motorcycleId,
      description: formData.description,
      diagnosis: formData.diagnosis,
      workType: formData.workType,
      laborItems: formData.laborItems,
      partsItems: formData.partsItems,
      subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
      estimatedHours: formData.estimatedHours,
      estimatedDays: formData.estimatedDays,
      validUntil,
      status: 'borrador',
      policiesAcknowledged: formData.policiesAcknowledged,
      timeEstimateAcknowledged: formData.timeEstimateAcknowledged,
      createdBy: user?.id || '',
    });
    
    setIsOpen(false);
    setStep(1);
    setFormData({
      clientId: '',
      motorcycleId: '',
      workType: 'mantenimiento',
      description: '',
      diagnosis: '',
      laborItems: [{ id: '1', description: '', hours: 1, ratePerHour: 80, total: 80 }],
      partsItems: [],
      estimatedHours: 1,
      estimatedDays: 1,
      validDays: 7,
      policiesAcknowledged: false,
      timeEstimateAcknowledged: false,
    });
  };
  
  const { subtotal } = calculateTotals();
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Nueva Cotización - Paso {step} de 3</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-1">
            {/* Paso 1: Información básica */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select 
                    value={formData.clientId} 
                    onValueChange={(v) => setFormData({ ...formData, clientId: v, motorcycleId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.firstName} {client.lastName} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedClient && (
                  <div className="space-y-2">
                    <Label>Moto</Label>
                    <Select 
                      value={formData.motorcycleId} 
                      onValueChange={(v) => setFormData({ ...formData, motorcycleId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moto" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientMotorcycles.map(moto => (
                          <SelectItem key={moto.id} value={moto.id}>
                            {moto.brand} {moto.model} - {moto.plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Tipo de Trabajo *</Label>
                  <Select 
                    value={formData.workType} 
                    onValueChange={(v) => setFormData({ ...formData, workType: v as WorkType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Descripción del Trabajo *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describa el trabajo a realizar..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Diagnóstico (opcional)</Label>
                  <Textarea
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="Diagnóstico preliminar..."
                    rows={2}
                  />
                </div>
              </>
            )}
            
            {/* Paso 2: Items y costos */}
            {step === 2 && (
              <>
                {/* Mano de obra */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Mano de Obra</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLaborItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  {formData.laborItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input
                          value={item.description}
                          onChange={(e) => updateLaborItem(item.id, 'description', e.target.value)}
                          placeholder="Descripción"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.hours}
                          onChange={(e) => updateLaborItem(item.id, 'hours', parseFloat(e.target.value) || 0)}
                          placeholder="Horas"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.ratePerHour}
                          onChange={(e) => updateLaborItem(item.id, 'ratePerHour', parseFloat(e.target.value) || 0)}
                          placeholder="S/hora"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input value={`S/ ${item.total.toFixed(2)}`} disabled />
                      </div>
                      <div className="col-span-1">
                        {index > 0 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setFormData({
                              ...formData,
                              laborItems: formData.laborItems.filter(i => i.id !== item.id)
                            })}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Repuestos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Repuestos</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPartItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                  {formData.partsItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Input
                          value={item.description}
                          onChange={(e) => updatePartItem(item.id, 'description', e.target.value)}
                          placeholder="Descripción del repuesto"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updatePartItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Cant"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updatePartItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="Precio"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input value={`S/ ${item.total.toFixed(2)}`} disabled />
                      </div>
                      <div className="col-span-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setFormData({
                            ...formData,
                            partsItems: formData.partsItems.filter(i => i.id !== item.id)
                          })}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Tiempos */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Horas Estimadas</Label>
                    <Input
                      type="number"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Días Estimados</Label>
                    <Input
                      type="number"
                      value={formData.estimatedDays}
                      onChange={(e) => setFormData({ ...formData, estimatedDays: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Válida por (días)</Label>
                    <Input
                      type="number"
                      value={formData.validDays}
                      onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) || 7 })}
                    />
                  </div>
                </div>
                
                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total Estimado:</span>
                    <span className="text-2xl font-bold">S/ {subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
            
            {/* Paso 3: Políticas */}
            {step === 3 && (
              <>
                <div className="space-y-4">
                  <h4 className="font-medium">Políticas del Negocio</h4>
                  <ScrollArea className="h-48 border rounded-md p-3">
                    <div className="space-y-2">
                      {activePolicies.map(policy => (
                        <div key={policy.id} className="text-sm">
                          <p className="font-medium">{policy.title}</p>
                          <p className="text-muted-foreground">{policy.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="policies"
                      checked={formData.policiesAcknowledged}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, policiesAcknowledged: checked as boolean })
                      }
                    />
                    <Label htmlFor="policies" className="text-sm font-normal">
                      El cliente ha sido informado y acepta las políticas del negocio
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="timeEstimate"
                      checked={formData.timeEstimateAcknowledged}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, timeEstimateAcknowledged: checked as boolean })
                      }
                    />
                    <Label htmlFor="timeEstimate" className="text-sm font-normal">
                      El cliente ha sido informado del tiempo estimado de {formData.estimatedDays} días
                    </Label>
                  </div>
                </div>
                
                {/* Resumen */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Resumen de la Cotización</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Cliente:</span> {selectedClient?.firstName} {selectedClient?.lastName}</p>
                    <p><span className="text-muted-foreground">Trabajo:</span> {formData.description.substring(0, 50)}...</p>
                    <p><span className="text-muted-foreground">Tiempo estimado:</span> {formData.estimatedDays} días</p>
                    <p><span className="text-muted-foreground">Total:</span> S/ {subtotal.toFixed(2)}</p>
                    <p><span className="text-muted-foreground">Válida hasta:</span> {new Date(Date.now() + formData.validDays * 86400000).toLocaleDateString()}</p>
                  </div>
                </div>
              </>
            )}
            
            {/* Navegación */}
            <div className="flex justify-between pt-4">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  Anterior
                </Button>
              )}
              {step < 3 ? (
                <Button 
                  type="button" 
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!formData.clientId || !formData.description)}
                  className="ml-auto"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={!formData.policiesAcknowledged || !formData.timeEstimateAcknowledged}
                  className="ml-auto"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Crear Cotización
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Componente para imprimir cotización
function PrintQuoteView({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const { clients, getMotorcyclesByClient, getActivePolicies } = useERP();
  const client = clients.find(c => c.id === quote.clientId);
  const motorcycle = getMotorcyclesByClient(quote.clientId).find(m => m.id === quote.motorcycleId);
  const activePolicies = getActivePolicies();
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista de Impresión - {quote.quoteNumber}</span>
            <Button onClick={handlePrint} className="print:hidden">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div id="printable-quote" className="p-8 space-y-6 bg-white">
            {/* Encabezado */}
            <div className="text-center border-b pb-4">
              <h1 className="text-3xl font-bold text-primary">RUDOLF</h1>
              <p className="text-lg text-muted-foreground">Taller de Motos</p>
              <p className="text-sm text-muted-foreground">Cotización / Presupuesto</p>
            </div>
            
            {/* Info de cotización */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">N° Cotización</p>
                <p className="font-bold text-lg">{quote.quoteNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de emisión</p>
                <p className="font-medium">{quote.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Válida hasta</p>
                <p className="font-medium">{quote.validUntil.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className={QUOTE_STATUSES.find(s => s.id === quote.status)?.color}>
                  {QUOTE_STATUSES.find(s => s.id === quote.status)?.label}
                </Badge>
              </div>
            </div>
            
            {/* Cliente */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Cliente</h3>
              <p className="font-medium">{client?.firstName} {client?.lastName}</p>
              <p className="text-sm text-muted-foreground">Tel: {client?.phone}</p>
              {client?.email && <p className="text-sm text-muted-foreground">Email: {client.email}</p>}
            </div>
            
            {/* Moto */}
            {motorcycle && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Vehículo</h3>
                <p className="font-medium">{motorcycle.brand} {motorcycle.model} ({motorcycle.year})</p>
                <p className="text-sm text-muted-foreground">Placa: {motorcycle.plate}</p>
                <p className="text-sm text-muted-foreground">Kilometraje: {motorcycle.mileage.toLocaleString()} km</p>
              </div>
            )}
            
            {/* Descripción del trabajo */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Descripción del Trabajo</h3>
              <p className="text-sm">{quote.description}</p>
              {quote.diagnosis && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-muted-foreground">Diagnóstico:</p>
                  <p className="text-sm">{quote.diagnosis}</p>
                </div>
              )}
            </div>
            
            {/* Mano de Obra */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Mano de Obra</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Descripción</th>
                    <th className="text-center py-2">Horas</th>
                    <th className="text-right py-2">Precio/Hora</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.laborItems.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="text-center py-2">{item.hours}</td>
                      <td className="text-right py-2">S/ {item.ratePerHour.toFixed(2)}</td>
                      <td className="text-right py-2">S/ {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Repuestos */}
            {quote.partsItems.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Repuestos</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Descripción</th>
                      <th className="text-center py-2">Cant.</th>
                      <th className="text-right py-2">P. Unit.</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.partsItems.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.description}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">S/ {item.unitPrice.toFixed(2)}</td>
                        <td className="text-right py-2">S/ {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Totales */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>S/ {quote.subtotal.toFixed(2)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento:</span>
                  <span>- S/ {quote.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t">
                <span>TOTAL:</span>
                <span>S/ {quote.total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Tiempos */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Tiempo Estimado</h3>
              <p className="text-sm">{quote.estimatedDays} días hábiles ({quote.estimatedHours} horas de trabajo)</p>
            </div>
            
            {/* Políticas */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Políticas del Negocio</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                {activePolicies.map(policy => (
                  <p key={policy.id}><strong>{policy.title}:</strong> {policy.content}</p>
                ))}
              </div>
            </div>
            
            {/* Firma */}
            <div className="border-t pt-8 mt-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="border-t pt-2">
                    <p className="text-sm">Firma del Cliente</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t pt-2">
                    <p className="text-sm">Firma del Taller</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Tarjeta de cotización
function QuoteCard({ quote }: { quote: Quote }) {
  const { clients, getMotorcyclesByClient, updateQuoteStatus, convertQuoteToWorkOrder, deleteQuote } = useERP();
  const [showPrintView, setShowPrintView] = useState(false);
  const client = clients.find(c => c.id === quote.clientId);
  const motorcycle = getMotorcyclesByClient(quote.clientId).find(m => m.id === quote.motorcycleId);
  const statusInfo = QUOTE_STATUSES.find(s => s.id === quote.status);
  const isExpired = new Date() > quote.validUntil && quote.status !== 'convertida';
  
  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                {isExpired && quote.status !== 'convertida' && (
                  <Badge variant="destructive">Expirada</Badge>
                )}
              </div>
              
              <p className="font-medium text-lg">{quote.quoteNumber}</p>
              <p className="text-sm">{client?.firstName} {client?.lastName}</p>
              {motorcycle && (
                <p className="text-sm text-muted-foreground">
                  {motorcycle.brand} {motorcycle.model} - {motorcycle.plate}
                </p>
              )}
              
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {quote.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm mt-2">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {quote.estimatedDays} días
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Válida hasta: {quote.validUntil.toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <span className="text-lg font-bold">S/ {quote.total.toFixed(2)}</span>
                
                <div className="flex gap-1 flex-wrap justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowPrintView(true)}>
                    <Printer className="w-3 h-3 mr-1" />
                    Imprimir
                  </Button>
                  
                  {quote.status === 'borrador' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateQuoteStatus(quote.id, 'enviada')}>
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente la cotización {quote.quoteNumber}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteQuote(quote.id)} className="bg-red-600 hover:bg-red-700">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  {quote.status === 'enviada' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateQuoteStatus(quote.id, 'aprobada')}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateQuoteStatus(quote.id, 'rechazada')}>
                        <XCircle className="w-3 h-3 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  {quote.status === 'aprobada' && (
                    <Button size="sm" onClick={() => convertQuoteToWorkOrder(quote.id)}>
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Crear OT
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showPrintView && (
        <PrintQuoteView quote={quote} onClose={() => setShowPrintView(false)} />
      )}
    </>
  );
}

// Componente principal
export function Quotes() {
  const { quotes } = useERP();
  const [activeTab, setActiveTab] = useState('all');
  
  const draftQuotes = quotes.filter(q => q.status === 'borrador');
  const sentQuotes = quotes.filter(q => q.status === 'enviada');
  const approvedQuotes = quotes.filter(q => q.status === 'aprobada');
  const convertedQuotes = quotes.filter(q => q.status === 'convertida');
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cotizaciones</h2>
          <p className="text-muted-foreground">Gestiona presupuestos y estimados</p>
        </div>
        <NewQuoteDialog />
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{draftQuotes.length}</p>
            <p className="text-sm text-muted-foreground">Borradores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{sentQuotes.length}</p>
            <p className="text-sm text-muted-foreground">Enviadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{approvedQuotes.length}</p>
            <p className="text-sm text-muted-foreground">Aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{convertedQuotes.length}</p>
            <p className="text-sm text-muted-foreground">Convertidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              S/ {quotes.filter(q => q.status === 'aprobada' || q.status === 'convertida').reduce((sum, q) => sum + q.total, 0).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Valor Total</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="draft">
            Borradores
            {draftQuotes.length > 0 && <Badge variant="secondary" className="ml-2">{draftQuotes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent">Enviadas</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="converted">Convertidas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="space-y-3">
            {quotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay cotizaciones registradas
              </div>
            ) : (
              quotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="draft">
          <div className="space-y-3">
            {draftQuotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay borradores
              </div>
            ) : (
              draftQuotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sent">
          <div className="space-y-3">
            {sentQuotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay cotizaciones enviadas
              </div>
            ) : (
              sentQuotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="approved">
          <div className="space-y-3">
            {approvedQuotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay cotizaciones aprobadas
              </div>
            ) : (
              approvedQuotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="converted">
          <div className="space-y-3">
            {convertedQuotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay cotizaciones convertidas
              </div>
            ) : (
              convertedQuotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
