import { useState } from 'react';
import { useERP } from '@/context/ERPContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Bike, Plus, Search, Edit, Trash2, Eye, Gauge
} from 'lucide-react';
import type { Motorcycle } from '@/types';

export function MotosPage() {
  const { motorcycles, clients, addMotorcycle, updateMotorcycle, deleteMotorcycle } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMoto, setSelectedMoto] = useState<Motorcycle | null>(null);
  
  const [formData, setFormData] = useState({
    clientId: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    plate: '',
    color: '',
    vin: '',
    mileage: 0,
    notes: '',
  });

  const filteredMotorcycles = motorcycles.filter(moto => 
    moto.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    moto.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    moto.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClientName(moto.clientId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Cliente no encontrado';
  };

  const handleAdd = () => {
    addMotorcycle(formData);
    setShowAddDialog(false);
    setFormData({
      clientId: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      color: '',
      vin: '',
      mileage: 0,
      notes: '',
    });
  };

  const handleEdit = () => {
    if (selectedMoto) {
      updateMotorcycle(selectedMoto.id, formData);
      setShowEditDialog(false);
    }
  };

  const openEdit = (moto: Motorcycle) => {
    setSelectedMoto(moto);
    setFormData({
      clientId: moto.clientId,
      brand: moto.brand,
      model: moto.model,
      year: moto.year,
      plate: moto.plate || '',
      color: moto.color || '',
      vin: moto.vin || '',
      mileage: moto.mileage,
      notes: moto.notes || '',
    });
    setShowEditDialog(true);
  };

  const openView = (moto: Motorcycle) => {
    setSelectedMoto(moto);
    setShowViewDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Motos</h1>
          <p className="text-slate-500">Registro de vehículos de los clientes</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Registrar Moto
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por marca, modelo, placa o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Motorcycles Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Kilometraje</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMotorcycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No se encontraron motos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMotorcycles.map((moto) => (
                    <TableRow key={moto.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Bike className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">{moto.brand} {moto.model}</p>
                            <p className="text-xs text-slate-500">{moto.year} • {moto.color || 'Sin color'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{getClientName(moto.clientId)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{moto.plate || 'S/P'}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm flex items-center gap-1">
                          <Gauge className="w-4 h-4 text-slate-400" />
                          {moto.mileage.toLocaleString()} km
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openView(moto)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(moto)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar motocicleta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente la motocicleta {moto.brand} {moto.model} ({moto.plate}).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMotorcycle(moto.id)} className="bg-red-600 hover:bg-red-700">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Moto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Propietario</Label>
              <Select value={formData.clientId} onValueChange={v => setFormData({...formData, clientId: v})}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input 
                  value={formData.brand}
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                  placeholder="Ej: Honda"
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input 
                  value={formData.model}
                  onChange={e => setFormData({...formData, model: e.target.value})}
                  placeholder="Ej: CG 125"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Año</Label>
                <Input 
                  type="number"
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Placa</Label>
                <Input 
                  value={formData.plate}
                  onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                  placeholder="ABC-123"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input 
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Kilometraje</Label>
                <Input 
                  type="number"
                  value={formData.mileage}
                  onChange={e => setFormData({...formData, mileage: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Número de Serie (VIN)</Label>
              <Input 
                value={formData.vin}
                onChange={e => setFormData({...formData, vin: e.target.value})}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Observaciones adicionales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleAdd}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de la Moto</DialogTitle>
          </DialogHeader>
          {selectedMoto && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Bike className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedMoto.brand} {selectedMoto.model}</h3>
                  <p className="text-slate-500">{selectedMoto.year}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Placa</p>
                  <p className="font-medium">{selectedMoto.plate || 'Sin placa'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Color</p>
                  <p className="font-medium">{selectedMoto.color || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Kilometraje</p>
                  <p className="font-medium">{selectedMoto.mileage.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">VIN</p>
                  <p className="font-medium text-xs">{selectedMoto.vin || 'No registrado'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-slate-500">Propietario</p>
                <p className="font-medium">{getClientName(selectedMoto.clientId)}</p>
              </div>

              {selectedMoto.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notas</p>
                  <p className="text-sm bg-slate-50 p-3 rounded-lg mt-1">{selectedMoto.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Moto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Año</Label>
                <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Placa</Label>
                <Input value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Kilometraje</Label>
                <Input type="number" value={formData.mileage} onChange={e => setFormData({...formData, mileage: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
