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
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, Plus, Package, Edit, Trash2, AlertTriangle,
  ArrowUpDown, Warehouse, TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Part } from '@/types';

export function InventarioPage() {
  const { parts, warehouses, addPart, updatePart, deletePart, updateStock } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [stockAmount, setStockAmount] = useState(0);
  const [stockType, setStockType] = useState<'entrada' | 'salida'>('entrada');
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    brand: '',
    stock: 0,
    minStock: 5,
    warehouseId: '',
    location: '',
    purchasePrice: 0,
    salePrice: 0,
    supplierId: '',
  });

  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showLowStock || part.stock <= part.minStock;
    return matchesSearch && matchesLowStock;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const getWarehouseName = (id: string) => {
    return warehouses.find(w => w.id === id)?.name || 'Desconocido';
  };

  const handleAdd = () => {
    addPart({
      ...formData,
      isActive: true,
    });
    setShowAddDialog(false);
    setFormData({
      sku: '', name: '', description: '', categoryId: '', brand: '',
      stock: 0, minStock: 5, warehouseId: '', location: '',
      purchasePrice: 0, salePrice: 0, supplierId: '',
    });
  };

  const handleEdit = () => {
    if (selectedPart) {
      updatePart(selectedPart.id, formData);
      setShowEditDialog(false);
    }
  };

  const handleStockUpdate = () => {
    if (selectedPart && stockAmount > 0) {
      updateStock(selectedPart.id, stockAmount, stockType);
      setShowStockDialog(false);
      setStockAmount(0);
    }
  };

  const openEdit = (part: Part) => {
    setSelectedPart(part);
    setFormData({
      sku: part.sku,
      name: part.name,
      description: part.description || '',
      categoryId: part.categoryId,
      brand: part.brand || '',
      stock: part.stock,
      minStock: part.minStock,
      warehouseId: part.warehouseId,
      location: part.location || '',
      purchasePrice: part.purchasePrice,
      salePrice: part.salePrice,
      supplierId: part.supplierId || '',
    });
    setShowEditDialog(true);
  };

  const openStock = (part: Part) => {
    setSelectedPart(part);
    setStockAmount(0);
    setShowStockDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventario de Repuestos</h1>
          <p className="text-slate-500">Gestión de stock y productos</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showLowStock ? 'default' : 'outline'} 
            onClick={() => setShowLowStock(!showLowStock)}
            className={cn(showLowStock && 'bg-red-500 hover:bg-red-600')}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Stock Bajo
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Productos"
          value={parts.length.toString()}
          icon={Package}
        />
        <StatCard
          title="Stock Bajo"
          value={parts.filter(p => p.stock <= p.minStock).length.toString()}
          icon={AlertTriangle}
          alert
        />
        <StatCard
          title="Valor Inventario"
          value={formatCurrency(parts.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0))}
          icon={TrendingDown}
        />
        <StatCard
          title="Almacenes"
          value={warehouses.length.toString()}
          icon={Warehouse}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, SKU o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Precio Compra</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{part.name}</p>
                          <p className="text-xs text-slate-500">SKU: {part.sku}</p>
                          {part.brand && <p className="text-xs text-slate-400">{part.brand}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={part.stock <= part.minStock ? 'destructive' : 'secondary'}
                        >
                          {part.stock} / {part.minStock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{getWarehouseName(part.warehouseId)}</p>
                        {part.location && <p className="text-xs text-slate-500">{part.location}</p>}
                      </TableCell>
                      <TableCell>{formatCurrency(part.purchasePrice)}</TableCell>
                      <TableCell>{formatCurrency(part.salePrice)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openStock(part)} title="Ajustar Stock">
                            <ArrowUpDown className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(part)}>
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
                                <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el producto "{part.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePart(part.id)} className="bg-red-600 hover:bg-red-700">
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
            <DialogTitle>Nuevo Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Almacén</Label>
                <Select value={formData.warehouseId} onValueChange={v => setFormData({...formData, warehouseId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock Inicial</Label>
                <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Stock Mínimo</Label>
                <Input type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Compra (S/)</Label>
                <Input type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Precio Venta (S/)</Label>
                <Input type="number" step="0.01" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleAdd}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Compra (S/)</Label>
                <Input type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Precio Venta (S/)</Label>
                <Input type="number" step="0.01" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              {selectedPart?.name} - Stock actual: {selectedPart?.stock}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select value={stockType} onValueChange={(v: 'entrada' | 'salida') => setStockType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (Compra/Devolución)</SelectItem>
                  <SelectItem value="salida">Salida (Venta/Ajuste)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input 
                type="number" 
                min="1"
                value={stockAmount} 
                onChange={e => setStockAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>Cancelar</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleStockUpdate}>
              Actualizar Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, alert }: { 
  title: string; 
  value: string; 
  icon: React.ElementType;
  alert?: boolean;
}) {
  return (
    <Card className={cn(alert && 'border-red-200')}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            alert ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
