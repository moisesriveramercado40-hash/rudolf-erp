import { useState } from 'react';
import { useERP } from '@/context/ERPContext';
import { useAuth } from '@/context/AuthContext';
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
import { 
  Search, Plus, ShoppingCart, Eye, 
  DollarSign, CheckCircle, X
} from 'lucide-react';
import type { Part, Sale } from '@/types';

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
];

export function VentasPage() {
  const { sales, parts, warehouses, clients, addSale } = useERP();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // New sale state
  const [cart, setCart] = useState<{ part: Part; quantity: number }[]>([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin'>('efectivo');
  const [selectedClientId, setSelectedClientId] = useState('');

  const filteredSales = sales.filter(sale => 
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.clientName && sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const getWarehouseName = (id: string) => {
    return warehouses.find(w => w.id === id)?.name || 'Desconocido';
  };

  const getPartName = (id: string) => {
    return parts.find(p => p.id === id)?.name || 'Desconocido';
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.part.salePrice * item.quantity), 0);

  const addToCart = () => {
    if (!selectedPartId || quantity < 1) return;
    const part = parts.find(p => p.id === selectedPartId);
    if (!part) return;
    
    const existingItem = cart.find(item => item.part.id === selectedPartId);
    if (existingItem) {
      setCart(cart.map(item => 
        item.part.id === selectedPartId 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { part, quantity }]);
    }
    
    setSelectedPartId('');
    setQuantity(1);
  };

  const removeFromCart = (partId: string) => {
    setCart(cart.filter(item => item.part.id !== partId));
  };

  const handleCompleteSale = () => {
    if (cart.length === 0 || !user) return;
    
    const saleItems = cart.map(item => ({
      partId: item.part.id,
      quantity: item.quantity,
      unitPrice: item.part.salePrice,
      totalPrice: item.part.salePrice * item.quantity,
    }));

    addSale({
      clientId: selectedClientId || undefined,
      clientName: selectedClientId ? undefined : 'Cliente General',
      items: saleItems,
      subtotal: cartTotal,
      tax: 0,
      discount: 0,
      total: cartTotal,
      paymentMethod,
      isPaid: true,
      soldBy: user.id,
      warehouseId: selectedWarehouse || warehouses[0]?.id || '',
    });

    setShowNewSaleDialog(false);
    setCart([]);
    setSelectedClientId('');
    setPaymentMethod('efectivo');
  };

  const openView = (sale: Sale) => {
    setSelectedSale(sale);
    setShowViewDialog(true);
  };

  // Filtrar partes por almacén seleccionado
  const availableParts = selectedWarehouse 
    ? parts.filter(p => p.warehouseId === selectedWarehouse && p.stock > 0)
    : parts.filter(p => p.stock > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ventas de Repuestos</h1>
          <p className="text-slate-500">Registro de ventas y transacciones</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowNewSaleDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Venta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Ventas Hoy"
          value={sales.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length.toString()}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Hoy"
          value={formatCurrency(sales
            .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
            .reduce((sum, s) => sum + s.total, 0)
          )}
          icon={DollarSign}
        />
        <StatCard
          title="Total Ventas"
          value={sales.length.toString()}
          icon={CheckCircle}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por número de venta o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No se encontraron ventas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <p className="font-medium">{sale.saleNumber}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(sale.createdAt).toLocaleDateString('es-PE')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {sale.clientId 
                            ? clients.find(c => c.id === sale.clientId)?.firstName + ' ' + clients.find(c => c.id === sale.clientId)?.lastName
                            : sale.clientName || 'Cliente General'
                          }
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sale.items.length} productos</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(sale.total)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PAYMENT_METHODS.find(p => p.value === sale.paymentMethod)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openView(sale)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Sale Dialog */}
      <Dialog open={showNewSaleDialog} onOpenChange={setShowNewSaleDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Nueva Venta</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Product Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Almacén</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cliente (Opcional)</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cliente general" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cliente General</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Producto</Label>
                <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParts.map(part => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.name} - Stock: {part.stock} - {formatCurrency(part.salePrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cantidad</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                  />
                  <Button onClick={addToCart} disabled={!selectedPartId}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column - Cart */}
            <div className="space-y-4">
              <h3 className="font-medium">Carrito</h3>
              <div className="border rounded-lg p-4 space-y-2 min-h-[200px]">
                {cart.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Agrega productos al carrito</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.part.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{item.part.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} x {formatCurrency(item.part.salePrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(item.part.salePrice * item.quantity)}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.part.id)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSaleDialog(false)}>Cancelar</Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600" 
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Completar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{selectedSale.saleNumber}</h3>
                <Badge variant="outline">
                  {PAYMENT_METHODS.find(p => p.value === selectedSale.paymentMethod)?.label}
                </Badge>
              </div>
              
              <div className="text-sm">
                <p className="text-slate-500">Fecha</p>
                <p>{new Date(selectedSale.createdAt).toLocaleString('es-PE')}</p>
              </div>

              <div className="text-sm">
                <p className="text-slate-500">Almacén</p>
                <p>{getWarehouseName(selectedSale.warehouseId)}</p>
              </div>

              <div>
                <p className="text-slate-500 text-sm mb-2">Productos</p>
                <div className="space-y-2">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm">{getPartName(item.partId)} x {item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { 
  title: string; 
  value: string; 
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
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
