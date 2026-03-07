import { useState, useRef } from 'react';
import { useERP } from '@/context/ERPContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Camera, X, Plus, AlertCircle, 
  CheckCircle2, AlertTriangle, Circle, Eraser, Pen
} from 'lucide-react';
import type { DamageType, DamageLocation, MotorcycleDamage } from '@/types';

// Tipos de daño
const DAMAGE_TYPES: { id: DamageType; label: string; color: string }[] = [
  { id: 'ralladura', label: 'Ralladura', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'golpe', label: 'Golpe', color: 'bg-orange-100 text-orange-700' },
  { id: 'abolladura', label: 'Abolladura', color: 'bg-red-100 text-red-700' },
  { id: 'rayon', label: 'Rayón', color: 'bg-blue-100 text-blue-700' },
  { id: 'falta_pieza', label: 'Falta Pieza', color: 'bg-purple-100 text-purple-700' },
  { id: 'otro', label: 'Otro', color: 'bg-slate-100 text-slate-700' },
];

// Ubicaciones de daño
const DAMAGE_LOCATIONS: { id: DamageLocation; label: string }[] = [
  { id: 'tanque', label: 'Tanque' },
  { id: 'guardabarros_delantero', label: 'Guardabarros Delantero' },
  { id: 'guardabarros_trasero', label: 'Guardabarros Trasero' },
  { id: 'carenado_izquierdo', label: 'Carenado Izquierdo' },
  { id: 'carenado_derecho', label: 'Carenado Derecho' },
  { id: 'colin', label: 'Colín' },
  { id: 'escape', label: 'Escape' },
  { id: 'llanta_delantera', label: 'Llanta Delantera' },
  { id: 'llanta_trasera', label: 'Llanta Trasera' },
  { id: 'rin_delantero', label: 'Rin Delantero' },
  { id: 'rin_trasero', label: 'Rin Trasero' },
  { id: 'manubrio', label: 'Manubrio' },
  { id: 'farola', label: 'Farola' },
  { id: 'stop', label: 'Stop' },
  { id: 'motor', label: 'Motor' },
  { id: 'chasis', label: 'Chasis' },
  { id: 'otro', label: 'Otro' },
];

