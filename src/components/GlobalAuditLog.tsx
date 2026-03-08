import { useState, useMemo } from 'react';
import { useERP } from '@/context/ERPContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Filter, Calendar, Package, ShoppingCart, 
  Wrench, Users, FileText, Truck, Bell, Eye,
  ArrowUpDown, Plus, Minus, Edit, Trash2, CheckCircle
} from 'lucide-react';
import type { AuditEntry, InventoryMovement } from '@/types';

// Colores para tipos de entidad
const ENTITY_COLORS: Record<string, string> = {
  workorder: 'bg-blue-100 text-blue-700',
  task: 'bg-indigo-100 text-indigo-700',
  inventory: 'bg-orange-100 text-orange-700',
  sale: 'bg-green-100 text-green-700',
  client: 'bg-purple-100 text-purple-700',
  motorcycle: 'bg-cyan-100 text-cyan-700',
  quote: 'bg-pink-100 text-pink-700',
  thirdparty: 'bg-amber-100 text-amber-700',
  inspection: 'bg-teal-100 text-teal-700',
  notification: 'bg-rose-100 text-rose-700',
};

// Colores para acciones
const ACTION_COLORS: Record<string, string> = {
  // Órdenes
  created: 'bg-green-100 text-green-700',
  status_changed: 'bg-blue-100 text-blue-700',
  assigned: 'bg-purple-100 text-purple-700',
  modified: 'bg-yellow-100 text-yellow-700',
  // Tareas
  task_added: 'bg-green-100 text-green-700',
  task_updated: 'bg-blue-100 text-blue-700',
  task_deleted: 'bg-red-100 text-red-700',
  task_completed: 'bg-emerald-100 text-emerald-700',
  // Inventario
  stock_in: 'bg-green-100 text-green-700',
  stock_out: 'bg-orange-100 text-orange-700',
  stock_adjusted: 'bg-yellow-100 text-yellow-700',
  part_added: 'bg-green-100 text-green-700',
  part_updated: 'bg-blue-100 text-blue-700',
  part_deleted: 'bg-red-100 text-red-700',
  // Ventas
  sale_created: 'bg-green-100 text-green-700',
  sale_deleted: 'bg-red-100 text-red-700',
  // Clientes
  client_added: 'bg-green-100 text-green-700',
  client_updated: 'bg-blue-100 text-blue-700',
  client_deleted: 'bg-red-100 text-red-700',
  // Motos
  motorcycle_added: 'bg-green-100 text-green-700',
  motorcycle_updated: 'bg-blue-100 text-blue-700',
  motorcycle_deleted: 'bg-red-100 text-red-700',
  // Cotizaciones
  quote_created: 'bg-green-100 text-green-700',
  quote_updated: 'bg-blue-100 text-blue-700',
  quote_approved: 'bg-emerald-100 text-emerald-700',
  quote_rejected: 'bg-red-100 text-red-700',
  quote_converted: 'bg-purple-100 text-purple-700',
  // Servicios terceros
  third_party_added: 'bg-green-100 text-green-700',
  third_party_updated: 'bg-blue-100 text-blue-700',
  third_party_status_changed: 'bg-purple-100 text-purple-700',
  // Inspección
  inspection_added: 'bg-green-100 text-green-700',
  inspection_updated: 'bg-blue-100 text-blue-700',
  // Notificaciones
  notification_sent: 'bg-green-100 text-green-700',
  notification_read: 'bg-blue-100 text-blue-700',
};

// Etiquetas para acciones
const ACTION_LABELS: Record<string, string> = {
  created: 'Creó',
  status_changed: 'Cambió estado',
  assigned: 'Asignó',
  modified: 'Modificó',
  task_added: 'Agregó tarea',
  task_updated: 'Actualizó tarea',
  task_deleted: 'Eliminó tarea',
  task_completed: 'Completó tarea',
  stock_in: 'Entrada de stock',
  stock_out: 'Salida de stock',
  stock_adjusted: 'Ajustó stock',
  part_added: 'Agregó repuesto',
  part_updated: 'Actualizó repuesto',
  part_deleted: 'Eliminó repuesto',
  sale_created: 'Registró venta',
  sale_deleted: 'Eliminó venta',
  client_added: 'Registró cliente',
  client_updated: 'Actualizó cliente',
  client_deleted: 'Eliminó cliente',
  motorcycle_added: 'Registró moto',
  motorcycle_updated: 'Actualizó moto',
  motorcycle_deleted: 'Eliminó moto',
  quote_created: 'Creó cotización',
  quote_updated: 'Actualizó cotización',
  quote_approved: 'Aprobó cotización',
  quote_rejected: 'Rechazó cotización',
  quote_converted: 'Convirtió cotización',
  third_party_added: 'Agregó servicio externo',
  third_party_updated: 'Actualizó servicio externo',
  third_party_status_changed: 'Cambió estado de servicio',
  inspection_added: 'Realizó inspección',
  inspection_updated: 'Actualizó inspección',
  notification_sent: 'Envió notificación',
  notification_read: 'Leyó notificación',
};

// Etiquetas para entidades
const ENTITY_LABELS: Record<string, string> = {
  workorder: 'Orden de Trabajo',
  task: 'Tarea',
  inventory: 'Inventario',
  sale: 'Venta',
  client: 'Cliente',
  motorcycle: 'Motocicleta',
  quote: 'Cotización',
  thirdparty: 'Servicio Terceros',
  inspection: 'Inspección',
  notification: 'Notificación',
};

// Iconos para tipos de movimiento de inventario
const MOVEMENT_ICONS: Record<string, React.ElementType> = {
  entrada: Plus,
  salida: Minus,
  ajuste: ArrowUpDown,
  traslado: Truck,
};

