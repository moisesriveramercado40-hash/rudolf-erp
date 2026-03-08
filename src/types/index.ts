// ============================================
// TIPOS DEL ERP RUDOLF - Taller de Motos
// ============================================

// Roles de usuario
export type UserRole = 
  | 'admin'           // Administrador - acceso total
  | 'secretaria'      // Secretaria - recepción, clientes, citas
  | 'maestro'         // Maestro mecánico - trabajos asignados
  | 'ayudante'        // Ayudante - trabajos asignados
  | 'ayudante_admin'  // Ayudante de admin - operativo, sin acceso económico completo
  | 'vendedor';       // Encargada de ventas - repuestos

// Estado de usuario
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

// Cliente
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  dni?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  motorcycles?: Motorcycle[];
}

// Moto
export interface Motorcycle {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  year: number;
  plate?: string;
  color?: string;
  vin?: string; // Número de serie
  mileage: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Estado de orden de trabajo
export type WorkOrderStatus = 
  | 'pendiente'       // Pendiente de asignar
  | 'asignado'        // Asignado a mecánico
  | 'en_progreso'     // En proceso de reparación
  | 'espera_repuestos' // Esperando repuestos
  | 'calidad'         // Control de calidad
  | 'completado'      // Trabajo terminado
  | 'entregado'       // Entregado al cliente
  | 'cancelado';      // Cancelado

// Tipo de trabajo
export type WorkType = 
  | 'mantenimiento'       // Mantenimiento preventivo
  | 'reparacion'          // Reparación general
  | 'diagnostico'         // Diagnóstico
  | 'modificacion'        // Modificación/custom
  | 'garantia_bajaj'      // Garantía Bajaj
  | 'garantia_particular'; // Garantía Particulares

// Prioridad
export type Priority = 'baja' | 'media' | 'alta' | 'urgente';

// Orden de Trabajo
export interface WorkOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  motorcycleId: string;
  workType: WorkType;
  description: string;
  diagnosis?: string;
  status: WorkOrderStatus;
  priority: Priority;
  
  // Asignación
  assignedTo: string[]; // IDs de mecánicos/ayudantes asignados
  assignedBy: string;   // ID de quien asignó
  
  // Tiempos
  createdAt: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  estimatedCompletion?: Date;
  
  // Costos
  laborCost: number;
  partsCost: number;
  totalCost: number;
  
  // Relaciones
  partsUsed?: WorkOrderPart[];
  notes?: string;
  
  // Quién creó la orden
  createdBy: string;
  
  // Historial de auditoría - quién hizo qué y cuándo
  auditLog?: WorkOrderAuditEntry[];
}

// Entrada de auditoría para historial de orden
export interface WorkOrderAuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'created' | 'status_changed' | 'assigned' | 'parts_requested' | 'parts_received' | 'completed' | 'delivered' | 'note_added' | 'modified';
  details: string;
  oldValue?: string;
  newValue?: string;
}

// Repuestos usados en orden de trabajo
export interface WorkOrderPart {
  partId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Categoría de repuesto
export interface PartCategory {
  id: string;
  name: string;
  description?: string;
}

// Repuesto/Producto
export interface Part {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  brand?: string;
  
  // Inventario
  stock: number;
  minStock: number;      // Stock mínimo para alerta
  maxStock?: number;     // Stock máximo
  
  // Ubicación
  warehouseId: string;
  location?: string;     // Ubicación física en almacén
  
  // Precios
  purchasePrice: number;
  salePrice: number;
  
  // Proveedor
  supplierId?: string;
  
  // Estado
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Almacén
export interface Warehouse {
  id: string;
  name: string;
  type: 'taller' | 'tienda';
  address?: string;
  phone?: string;
  managerId?: string;
  isActive: boolean;
}

// Proveedor
export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  ruc?: string;
  notes?: string;
  isActive: boolean;
}

// Movimiento de inventario
export interface InventoryMovement {
  id: string;
  partId: string;
  warehouseId: string;
  type: 'entrada' | 'salida' | 'ajuste' | 'traslado';
  quantity: number;
  reason?: string;
  referenceId?: string;  // ID de orden de trabajo o venta
  createdBy: string;
  createdAt: Date;
}

// Venta de repuestos
export interface Sale {
  id: string;
  saleNumber: string;
  clientId?: string;     // Puede ser venta sin cliente registrado
  clientName?: string;   // Para ventas rápidas
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  
  // Pago
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin';
  isPaid: boolean;
  