// Condiciones generales
const CONDITIONS = [
  { id: 'excelente', label: 'Excelente', color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'bueno', label: 'Bueno', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'regular', label: 'Regular', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { id: 'malo', label: 'Malo', color: 'bg-red-100 text-red-700 border-red-300' },
] as const;

interface MotorcycleInspectionFormProps {
  motorcycleId: string;
  workOrderId?: string;
  initialMileage?: number;
  inspectedBy: string;
  onInspectionComplete?: (inspectionId: string) => void;
  onMileageChange?: (mileage: number) => void;
}

export function MotorcycleInspectionForm({ 
  motorcycleId, 
  workOrderId,
  initialMileage = 0,
  inspectedBy,
  onInspectionComplete,
  onMileageChange 
}: MotorcycleInspectionFormProps) {
  const { addInspection } = useERP();
  const [mileage, setMileage] = useState(initialMileage);
  const [generalCondition, setGeneralCondition] = useState<'excelente' | 'bueno' | 'regular' | 'malo'>('bueno');
  const [damages, setDamages] = useState<MotorcycleDamage[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [clientAcknowledged, setClientAcknowledged] = useState(false);
  const [clientSignature, setClientSignature] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Estado para nuevo daño
  const [newDamage, setNewDamage] = useState<Partial<MotorcycleDamage>>({
    type: 'ralladura',
    location: 'tanque',
    description: '',
    severity: 'leve',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Funciones para la firma digital
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };
  
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setClientSignature(canvas.toDataURL());
    }
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setClientSignature('');
    }
  };
  
  const handleMileageChange = (value: number) => {
    setMileage(value);
    onMileageChange?.(value);
  };
  
  const handleAddDamage = () => {
    if (!newDamage.description) return;
    
    const damage: MotorcycleDamage = {
      id: `damage_${Date.now()}`,
      type: newDamage.type as DamageType,
      location: newDamage.location as DamageLocation,
      description: newDamage.description,
      severity: newDamage.severity as 'leve' | 'moderado' | 'grave',
    };
    
    setDamages([...damages, damage]);
    setNewDamage({
      type: 'ralladura',
      location: 'tanque',
      description: '',
      severity: 'leve',
    });
  };
  
  const handleRemoveDamage = (id: string) => {
    setDamages(damages.filter(d => d.id !== id));
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // Limitar a 5 fotos
    const remainingSlots = 5 - photos.length;
    const filesToProcess = Math.min(files.length, remainingSlots);
    
    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    const inspectionId = await addInspection({
      motorcycleId,
      workOrderId,
      generalCondition,
      damages,
      photos,
      notes,
      mileageAtInspection: mileage,
      inspectedBy,
      clientAcknowledged,
      clientSignature: clientSignature || undefined,
    });
    
    onInspectionComplete?.(inspectionId);
  };
  
  const getDamageTypeLabel = (type: DamageType) => DAMAGE_TYPES.find(d => d.id === type)?.label || type;
  const getDamageLocationLabel = (location: DamageLocation) => DAMAGE_LOCATIONS.find(l => l.id === location)?.label || location;
  
  return (
    <div className="space-y-6">
      {/* Kilometraje */}
      <div className="space-y-2">
        <Label htmlFor="mileage">Kilometraje actual *</Label>
        <Input
          id="mileage"
          type="number"
          value={mileage}
          onChange={(e) => handleMileageChange(parseInt(e.target.value) || 0)}
          placeholder="Ingrese el kilometraje"
        />
        <p className="text-xs text-muted-foreground">
          Este kilometraje se registrará para la orden de trabajo
        </p>
      </div>
      
      {/* Condición General */}
      <div className="space-y-2">
        <Label>Condición General de la Moto</Label>
        <div className="grid grid-cols-4 gap-2">
          {CONDITIONS.map((condition) => (
            <Button
              key={condition.id}
              type="button"
              variant={generalCondition === condition.id ? 'default' : 'outline'}
              className={`text-xs ${generalCondition === condition.id ? '' : condition.color}`}
              onClick={() => setGeneralCondition(condition.id)}
            >
              {condition.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Fotos */}
      <div className="space-y-2">
        <Label>Fotos de la Moto (máx. 5)</Label>
        <div className="grid grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square">
              <img 
                src={photo} 
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {photos.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Camera className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Agregar</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <p className="text-xs text-muted-foreground">
          Sube fotos del estado actual de la moto (daños, condición general, etc.)
        </p>
      </div>
      
      {/* Registro de Daños */}
      <div className="space-y-3">
        <Label>Daños o Defectos Encontrados</Label>
        
        {/* Formulario para agregar daño */}
        <Card className="bg-muted/50">
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Tipo</Label>
                <select
                  value={newDamage.type}
                  onChange={(e) => setNewDamage({ ...newDamage, type: e.target.value as DamageType })}
                  className="w-full h-9 px-2 text-sm border rounded-md"
                >
                  {DAMAGE_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Ubicación</Label>
                <select
                  value={newDamage.location}
                  onChange={(e) => setNewDamage({ ...newDamage, location: e.target.value as DamageLocation })}
                  className="w-full h-9 px-2 text-sm border rounded-md"
                >
                  {DAMAGE_LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Descripción</Label>
              <Input
                value={newDamage.description}
                onChange={(e) => setNewDamage({ ...newDamage, description: e.target.value })}
                placeholder="Describe el daño..."
                className="text-sm"
              />
            </div>
            
            <div>
              <Label className="text-xs">Severidad</Label>
              <div className="flex gap-2">
                {['leve', 'moderado', 'grave'].map((severity) => (
                  <Button
                    key={severity}
                    type="button"
                    size="sm"
                    variant={newDamage.severity === severity ? 'default' : 'outline'}
                    className="text-xs flex-1 capitalize"
                    onClick={() => setNewDamage({ ...newDamage, severity: severity as 'leve' | 'moderado' | 'grave' })}
                  >
                    {severity === 'leve' && <Circle className="w-3 h-3 mr-1" />}
                    {severity === 'moderado' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {severity === 'grave' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {severity}
                  </Button>
                ))}
              </div>
            </div>
            
            <Button 
              type="button" 
              size="sm" 
              className="w-full"
              onClick={handleAddDamage}
              disabled={!newDamage.description}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Daño
            </Button>
          </CardContent>
        </Card>
        
        {/* Lista de daños registrados */}
        {damages.length > 0 && (
          <ScrollArea className="h-40 border rounded-md p-2">
            <div className="space-y-2">
              {damages.map((damage) => (
                <div 
                  key={damage.id} 
                  className="flex items-start justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={DAMAGE_TYPES.find(t => t.id === damage.type)?.color || ''}>
                        {getDamageTypeLabel(damage.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getDamageLocationLabel(damage.location)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{damage.description}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs mt-1 ${
                        damage.severity === 'grave' ? 'border-red-300 text-red-600' :
                        damage.severity === 'moderado' ? 'border-yellow-300 text-yellow-600' :
                        'border-green-300 text-green-600'
                      }`}
                    >
                      {damage.severity}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDamage(damage.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      
      {/* Observaciones */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observaciones Adicionales</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Cualquier otra observación sobre el estado de la moto..."
          rows={3}
        />
      </div>
      
      {/* Firma Digital del Cliente */}
      <div className="space-y-3 border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Pen className="w-4 h-4" />
            Firma del Cliente
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={!clientSignature}
          >
            <Eraser className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            className="w-full touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          El cliente debe firmar en el área de arriba para confirmar los daños registrados
        </p>
        
        {clientSignature && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Firma registrada correctamente</span>
          </div>
        )}
      </div>
      
      {/* Confirmación del cliente */}
      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <input
          type="checkbox"
          id="clientAck"
          checked={clientAcknowledged}
          onChange={(e) => setClientAcknowledged(e.target.checked)}
          className="mt-1"
        />
        <Label htmlFor="clientAck" className="text-sm font-normal cursor-pointer">
          <span className="font-medium">El cliente ha sido informado</span> y reconoce el estado actual 
          de su motocicleta, incluyendo los daños y defectos registrados.
        </Label>
      </div>
      
      {/* Resumen */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-2">Resumen de la Inspección</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kilometraje:</span>
            <span>{mileage.toLocaleString()} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Condición:</span>
            <span className="capitalize">{generalCondition}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Daños registrados:</span>
            <span>{damages.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fotos:</span>
            <span>{photos.length}/5</span>
          </div>
        </div>
      </div>
      
      {/* Botón de guardar */}
      <Button 
        type="button"
        className="w-full"
        onClick={handleSubmit}
        disabled={mileage <= 0}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Guardar Inspección
      </Button>
      
      {mileage <= 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {'• Se requiere el kilometraje para guardar la inspección'}
          {!clientAcknowledged && ' • Debe confirmar que el cliente fue informado'}
          {mileage <= 0 && ' • Ingrese el kilometraje'}
        </p>
      )}
    </div>
  );
}

export default MotorcycleInspectionForm;