export function GlobalAuditLog() {
  const { globalAuditLog, inventoryMovements } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Filtrar logs de auditoría
  const filteredAuditLog = useMemo(() => {
    return globalAuditLog.filter(entry => {
      // Filtro de búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!entry.details.toLowerCase().includes(search) &&
            !entry.userName.toLowerCase().includes(search) &&
            !entry.entityId.toLowerCase().includes(search)) {
          return false;
        }
      }
      
      // Filtro de entidad
      if (entityFilter !== 'all' && entry.entityType !== entityFilter) {
        return false;
      }
      
      // Filtro de fecha
      if (dateFilter !== 'all') {
        const entryDate = new Date(entry.timestamp);
        const now = new Date();
        
        if (dateFilter === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (entryDate < today) return false;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (entryDate < weekAgo) return false;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          if (entryDate < monthAgo) return false;
        }
      }
      
      return true;
    });
  }, [globalAuditLog, searchTerm, entityFilter, dateFilter]);
  
  // Filtrar movimientos de inventario
  const filteredMovements = useMemo(() => {
    return inventoryMovements.filter(movement => {
      // Filtro de búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!movement.partName?.toLowerCase().includes(search) &&
            !movement.userName?.toLowerCase().includes(search) &&
            !movement.warehouseName?.toLowerCase().includes(search)) {
          return false;
        }
      }
      
      // Filtro de fecha
      if (dateFilter !== 'all') {
        const movementDate = new Date(movement.createdAt);
        const now = new Date();
        
        if (dateFilter === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (movementDate < today) return false;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (movementDate < weekAgo) return false;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          if (movementDate < monthAgo) return false;
        }
      }
      
      return true;
    });
  }, [inventoryMovements, searchTerm, dateFilter]);
  
  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Obtener stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAudit = globalAuditLog.filter(e => new Date(e.timestamp) >= today);
    const todayMovements = inventoryMovements.filter(m => new Date(m.createdAt) >= today);
    
    return {
      totalAuditEntries: globalAuditLog.length,
      totalMovements: inventoryMovements.length,
      todayAudit: todayAudit.length,
      todayMovements: todayMovements.length,
    };
  }, [globalAuditLog, inventoryMovements]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trazabilidad del Sistema</h1>
          <p className="text-slate-500">Historial completo de actividades y movimientos</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Auditorías</p>
                <p className="text-2xl font-bold">{stats.totalAuditEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Movimientos Inventario</p>
                <p className="text-2xl font-bold">{stats.totalMovements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Hoy - Auditorías</p>
                <p className="text-2xl font-bold">{stats.todayAudit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Hoy - Movimientos</p>
                <p className="text-2xl font-bold">{stats.todayMovements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar en auditorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                <option value="all">Todas las entidades</option>
                <option value="workorder">Órdenes de Trabajo</option>
                <option value="task">Tareas</option>
                <option value="inventory">Inventario</option>
                <option value="sale">Ventas</option>
                <option value="client">Clientes</option>
                <option value="motorcycle">Motocicletas</option>
                <option value="quote">Cotizaciones</option>
                <option value="thirdparty">Servicios Terceros</option>
                <option value="inspection">Inspecciones</option>
                <option value="notification">Notificaciones</option>
              </select>
              
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Registro de Auditoría
            <Badge variant="secondary" className="ml-1">{filteredAuditLog.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Movimientos de Inventario
            <Badge variant="secondary" className="ml-1">{filteredMovements.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        {/* Tab de Auditoría */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead>Cambios</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditLog.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No hay registros de auditoría
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAuditLog.slice(0, 50).map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(entry.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{entry.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={ENTITY_COLORS[entry.entityType] || 'bg-slate-100'}>
                              {ENTITY_LABELS[entry.entityType] || entry.entityType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={ACTION_COLORS[entry.action] || 'bg-slate-100'}>
                              {ACTION_LABELS[entry.action] || entry.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm truncate" title={entry.details}>
                              {entry.details}
                            </p>
                          </TableCell>
                          <TableCell>
                            {entry.oldValue && entry.newValue && (
                              <div className="text-xs">
                                <span className="line-through text-red-500">{entry.oldValue}</span>
                                <span className="mx-1">→</span>
                                <span className="text-green-600 font-medium">{entry.newValue}</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Inventario */}
        <TabsContent value="inventory">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Repuesto</TableHead>
                      <TableHead>Almacén</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Stock Anterior</TableHead>
                      <TableHead>Stock Nuevo</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                          No hay movimientos de inventario
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.slice(0, 50).map((movement) => {
                        const Icon = MOVEMENT_ICONS[movement.type] || Package;
                        return (
                          <TableRow key={movement.id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(movement.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span className="text-sm">{movement.userName || 'Sistema'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                movement.type === 'entrada' ? 'bg-green-100 text-green-700' :
                                movement.type === 'salida' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }>
                                <Icon className="w-3 h-3 mr-1" />
                                {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{movement.partName}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{movement.warehouseName}</span>
                            </TableCell>
                            <TableCell>
                              <span className={
                                movement.type === 'entrada' ? 'text-green-600 font-medium' :
                                movement.type === 'salida' ? 'text-orange-600 font-medium' :
                                'text-yellow-600 font-medium'
                              }>
                                {movement.type === 'entrada' ? '+' : movement.type === 'salida' ? '-' : ''}
                                {movement.quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-500">{movement.previousStock}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">{movement.newStock}</span>
                            </TableCell>
                            <TableCell>
                              {movement.referenceType && (
                                <Badge variant="outline" className="text-xs">
                                  {movement.referenceType}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default GlobalAuditLog;