  // Quién vendió
  soldBy: string;
  warehouseId: string;
  
  createdAt: Date;
  notes?: string;
}

export interface SaleItem {
  partId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Transacción financiera
export interface Transaction {
  id: string;
  type: 'ingreso' | 'egreso';
  category: 
    | 'venta_repuestos' 
    | 'servicio_taller' 
    | 'compra_inventario' 
    | 'sueldos' 
    | 'gastos_operativos' 
    | 'otros';
  amount: number;
  description: string;
  referenceId?: string;  // ID de venta u orden de trabajo
  referenceType?: 'sale' | 'workorder' | 'expense';
  
  // Metadatos
  createdBy: string;
  createdAt: Date;
  date: Date;
  
  // Para gastos
  receiptNumber?: string;
  supplierId?: string;
}

// Estadísticas del dashboard
export interface DashboardStats {
  // Órdenes de trabajo
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrdersToday: number;
  
  // Finanzas
  revenueToday: number;
  revenueMonth: number;
  expensesToday: number;
  
  // Inventario
  lowStockItems: number;
  totalParts: number;
  
  // Ventas
  salesToday: number;
  salesCountToday: number;
}

// Notificación
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

// Configuración del sistema
export interface SystemConfig {
  companyName: string;
  companyRuc?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  
  // Horario de trabajo
  workStartTime: string;
  workEndTime: string;
  
  // Configuraciones de notificación
  lowStockAlert: boolean;
  orderCompletionAlert: boolean;
}

// ============================================
// NUEVOS TIPOS PARA MEJORAS RUDOLF
// ============================================

// Tipo de notificación al cliente
export type CustomerNotificationType = 
  | 'trabajo_completado'      // Trabajo terminado
  | 'faltan_repuestos'        // Faltan repuestos
  | 'falla_adicional'         // Se encontró falla adicional
  | 'trabajo_iniciado'        // Trabajo iniciado
  | 'listo_para_entrega'      // Listo para entrega
  | 'recordatorio'            // Recordatorio
  | 'cotizacion_lista';       // Cotización lista

// Canal de notificación
export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'llamada';

// Estado de notificación al cliente
export type CustomerNotificationStatus = 'pendiente' | 'enviado' | 'leido' | 'confirmado';

// Notificación enviada al cliente
export interface CustomerNotification {
  id: string;
  workOrderId?: string;
  quoteId?: string;
  clientId: string;
  type: CustomerNotificationType;
  channel: NotificationChannel;
  message: string;
  status: CustomerNotificationStatus;
  sentAt?: Date;
  readAt?: Date;
  confirmedAt?: Date;
  createdBy: string;
  createdAt: Date;
}

// Estado de servicio de terceros
export type ThirdPartyServiceStatus = 
  | 'pendiente_envio'     // Pendiente de enviar
  | 'enviado'             // Enviado al proveedor
  | 'en_proceso'          // Proveedor trabajando
  | 'completado'          // Trabajo terminado
  | 'recibido'            // Recibido en taller
  | 'cancelado';          // Cancelado

// Tipo de servicio de terceros
export type ThirdPartyServiceType = 
  | 'torno'               // Trabajo de torno
  | 'soldadura'           // Soldadura
  | 'pintura'             // Pintura
  | 'cromado'             // Cromado
  | 'rectificadora'       // Rectificadora de motor
  | 'llaves'              // Duplicado de llaves
  | 'electronica'         // Reparación electrónica
  | 'otros';              // Otros servicios

// Servicio de terceros (trabajos externos)
export interface ThirdPartyService {
  id: string;
  workOrderId: string;
  type: ThirdPartyServiceType;
  providerName: string;
  providerPhone?: string;
  providerContact?: string;
  description: string;
  partsIncluded?: string;    // Piezas enviadas
  estimatedCost: number;
  finalCost?: number;
  status: ThirdPartyServiceStatus;
  
  // Tiempos
  sentAt?: Date;
  receivedAt?: Date;
  estimatedDays: number;
  
  // Quién gestiona
  managedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Estado de cotización
export type QuoteStatus = 
  | 'borrador'            // Borrador
  | 'enviada'             // Enviada al cliente
  | 'aprobada'            // Cliente aprobó
  | 'rechazada'           // Cliente rechazó
  | 'expirada'            // Expiró el tiempo
  | 'convertida';         // Convertida a orden de trabajo

// Cotización/Estimado
export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  motorcycleId?: string;
  
  // Descripción del trabajo
  description: string;
  diagnosis?: string;
  workType: WorkType;
  
  // Items de la cotización
  laborItems: QuoteLaborItem[];
  partsItems: QuotePartItem[];
  
  // Costos
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  
  // Tiempos
  estimatedHours: number;
  estimatedDays: number;
  validUntil: Date;
  
  // Estado
  status: QuoteStatus;
  
  // Políticas informadas
  policiesAcknowledged: boolean;
  timeEstimateAcknowledged: boolean;
  
  // Quién creó
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  convertedToWorkOrderId?: string;
}

// Item de mano de obra en cotización
export interface QuoteLaborItem {
  id: string;
  description: string;
  hours: number;
  ratePerHour: number;
  total: number;
}

// Item de repuesto en cotización
export interface QuotePartItem {
  id: string;
  partId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isAvailable: boolean;
}

// Políticas del negocio
export interface BusinessPolicy {
  id: string;
  category: 'general' | 'garantia' | 'pagos' | 'tiempos' | 'repuestos';
  title: string;
  content: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Tiempo estimado por tipo de trabajo
export interface TimeEstimate {
  workType: WorkType;
  minHours: number;
  maxHours: number;
  minDays: number;
  maxDays: number;
  description: string;
}

// ============================================
// TIPOS PARA PRE-INSPECCIÓN DE MOTO
// ============================================

// Tipo de daño en la pre-inspección
export type DamageType = 'ralladura' | 'golpe' | 'abolladura' | 'rayon' | 'falta_pieza' | 'otro';

// Ubicación del daño
export type DamageLocation = 
  | 'tanque' 
  | 'guardabarros_delantero' 
  | 'guardabarros_trasero'
  | 'carenado_izquierdo'
  | 'carenado_derecho'
  | 'colin'
  | 'escape'
  | 'llanta_delantera'
  | 'llanta_trasera'
  | 'rin_delantero'
  | 'rin_trasero'
  | 'manubrio'
  | 'farola'
  | 'stop'
  | 'motor'
  | 'chasis'
  | 'otro';

// Daño registrado en pre-inspección
export interface MotorcycleDamage {
  id: string;
  type: DamageType;
  location: DamageLocation;
  description: string;
  severity: 'leve' | 'moderado' | 'grave';
}

// Pre-inspección de moto al ingresar
export interface MotorcycleInspection {
  id: string;
  motorcycleId: string;
  workOrderId?: string;
  
  // Estado general
  generalCondition: 'excelente' | 'bueno' | 'regular' | 'malo';
  
  // Daños encontrados
  damages: MotorcycleDamage[];
  
  // Fotos de la moto (hasta 5)
  photos: string[];
  
  // Observaciones adicionales
  notes?: string;
  
  // Kilometraje al momento de la inspección
  mileageAtInspection: number;
  
  // Quién realizó la inspección
  inspectedBy: string;
  inspectedAt: Date;
  
  // Confirmación del cliente
  clientAcknowledged: boolean;
  clientSignature?: string;
}

// ============================================
// TIPOS PARA ÍTEMS DE TRABAJO DETALLADOS
// ============================================

// Item de trabajo en orden (enumerado con precio)
export interface WorkOrderTask {
  id: string;
  orderId: string;
  
  // Número de ítem (auto-incremental)
  itemNumber: number;
  
  // Descripción del trabajo
  description: string;
  
  // Tipo de ítem
  type: 'mano_obra' | 'repuesto' | 'servicio_externo' | 'otro';
  
  // Costos
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  // Quién agregó el ítem
  addedBy: string;
  addedAt: Date;
  
  // Estado del ítem
  status: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  
  // Notas adicionales
  notes?: string;
}
