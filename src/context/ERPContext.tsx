import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { 
  Client, Motorcycle, WorkOrder, Part, Sale, 
  Transaction, Warehouse, Supplier, DashboardStats,
  Notification, WorkOrderStatus,
  CustomerNotification, NotificationChannel,
  ThirdPartyService, ThirdPartyServiceStatus,
  Quote, QuoteStatus,
  BusinessPolicy,
  MotorcycleInspection,
  WorkOrderTask,
  WorkOrderAuditEntry,
  InventoryMovement,
  AuditEntry,
  AuditAction
} from '@/types';
import {
  clientsService,
  motorcyclesService,
  workOrdersService,
  partsService,
  salesService,
  transactionsService,
  warehousesService,
  suppliersService,
  quotesService,
  businessPoliciesService,
  inspectionsService,
  workOrderTasksService,
  customerNotificationsService,
  thirdPartyServicesService,
} from '@/services/firebase';

interface ERPContextType {
  // Datos
  clients: Client[];
  motorcycles: Motorcycle[];
  workOrders: WorkOrder[];
  parts: Part[];
  sales: Sale[];
  transactions: Transaction[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  notifications: Notification[];
  
  // Nuevos datos
  customerNotifications: CustomerNotification[];
  thirdPartyServices: ThirdPartyService[];
  quotes: Quote[];
  businessPolicies: BusinessPolicy[];
  
  // Pre-inspecciones de moto
  inspections: MotorcycleInspection[];
  
  // Items de trabajo detallados
  workOrderTasks: WorkOrderTask[];
  
  // Movimientos de inventario (trazabilidad)
  inventoryMovements: InventoryMovement[];
  
  // Auditoría global
  globalAuditLog: AuditEntry[];
  
  // Stats
  stats: DashboardStats;
  
  // Actions - Clientes
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string> | string;
  updateClient: (id: string, data: Partial<Client>) => Promise<void> | void;
  deleteClient: (id: string) => Promise<void> | void;
  getClientById: (id: string) => Client | undefined;
  
  // Actions - Motos
  addMotorcycle: (moto: Omit<Motorcycle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string> | string;
  updateMotorcycle: (id: string, data: Partial<Motorcycle>) => Promise<void> | void;
  deleteMotorcycle: (id: string) => Promise<void> | void;
  getMotorcyclesByClient: (clientId: string) => Motorcycle[];
  
  // Actions - Órdenes de trabajo
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'orderNumber' | 'createdAt'>) => Promise<string> | string;
  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => Promise<void> | void;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus) => Promise<void> | void;
  deleteWorkOrder: (id: string) => Promise<void> | void;
  getWorkOrderById: (id: string) => WorkOrder | undefined;
  getWorkOrdersByMechanic: (mechanicId: string) => WorkOrder[];
  getWorkOrdersByStatus: (status: WorkOrderStatus) => WorkOrder[];
  
  // Actions - Inventario
  addPart: (part: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string> | string;
  updatePart: (id: string, data: Partial<Part>) => Promise<void> | void;
  updateStock: (partId: string, quantity: number, type: 'entrada' | 'salida') => Promise<void> | void;
  deletePart: (id: string) => Promise<void> | void;
  getPartById: (id: string) => Part | undefined;
  getLowStockParts: () => Part[];
  
  // Actions - Ventas
  addSale: (sale: Omit<Sale, 'id' | 'saleNumber' | 'createdAt'>) => Promise<string> | string;
  getSaleById: (id: string) => Sale | undefined;
  
  // Actions - Transacciones
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string> | string;
  getTransactionsByDateRange: (start: Date, end: Date) => Transaction[];
  
  // Actions - Notificaciones
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Actions - Notificaciones a Clientes
  addCustomerNotification: (notification: Omit<CustomerNotification, 'id' | 'createdAt' | 'status'>) => Promise<string> | string;
  sendCustomerNotification: (id: string, channel: NotificationChannel) => Promise<void> | void;
  markCustomerNotificationAsRead: (id: string) => Promise<void> | void;
  getPendingNotifications: () => CustomerNotification[];
  getNotificationsByWorkOrder: (workOrderId: string) => CustomerNotification[];
  
  // Actions - Servicios de Terceros
  addThirdPartyService: (service: Omit<ThirdPartyService, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string> | string;
  updateThirdPartyService: (id: string, data: Partial<ThirdPartyService>) => Promise<void> | void;
  updateThirdPartyServiceStatus: (id: string, status: ThirdPartyServiceStatus) => Promise<void> | void;
  deleteThirdPartyService: (id: string) => Promise<void> | void;
  getThirdPartyServicesByWorkOrder: (workOrderId: string) => ThirdPartyService[];
  getPendingThirdPartyServices: () => ThirdPartyService[];
  
  // Actions - Cotizaciones
  addQuote: (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => Promise<string> | string;
  updateQuote: (id: string, data: Partial<Quote>) => Promise<void> | void;
  updateQuoteStatus: (id: string, status: QuoteStatus) => Promise<void> | void;
  deleteQuote: (id: string) => Promise<void> | void;
  getQuoteById: (id: string) => Quote | undefined;
  getQuotesByClient: (clientId: string) => Quote[];
  convertQuoteToWorkOrder: (quoteId: string) => Promise<string> | string;
  
  // Actions - Políticas del Negocio
  addBusinessPolicy: (policy: Omit<BusinessPolicy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string> | string;
  updateBusinessPolicy: (id: string, data: Partial<BusinessPolicy>) => Promise<void> | void;
  deleteBusinessPolicy: (id: string) => Promise<void> | void;
  getActivePolicies: () => BusinessPolicy[];
  
  // Actions - Pre-inspecciones de Moto
  addInspection: (inspection: Omit<MotorcycleInspection, 'id' | 'inspectedAt'>) => Promise<string> | string;
  updateInspection: (id: string, data: Partial<MotorcycleInspection>) => Promise<void> | void;
  getInspectionsByMotorcycle: (motorcycleId: string) => MotorcycleInspection[];
  getInspectionByWorkOrder: (workOrderId: string) => MotorcycleInspection | undefined;
  
  // Actions - Items de Trabajo Detallados
  addWorkOrderTask: (task: Omit<WorkOrderTask, 'id' | 'addedAt' | 'itemNumber'>) => Promise<string> | string;
  updateWorkOrderTask: (id: string, data: Partial<WorkOrderTask>) => Promise<void> | void;
  deleteWorkOrderTask: (id: string) => Promise<void> | void;
  getTasksByWorkOrder: (workOrderId: string) => WorkOrderTask[];
  updateTaskStatus: (id: string, status: WorkOrderTask['status']) => Promise<void> | void;
  
  // Refresh stats
  refreshStats: () => void;
  
  // Exportar base de datos completa
  exportDatabase: () => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

// Datos iniciales de prueba
const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'w1', name: 'Almacén Taller Principal', type: 'taller', isActive: true },
  { id: 'w2', name: 'Tienda Repuestos #1', type: 'tienda', isActive: true },
  { id: 'w3', name: 'Tienda Repuestos #2', type: 'tienda', isActive: true },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Honda Perú', contactName: 'Juan Díaz', phone: '555-0101', isActive: true },
  { id: 's2', name: 'Yamaha Parts', contactName: 'Pedro Ruiz', phone: '555-0102', isActive: true },
  { id: 's3', name: 'Repuestos Genericos SA', contactName: 'Luis Mendoza', phone: '555-0103', isActive: true },
];

const INITIAL_PARTS: Part[] = [
  { id: 'p1', sku: 'ACEITE-20W50', name: 'Aceite 20W50 1L', categoryId: 'cat1', stock: 50, minStock: 10, warehouseId: 'w1', purchasePrice: 25, salePrice: 35, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', sku: 'FILTRO-AIRE-CG', name: 'Filtro de Aire CG 125/150', categoryId: 'cat2', stock: 30, minStock: 5, warehouseId: 'w1', purchasePrice: 15, salePrice: 25, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p3', sku: 'BUJIA-NGK', name: 'Bujía NGK CR7HSA', categoryId: 'cat3', stock: 100, minStock: 20, warehouseId: 'w1', purchasePrice: 8, salePrice: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p4', sku: 'CADENA-428', name: 'Cadena 428H 118L', categoryId: 'cat4', stock: 15, minStock: 5, warehouseId: 'w2', purchasePrice: 45, salePrice: 65, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p5', sku: 'FRENO-DELANTERO', name: 'Pastilla Freno Delantera', categoryId: 'cat5', stock: 8, minStock: 10, warehouseId: 'w2', purchasePrice: 30, salePrice: 50, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', firstName: 'Roberto', lastName: 'García', phone: '987-654-321', email: 'roberto@email.com', createdAt: new Date(), updatedAt: new Date() },
  { id: 'c2', firstName: 'Laura', lastName: 'Martínez', phone: '987-123-456', email: 'laura@email.com', createdAt: new Date(), updatedAt: new Date() },
  { id: 'c3', firstName: 'Miguel', lastName: 'Hernández', phone: '987-789-012', createdAt: new Date(), updatedAt: new Date() },
];

const INITIAL_MOTORCYCLES: Motorcycle[] = [
  { id: 'm1', clientId: 'c1', brand: 'Honda', model: 'CG 125', year: 2020, plate: 'ABC-123', mileage: 15000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'm2', clientId: 'c1', brand: 'Yamaha', model: 'FZ 150', year: 2022, plate: 'XYZ-789', mileage: 5000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'm3', clientId: 'c2', brand: 'Honda', model: 'XR 190', year: 2021, plate: 'DEF-456', mileage: 8000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'm4', clientId: 'c3', brand: 'Bajaj', model: 'Boxer 150', year: 2019, plate: 'GHI-789', mileage: 25000, createdAt: new Date(), updatedAt: new Date() },
];

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo1',
    orderNumber: 'OT-2024-001',
    clientId: 'c1',
    motorcycleId: 'm1',
    workType: 'mantenimiento',
    description: 'Cambio de aceite, revisión general, ajuste de frenos',
    status: 'completado',
    priority: 'media',
    assignedTo: ['3'],
    assignedBy: '2',
    createdAt: new Date(Date.now() - 86400000 * 2),
    assignedAt: new Date(Date.now() - 86400000 * 2),
    startedAt: new Date(Date.now() - 86400000 * 2),
    completedAt: new Date(Date.now() - 86400000),
    laborCost: 80,
    partsCost: 60,
    totalCost: 140,
    createdBy: '2',
  },
  {
    id: 'wo2',
    orderNumber: 'OT-2024-002',
    clientId: 'c2',
    motorcycleId: 'm3',
    workType: 'reparacion',
    description: 'Problema en el carburador, no enciende bien',
    status: 'en_progreso',
    priority: 'alta',
    assignedTo: ['3', '5'],
    assignedBy: '2',
    createdAt: new Date(Date.now() - 86400000),
    assignedAt: new Date(Date.now() - 86400000),
    startedAt: new Date(Date.now() - 43200000),
    laborCost: 120,
    partsCost: 45,
    totalCost: 165,
    createdBy: '2',
  },
  {
    id: 'wo3',
    orderNumber: 'OT-2024-003',
    clientId: 'c3',
    motorcycleId: 'm4',
    workType: 'diagnostico',
    description: 'Ruido extraño en el motor, pérdida de potencia',
    status: 'pendiente',
    priority: 'urgente',
    assignedTo: [],
    assignedBy: '',
    createdAt: new Date(),
    laborCost: 50,
    partsCost: 0,
    totalCost: 50,
    createdBy: '2',
  },
];

const INITIAL_SALES: Sale[] = [
  {
    id: 'sale1',
    saleNumber: 'V-2024-001',
    clientId: 'c1',
    items: [
      { partId: 'p1', quantity: 2, unitPrice: 35, totalPrice: 70 },
      { partId: 'p3', quantity: 1, unitPrice: 15, totalPrice: 15 },
    ],
    subtotal: 85,
    tax: 0,
    discount: 0,
    total: 85,
    paymentMethod: 'efectivo',
    isPaid: true,
    soldBy: '9',
    warehouseId: 'w2',
    createdAt: new Date(Date.now() - 86400000),
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'ingreso',
    category: 'servicio_taller',
    amount: 140,
    description: 'Pago orden de trabajo OT-2024-001',
    referenceId: 'wo1',
    referenceType: 'workorder',
    createdBy: '2',
    createdAt: new Date(Date.now() - 86400000),
    date: new Date(Date.now() - 86400000),
  },
  {
    id: 't2',
    type: 'ingreso',
    category: 'venta_repuestos',
    amount: 85,
    description: 'Venta repuestos V-2024-001',
    referenceId: 'sale1',
    referenceType: 'sale',
    createdBy: '9',
    createdAt: new Date(Date.now() - 86400000),
    date: new Date(Date.now() - 86400000),
  },
];

// Datos iniciales - Políticas del negocio
const INITIAL_BUSINESS_POLICIES: BusinessPolicy[] = [
  {
    id: 'bp1',
    category: 'general',
    title: 'Horario de Atención',
    content: 'Lunes a Sábado de 8:00 AM a 6:00 PM. Domingos cerrado.',
    isActive: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'bp2',
    category: 'tiempos',
    title: 'Tiempos de Entrega',
    content: 'Los tiempos de entrega son estimados y pueden variar según la complejidad del trabajo y disponibilidad de repuestos.',
    isActive: true,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'bp3',
    category: 'pagos',
    title: 'Política de Pagos',
    content: 'Se requiere un adelanto del 50% para iniciar trabajos mayores a S/200. El saldo se paga al momento de la entrega.',
    isActive: true,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'bp4',
    category: 'garantia',
    title: 'Garantía de Servicios',
    content: 'Todos nuestros trabajos tienen garantía de 30 días calendario. No cubre daños por mal uso o accidentes.',
    isActive: true,
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'bp5',
    category: 'repuestos',
    title: 'Repuestos Originales',
    content: 'Trabajamos con repuestos originales y de calidad garantizada. Los repuestos genéricos se informan previamente al cliente.',
    isActive: true,
    order: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Datos iniciales - Cotizaciones
const INITIAL_QUOTES: Quote[] = [
  {
    id: 'q1',
    quoteNumber: 'COT-2024-001',
    clientId: 'c1',
    motorcycleId: 'm1',
    description: 'Mantenimiento completo y revisión de frenos',
    workType: 'mantenimiento',
    laborItems: [
      { id: 'ql1', description: 'Cambio de aceite y filtro', hours: 0.5, ratePerHour: 80, total: 40 },
      { id: 'ql2', description: 'Revisión y ajuste de frenos', hours: 1, ratePerHour: 80, total: 80 },
      { id: 'ql3', description: 'Limpieza de carburador', hours: 1.5, ratePerHour: 80, total: 120 },
    ],
    partsItems: [
      { id: 'qp1', partId: 'p1', description: 'Aceite 20W50 1L', quantity: 1, unitPrice: 35, total: 35, isAvailable: true },
      { id: 'qp2', partId: 'p2', description: 'Filtro de Aire CG 125/150', quantity: 1, unitPrice: 25, total: 25, isAvailable: true },
      { id: 'qp3', partId: 'p5', description: 'Pastilla Freno Delantera', quantity: 1, unitPrice: 50, total: 50, isAvailable: true },
    ],
    subtotal: 350,
    tax: 0,
    discount: 0,
    total: 350,
    estimatedHours: 3,
    estimatedDays: 1,
    validUntil: new Date(Date.now() + 7 * 86400000),
    status: 'aprobada',
    policiesAcknowledged: true,
    timeEstimateAcknowledged: true,
    createdBy: '2',
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 2),
    approvedAt: new Date(Date.now() - 86400000 * 2),
    convertedToWorkOrderId: 'wo1',
  },
];

// Datos iniciales - Servicios de terceros
const INITIAL_THIRD_PARTY_SERVICES: ThirdPartyService[] = [
  {
    id: 'tps1',
    workOrderId: 'wo2',
    type: 'torno',
    providerName: 'Tornos El Preciso',
    providerPhone: '987-111-222',
    providerContact: 'Sr. Carlos Mendoza',
    description: 'Rectificado de asiento de válvulas',
    partsIncluded: 'Cabeza de cilindro completa',
    estimatedCost: 150,
    finalCost: 150,
    status: 'recibido',
    sentAt: new Date(Date.now() - 86400000 * 2),
    receivedAt: new Date(Date.now() - 43200000),
    estimatedDays: 2,
    managedBy: '3',
    notes: 'Trabajo realizado con buena calidad',
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 43200000),
  },
];

// Datos iniciales - Notificaciones a clientes
const INITIAL_CUSTOMER_NOTIFICATIONS: CustomerNotification[] = [
  {
    id: 'cn1',
    workOrderId: 'wo1',
    clientId: 'c1',
    type: 'trabajo_completado',
    channel: 'whatsapp',
    message: 'Estimado Roberto, su moto Honda CG 125 está lista para recoger. Total a pagar: S/140. Horario de atención: 8AM-6PM.',
    status: 'confirmado',
    sentAt: new Date(Date.now() - 86400000),
    readAt: new Date(Date.now() - 86400000 + 3600000),
    confirmedAt: new Date(Date.now() - 86400000 + 7200000),
    createdBy: '2',
    createdAt: new Date(Date.now() - 86400000),
  },
];

// Generadores de IDs
let idCounter = 100;
const generateId = () => `id_${Date.now()}_${idCounter++}`;
let orderCounter = 4;
const generateOrderNumber = () => `OT-2024-${String(orderCounter++).padStart(3, '0')}`;
let saleCounter = 2;
const generateSaleNumber = () => `V-2024-${String(saleCounter++).padStart(3, '0')}`;
let quoteCounter = 2;
const generateQuoteNumber = () => `COT-2024-${String(quoteCounter++).padStart(3, '0')}`;

// ============ FUNCIONES DE AUDITORÍA Y TRAZABILIDAD ============

// Función helper para agregar entrada de auditoría global
const addAuditEntry = (
  setGlobalAuditLog: React.Dispatch<React.SetStateAction<AuditEntry[]>>,
  currentUser: { id: string; name: string } | null,
  entityType: AuditEntry['entityType'],
  entityId: string,
  action: AuditAction,
  details: string,
  oldValue?: string,
  newValue?: string,
  metadata?: Record<string, unknown>
) => {
  const entry: AuditEntry = {
    id: generateId(),
    timestamp: new Date(),
    userId: currentUser?.id || 'system',
    userName: currentUser?.name || 'Sistema',
    entityType,
    entityId,
    action,
    details,
    oldValue,
    newValue,
    metadata,
  };
  setGlobalAuditLog(prev => [entry, ...prev]);
  return entry;
};

// Función helper para registrar movimiento de inventario
const addInventoryMovement = (
  setInventoryMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>,
  part: Part,
  warehouses: Warehouse[],
  quantity: number,
  type: 'entrada' | 'salida' | 'ajuste',
  currentUser: { id: string; name: string } | null,
  reason?: string,
  referenceId?: string,
  referenceType?: 'workorder' | 'sale' | 'purchase' | 'adjustment'
) => {
  const warehouse = warehouses.find(w => w.id === part.warehouseId);
  const previousStock = part.stock;
  const newStock = type === 'entrada' ? previousStock + quantity : 
                   type === 'salida' ? previousStock - quantity : quantity;
  
  const movement: InventoryMovement = {
    id: generateId(),
    partId: part.id,
    partName: part.name,
    warehouseId: part.warehouseId,
    warehouseName: warehouse?.name,
    type,
    quantity,
    previousStock,
    newStock,
    reason,
    referenceId,
    referenceType,
    createdBy: currentUser?.id || 'system',
    userName: currentUser?.name,
    createdAt: new Date(),
  };
  
  setInventoryMovements(prev => [movement, ...prev]);
  return movement;
};

// Flag para usar Firebase o datos locales (true por defecto)
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE !== 'false';

export function ERPProvider({ children }: { children: ReactNode }) {
  const { user: currentUser } = useAuth();
  
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>(INITIAL_MOTORCYCLES);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [parts, setParts] = useState<Part[]>(INITIAL_PARTS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Nuevos estados
  const [customerNotifications, setCustomerNotifications] = useState<CustomerNotification[]>(INITIAL_CUSTOMER_NOTIFICATIONS);
  const [thirdPartyServices, setThirdPartyServices] = useState<ThirdPartyService[]>(INITIAL_THIRD_PARTY_SERVICES);
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [businessPolicies, setBusinessPolicies] = useState<BusinessPolicy[]>(INITIAL_BUSINESS_POLICIES);
  
  // Estados para pre-inspecciones y tasks
  const [inspections, setInspections] = useState<MotorcycleInspection[]>([]);
  const [workOrderTasks, setWorkOrderTasks] = useState<WorkOrderTask[]>([]);
  
  // Estados para trazabilidad
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [globalAuditLog, setGlobalAuditLog] = useState<AuditEntry[]>([]);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 3,
    pendingOrders: 1,
    inProgressOrders: 1,
    completedOrdersToday: 0,
    revenueToday: 0,
    revenueMonth: 225,
    expensesToday: 0,
    lowStockItems: 1,
    totalParts: 5,
    salesToday: 0,
    salesCountToday: 0,
  });
  
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  
  // Cargar datos desde Firebase al iniciar
  useEffect(() => {
    if (!USE_FIREBASE) return;
    
    const loadData = async () => {
      try {
        const [
          clientsData,
          motorcyclesData,
          workOrdersData,
          partsData,
          salesData,
          transactionsData,
          warehousesData,
          suppliersData,
          quotesData,
          businessPoliciesData,
          inspectionsData,
          workOrderTasksData,
        ] = await Promise.all([
          clientsService.getAll(),
          motorcyclesService.getAll(),
          workOrdersService.getAll(),
          partsService.getAll(),
          salesService.getAll(),
          transactionsService.getAll(),
          warehousesService.getAll(),
          suppliersService.getAll(),
          quotesService.getAll(),
          businessPoliciesService.getAll(),
          inspectionsService.getAll(),
          workOrderTasksService.getAll(),
        ]);
        
        if (clientsData.length > 0) setClients(clientsData as Client[]);
        if (motorcyclesData.length > 0) setMotorcycles(motorcyclesData as Motorcycle[]);
        if (workOrdersData.length > 0) setWorkOrders(workOrdersData as WorkOrder[]);
        if (partsData.length > 0) setParts(partsData as Part[]);
        if (salesData.length > 0) setSales(salesData as Sale[]);
        if (transactionsData.length > 0) setTransactions(transactionsData as Transaction[]);
        if (warehousesData.length > 0) setWarehouses(warehousesData as Warehouse[]);
        if (suppliersData.length > 0) setSuppliers(suppliersData as Supplier[]);
        if (quotesData.length > 0) setQuotes(quotesData as Quote[]);
        if (businessPoliciesData.length > 0) setBusinessPolicies(businessPoliciesData as BusinessPolicy[]);
        if (inspectionsData.length > 0) setInspections(inspectionsData as MotorcycleInspection[]);
        if (workOrderTasksData.length > 0) setWorkOrderTasks(workOrderTasksData as WorkOrderTask[]);
        
        setIsFirebaseReady(true);
      } catch (error) {
        console.error('Error loading data from Firebase:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Sincronizar con Firebase en tiempo real
  useEffect(() => {
    if (!USE_FIREBASE || !isFirebaseReady) return;
    
    const unsubscribers = [
      clientsService.onSnapshot((data) => setClients(data as Client[])),
      motorcyclesService.onSnapshot((data) => setMotorcycles(data as Motorcycle[])),
      workOrdersService.onSnapshot((data) => setWorkOrders(data as WorkOrder[])),
      partsService.onSnapshot((data) => setParts(data as Part[])),
      salesService.onSnapshot((data) => setSales(data as Sale[])),
      transactionsService.onSnapshot((data) => setTransactions(data as Transaction[])),
      quotesService.onSnapshot((data) => setQuotes(data as Quote[])),
      businessPoliciesService.onSnapshot((data) => setBusinessPolicies(data as BusinessPolicy[])),
      inspectionsService.onSnapshot((data) => setInspections(data as MotorcycleInspection[])),
      workOrderTasksService.onSnapshot((data) => setWorkOrderTasks(data as WorkOrderTask[])),
    ];
    
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [isFirebaseReady]);

  // ============ CLIENTES ============
  const addClient = useCallback(async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newClient = {
      ...client,
      createdAt: now,
      updatedAt: now,
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await clientsService.add(newClient);
      return id;
    } else {
      const id = generateId();
      setClients(prev => [...prev, { ...newClient, id }]);
      return id;
    }
  }, [isFirebaseReady]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await clientsService.update(id, data);
    } else {
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date() } : c));
    }
  }, [isFirebaseReady]);

  const deleteClient = useCallback(async (id: string) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await clientsService.delete(id);
    } else {
      setClients(prev => prev.filter(c => c.id !== id));
      setMotorcycles(prev => prev.filter(m => m.clientId !== id));
    }
  }, [isFirebaseReady]);

  const getClientById = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  // ============ MOTOS ============
  const addMotorcycle = useCallback(async (moto: Omit<Motorcycle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newMoto = {
      ...moto,
      createdAt: now,
      updatedAt: now,
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await motorcyclesService.add(newMoto);
      return id;
    } else {
      const id = generateId();
      setMotorcycles(prev => [...prev, { ...newMoto, id }]);
      return id;
    }
  }, [isFirebaseReady]);

  const updateMotorcycle = useCallback(async (id: string, data: Partial<Motorcycle>) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await motorcyclesService.update(id, data);
    } else {
      setMotorcycles(prev => prev.map(m => m.id === id ? { ...m, ...data, updatedAt: new Date() } : m));
    }
  }, [isFirebaseReady]);

  const deleteMotorcycle = useCallback(async (id: string) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await motorcyclesService.delete(id);
    } else {
      setMotorcycles(prev => prev.filter(m => m.id !== id));
      setWorkOrders(prev => prev.filter(wo => wo.motorcycleId !== id));
    }
  }, [isFirebaseReady]);

  const getMotorcyclesByClient = useCallback((clientId: string) => {
    return motorcycles.filter(m => m.clientId === clientId);
  }, [motorcycles]);

  // ============ ÓRDENES DE TRABAJO ============
  const addWorkOrder = useCallback(async (order: Omit<WorkOrder, 'id' | 'orderNumber' | 'createdAt'>) => {
    const newOrder = {
      ...order,
      orderNumber: generateOrderNumber(),
      createdAt: new Date(),
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const auditLog: WorkOrderAuditEntry[] = currentUser ? [{
        id: generateId(),
        timestamp: new Date(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'created',
        details: `Orden creada por ${currentUser.name}`,
      }] : [];
      const id = await workOrdersService.add({ ...newOrder, auditLog } as any);
      refreshStats();
      return id;
    } else {
      const id = generateId();
      const auditLog: WorkOrderAuditEntry[] = currentUser ? [{
        id: generateId(),
        timestamp: new Date(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'created',
        details: `Orden creada por ${currentUser.name}`,
      }] : [];
      setWorkOrders(prev => [...prev, { ...newOrder, id, auditLog }]);
      refreshStats();
      return id;
    }
  }, [isFirebaseReady, currentUser]);

  const updateWorkOrder = useCallback(async (id: string, data: Partial<WorkOrder>) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await workOrdersService.update(id, data);
    } else {
      setWorkOrders(prev => prev.map(wo => wo.id === id ? { ...wo, ...data } : wo));
    }
    refreshStats();
  }, [isFirebaseReady]);

  const updateWorkOrderStatus = useCallback(async (id: string, status: WorkOrderStatus) => {
    const now = new Date();
    const updates: Partial<WorkOrder> = { status };
    if (status === 'en_progreso') updates.startedAt = now;
    if (status === 'completado') updates.completedAt = now;
    if (status === 'entregado') updates.deliveredAt = now;
    
    // Obtener la orden actual para saber el estado anterior
    const currentOrder = workOrders.find(wo => wo.id === id);
    const oldStatus = currentOrder?.status;
    
    if (USE_FIREBASE && isFirebaseReady) {
      const currentAuditLog = currentOrder?.auditLog || [];
      const newAuditLog = currentUser && oldStatus ? [...currentAuditLog, {
        id: generateId(),
        timestamp: new Date(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'status_changed' as const,
        details: `${currentUser.name} cambió el estado de la orden`,
        oldValue: oldStatus,
        newValue: status,
      }] : currentAuditLog;
      await workOrdersService.update(id, { ...updates, auditLog: newAuditLog } as any);
    } else {
      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === id) {
          const currentAuditLog = wo.auditLog || [];
          const newAuditLog = currentUser && oldStatus ? [...currentAuditLog, {
            id: generateId(),
            timestamp: new Date(),
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'status_changed' as const,
            details: `${currentUser.name} cambió el estado de la orden`,
            oldValue: oldStatus,
            newValue: status,
          }] : currentAuditLog;
          return { 
            ...wo, 
            ...updates, 
            auditLog: newAuditLog 
          };
        }
        return wo;
      }));
    }
    refreshStats();
  }, [isFirebaseReady, currentUser, workOrders]);

  const deleteWorkOrder = useCallback(async (id: string) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await workOrdersService.delete(id);
    } else {
      setWorkOrders(prev => prev.filter(wo => wo.id !== id));
    }
    refreshStats();
  }, [isFirebaseReady]);

  const getWorkOrderById = useCallback((id: string) => {
    return workOrders.find(wo => wo.id === id);
  }, [workOrders]);

  const getWorkOrdersByMechanic = useCallback((mechanicId: string) => {
    return workOrders.filter(wo => wo.assignedTo.includes(mechanicId));
  }, [workOrders]);

  const getWorkOrdersByStatus = useCallback((status: WorkOrderStatus) => {
    return workOrders.filter(wo => wo.status === status);
  }, [workOrders]);

  // ============ INVENTARIO ============
  const addPart = useCallback(async (part: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newPart = {
      ...part,
      createdAt: now,
      updatedAt: now,
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await partsService.add(newPart);
      refreshStats();
      return id;
    } else {
      const id = generateId();
      setParts(prev => [...prev, { ...newPart, id }]);
      refreshStats();
      return id;
    }
  }, [isFirebaseReady]);

  const updatePart = useCallback(async (id: string, data: Partial<Part>) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await partsService.update(id, data);
    } else {
      setParts(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date() } : p));
    }
  }, [isFirebaseReady]);

  const updateStock = useCallback(async (partId: string, quantity: number, type: 'entrada' | 'salida') => {
    if (USE_FIREBASE && isFirebaseReady) {
      const part = parts.find(p => p.id === partId);
      if (part) {
        const newStock = type === 'entrada' ? part.stock + quantity : part.stock - quantity;
        await partsService.update(partId, { stock: Math.max(0, newStock), updatedAt: new Date() } as Partial<Part>);
      }
    } else {
      setParts(prev => prev.map(p => {
        if (p.id !== partId) return p;
        const newStock = type === 'entrada' ? p.stock + quantity : p.stock - quantity;
        return { ...p, stock: Math.max(0, newStock), updatedAt: new Date() };
      }));
    }
    refreshStats();
  }, [isFirebaseReady, parts]);

  const deletePart = useCallback(async (id: string) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await partsService.delete(id);
    } else {
      setParts(prev => prev.filter(p => p.id !== id));
    }
    refreshStats();
  }, [isFirebaseReady]);

  const getPartById = useCallback((id: string) => {
    return parts.find(p => p.id === id);
  }, [parts]);

  const getLowStockParts = useCallback(() => {
    return parts.filter(p => p.stock <= p.minStock && p.isActive);
  }, [parts]);

  // ============ VENTAS ============
  const addSale = useCallback(async (sale: Omit<Sale, 'id' | 'saleNumber' | 'createdAt'>) => {
    const newSale = {
      ...sale,
      saleNumber: generateSaleNumber(),
      createdAt: new Date(),
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await salesService.add(newSale);
      
      // Descontar stock
      for (const item of sale.items) {
        await updateStock(item.partId, item.quantity, 'salida');
      }
      
      // Crear transacción
      const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
        type: 'ingreso',
        category: 'venta_repuestos',
        amount: sale.total,
        description: `Venta repuestos ${newSale.saleNumber}`,
        referenceId: id,
        referenceType: 'sale',
        createdBy: sale.soldBy,
        date: new Date(),
      };
      await addTransaction(transaction);
      refreshStats();
      return id;
    } else {
      const id = generateId();
      setSales(prev => [...prev, { ...newSale, id }]);
      
      // Descontar stock
      sale.items.forEach(item => {
        updateStock(item.partId, item.quantity, 'salida');
      });
      
      // Crear transacción
      const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
        type: 'ingreso',
        category: 'venta_repuestos',
        amount: sale.total,
        description: `Venta repuestos ${newSale.saleNumber}`,
        referenceId: id,
        referenceType: 'sale',
        createdBy: sale.soldBy,
        date: new Date(),
      };
      addTransaction(transaction);
      refreshStats();
      return id;
    }
  }, [isFirebaseReady, updateStock]);

  const getSaleById = useCallback((id: string) => {
    return sales.find(s => s.id === id);
  }, [sales]);

  // ============ TRANSACCIONES ============
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction = {
      ...transaction,
      createdAt: new Date(),
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await transactionsService.add(newTransaction);
      refreshStats();
      return id;
    } else {
      const id = generateId();
      setTransactions(prev => [...prev, { ...newTransaction, id }]);
      refreshStats();
      return id;
    }
  }, [isFirebaseReady]);

  const getTransactionsByDateRange = useCallback((start: Date, end: Date) => {
    return transactions.filter(t => t.date >= start && t.date <= end);
  }, [transactions]);

  // ============ NOTIFICACIONES ============
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      isRead: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ============ NOTIFICACIONES A CLIENTES ============
  const addCustomerNotification = useCallback(async (notification: Omit<CustomerNotification, 'id' | 'createdAt' | 'status'>) => {
    const newNotification = {
      ...notification,
      status: 'pendiente' as const,
      createdAt: new Date(),
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await customerNotificationsService.add(newNotification);
      return id;
    } else {
      const id = generateId();
      setCustomerNotifications(prev => [...prev, { ...newNotification, id }]);
      return id;
    }
  }, [isFirebaseReady]);

  const sendCustomerNotification = useCallback(async (id: string, channel: NotificationChannel) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await customerNotificationsService.update(id, { 
        channel, 
        status: 'enviado', 
        sentAt: new Date() 
      } as Partial<CustomerNotification>);
    } else {
      setCustomerNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, channel, status: 'enviado', sentAt: new Date() } : n
      ));
    }
  }, [isFirebaseReady]);

  const markCustomerNotificationAsRead = useCallback(async (id: string) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await customerNotificationsService.update(id, { 
        status: 'leido', 
        readAt: new Date() 
      } as Partial<CustomerNotification>);
    } else {
      setCustomerNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, status: 'leido', readAt: new Date() } : n
      ));
    }
  }, [isFirebaseReady]);

  const getPendingNotifications = useCallback(() => {
    return customerNotifications.filter(n => n.status === 'pendiente');
  }, [customerNotifications]);

  const getNotificationsByWorkOrder = useCallback((workOrderId: string) => {
    return customerNotifications.filter(n => n.workOrderId === workOrderId);
  }, [customerNotifications]);

  // ============ SERVICIOS DE TERCEROS ============
  const addThirdPartyService = useCallback(async (service: Omit<ThirdPartyService, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newService = {
      ...service,
      createdAt: now,
      updatedAt: now,
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await thirdPartyServicesService.add(newService);
      return id;
    } else {
      const id = generateId();
      setThirdPartyServices(prev => [...prev, { ...newService, id }]);
      return id;
    }
  }, [isFirebaseReady]);

  const updateThirdPartyService = useCallback(async (id: string, data: Partial<ThirdPartyService>) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await thirdPartyServicesService.update(id, { ...data, updatedAt: new Date() } as Partial<ThirdPartyService>);
    } else {
      setThirdPartyServices(prev => prev.map(s => 
        s.id === id ? { ...s, ...data, updatedAt: new Date() } : s
      ));
    }
  }, [isFirebaseReady]);

  const updateThirdPartyServiceStatus = useCallback(async (id: string, status: ThirdPartyServiceStatus) => {
    const now = new Date();
    const updates: Partial<ThirdPartyService> = { status, updatedAt: now };
    if (status === 'enviado') updates.sentAt = now;
    if (status === 'recibido') updates.receivedAt = now;
    
    if (USE_FIREBASE && isFirebaseReady) {
      await thirdPartyServicesService.update(id, updates);
    } else {
      setThirdPartyServices(prev => prev.map(s => {
        if (s.id !== id) return s;
        return { ...s, ...updates };
      }));
    }
  }, [isFirebaseReady]);

  const deleteThirdPartyService = useCallback(async (id: string) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await thirdPartyServicesService.delete(id);
    } else {
      setThirdPartyServices(prev => prev.filter(s => s.id !== id));
    }
  }, [isFirebaseReady]);

  const getThirdPartyServicesByWorkOrder = useCallback((workOrderId: string) => {
    return thirdPartyServices.filter(s => s.workOrderId === workOrderId);
  }, [thirdPartyServices]);

  const getPendingThirdPartyServices = useCallback(() => {
    return thirdPartyServices.filter(s => 
      s.status === 'pendiente_envio' || s.status === 'enviado' || s.status === 'en_proceso'
    );
  }, [thirdPartyServices]);

  // ============ COTIZACIONES ============
  const addQuote = useCallback(async (quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newQuote = {
      ...quote,
      quoteNumber: generateQuoteNumber(),
      createdAt: now,
      updatedAt: now,
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await quotesService.add(newQuote);
      return id;
    } else {
      const id = generateId();
      setQuotes(prev => [...prev, { ...newQuote, id }]);
      return id;
    }
  }, [isFirebaseReady]);

  const updateQuote = useCallback(async (id: string, data: Partial<Quote>) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await quotesService.update(id, data);
    } else {
      setQuotes(prev => prev.map(q => 
        q.id === id ? { ...q, ...data, updatedAt: new Date() } : q
      ));
    }
  }, [isFirebaseReady]);

  const updateQuoteStatus = useCallback(async (id: string, status: QuoteStatus) => {
    const now = new Date();
    const updates: Partial<Quote> = { status, updatedAt: now };
    if (status === 'aprobada') updates.approvedAt = now;
    
    if (USE_FIREBASE && isFirebaseReady) {
      await quotesService.update(id, updates);
    } else {
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    }
  }, [isFirebaseReady]);

  const deleteQuote = useCallback(async (id: string) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await quotesService.delete(id);
    } else {
      setQuotes(prev => prev.filter(q => q.id !== id));
    }
  }, [isFirebaseReady]);

  const getQuoteById = useCallback((id: string) => {
    return quotes.find(q => q.id === id);
  }, [quotes]);

  const getQuotesByClient = useCallback((clientId: string) => {
    return quotes.filter(q => q.clientId === clientId);
  }, [quotes]);

  const convertQuoteToWorkOrder = useCallback((quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return '';
    
    // Crear nueva orden de trabajo basada en la cotización
    const workOrderId = generateId();
    const newWorkOrder: WorkOrder = {
      id: workOrderId,
      orderNumber: generateOrderNumber(),
      clientId: quote.clientId,
      motorcycleId: quote.motorcycleId || '',
      workType: quote.workType,
      description: quote.description,
      status: 'pendiente',
      priority: 'media',
      assignedTo: [],
      assignedBy: quote.createdBy,
      createdAt: new Date(),
      laborCost: quote.laborItems.reduce((sum, item) => sum + item.total, 0),
      partsCost: quote.partsItems.reduce((sum, item) => sum + item.total, 0),
      totalCost: quote.total,
      createdBy: quote.createdBy,
    };
    
    setWorkOrders(prev => [...prev, newWorkOrder]);
    setQuotes(prev => prev.map(q => 
      q.id === quoteId ? { ...q, status: 'convertida', convertedToWorkOrderId: workOrderId } : q
    ));
    
    return workOrderId;
  }, [quotes]);

  // ============ POLÍTICAS DEL NEGOCIO ============
  const addBusinessPolicy = useCallback((policy: Omit<BusinessPolicy, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    const now = new Date();
    const newPolicy: BusinessPolicy = {
      ...policy,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setBusinessPolicies(prev => [...prev, newPolicy]);
    return id;
  }, []);

  const updateBusinessPolicy = useCallback((id: string, data: Partial<BusinessPolicy>) => {
    setBusinessPolicies(prev => prev.map(p => 
      p.id === id ? { ...p, ...data, updatedAt: new Date() } : p
    ));
  }, []);

  const deleteBusinessPolicy = useCallback((id: string) => {
    setBusinessPolicies(prev => prev.filter(p => p.id !== id));
  }, []);

  const getActivePolicies = useCallback(() => {
    return businessPolicies.filter(p => p.isActive).sort((a, b) => a.order - b.order);
  }, [businessPolicies]);

  // ============ STATS ============
  // ============ PRE-INSPECCIONES DE MOTO ============
  const addInspection = useCallback(async (inspection: Omit<MotorcycleInspection, 'id' | 'inspectedAt'>) => {
    const newInspection = {
      ...inspection,
      inspectedAt: new Date(),
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await inspectionsService.add(newInspection);
      return id;
    } else {
      const id = generateId();
      setInspections(prev => [...prev, { ...newInspection, id }]);
      return id;
    }
  }, [isFirebaseReady]);

  const updateInspection = useCallback(async (id: string, data: Partial<MotorcycleInspection>) => {
    if (USE_FIREBASE && isFirebaseReady) {
      await inspectionsService.update(id, data);
    } else {
      setInspections(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    }
  }, [isFirebaseReady]);

  const getInspectionsByMotorcycle = useCallback((motorcycleId: string) => {
    return inspections.filter(i => i.motorcycleId === motorcycleId);
  }, [inspections]);

  const getInspectionByWorkOrder = useCallback((workOrderId: string) => {
    return inspections.find(i => i.workOrderId === workOrderId);
  }, [inspections]);

  // ============ ITEMS DE TRABAJO DETALLADOS ============
  const addWorkOrderTask = useCallback(async (task: Omit<WorkOrderTask, 'id' | 'addedAt' | 'itemNumber'>) => {
    const now = new Date();
    
    // Obtener el número de ítem siguiente para esta orden
    const existingTasks = workOrderTasks.filter(t => t.orderId === task.orderId);
    const itemNumber = existingTasks.length + 1;
    
    const newTask = {
      ...task,
      itemNumber,
      addedAt: now,
    };
    
    if (USE_FIREBASE && isFirebaseReady) {
      const id = await workOrderTasksService.add(newTask);
      
      // Actualizar el costo total de la orden
      const order = workOrders.find(o => o.id === task.orderId);
      if (order) {
        const newLaborCost = task.type === 'mano_obra' ? order.laborCost + task.totalPrice : order.laborCost;
        const newPartsCost = task.type === 'repuesto' ? order.partsCost + task.totalPrice : order.partsCost;
        await updateWorkOrder(task.orderId, {
          laborCost: newLaborCost,
          partsCost: newPartsCost,
          totalCost: newLaborCost + newPartsCost,
        });
      }
      return id;
    } else {
      const id = generateId();
      setWorkOrderTasks(prev => [...prev, { ...newTask, id }]);
      
      // Actualizar el costo total de la orden
      const order = workOrders.find(o => o.id === task.orderId);
      if (order) {
        const newLaborCost = task.type === 'mano_obra' ? order.laborCost + task.totalPrice : order.laborCost;
        const newPartsCost = task.type === 'repuesto' ? order.partsCost + task.totalPrice : order.partsCost;
        updateWorkOrder(task.orderId, {
          laborCost: newLaborCost,
          partsCost: newPartsCost,
          totalCost: newLaborCost + newPartsCost,
        });
      }
      return id;
    }
  }, [isFirebaseReady, workOrderTasks, workOrders, updateWorkOrder]);

  const updateWorkOrderTask = useCallback((id: string, data: Partial<WorkOrderTask>) => {
    setWorkOrderTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteWorkOrderTask = useCallback((id: string) => {
    const task = workOrderTasks.find(t => t.id === id);
    if (task) {
      // Restar el costo de la orden
      const order = workOrders.find(o => o.id === task.orderId);
      if (order) {
        const newLaborCost = task.type === 'mano_obra' ? order.laborCost - task.totalPrice : order.laborCost;
        const newPartsCost = task.type === 'repuesto' ? order.partsCost - task.totalPrice : order.partsCost;
        updateWorkOrder(task.orderId, {
          laborCost: Math.max(0, newLaborCost),
          partsCost: Math.max(0, newPartsCost),
          totalCost: Math.max(0, newLaborCost + newPartsCost),
        });
      }
    }
    setWorkOrderTasks(prev => prev.filter(t => t.id !== id));
  }, [workOrderTasks, workOrders]);

  const getTasksByWorkOrder = useCallback((workOrderId: string) => {
    return workOrderTasks.filter(t => t.orderId === workOrderId).sort((a, b) => a.itemNumber - b.itemNumber);
  }, [workOrderTasks]);

  const updateTaskStatus = useCallback((id: string, status: WorkOrderTask['status']) => {
    setWorkOrderTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);

  const refreshStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = transactions.filter(t => t.date >= today);
    const todayRevenue = todayTransactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    const todayExpenses = todayTransactions
      .filter(t => t.type === 'egreso')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthRevenue = transactions
      .filter(t => t.date >= monthStart && t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const todaySales = sales.filter(s => s.createdAt >= today);
    
    setStats({
      totalOrders: workOrders.length,
      pendingOrders: workOrders.filter(wo => wo.status === 'pendiente').length,
      inProgressOrders: workOrders.filter(wo => wo.status === 'en_progreso').length,
      completedOrdersToday: workOrders.filter(wo => wo.completedAt && wo.completedAt >= today).length,
      revenueToday: todayRevenue,
      revenueMonth: monthRevenue,
      expensesToday: todayExpenses,
      lowStockItems: parts.filter(p => p.stock <= p.minStock).length,
      totalParts: parts.length,
      salesToday: todaySales.reduce((sum, s) => sum + s.total, 0),
      salesCountToday: todaySales.length,
    });
  }, [workOrders, parts, sales, transactions]);

  // ============ EXPORTAR BASE DE DATOS ============
  const exportDatabase = useCallback(() => {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '-');
    
    const database = {
      metadata: {
        exportDate: now.toISOString(),
        appName: 'ERP Taller Rudolf',
        version: '1.0.0',
      },
      clients,
      motorcycles,
      workOrders,
      parts,
      sales,
      transactions,
      warehouses,
      suppliers,
      customerNotifications,
      thirdPartyServices,
      quotes,
      businessPolicies,
      inspections,
      workOrderTasks,
      inventoryMovements,
      globalAuditLog,
    };
    
    const blob = new Blob([JSON.stringify(database, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo-manual-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [clients, motorcycles, workOrders, parts, sales, transactions, warehouses, suppliers, customerNotifications, thirdPartyServices, quotes, businessPolicies, inspections, workOrderTasks, inventoryMovements, globalAuditLog]);

  return (
    <ERPContext.Provider
      value={{
        clients,
        motorcycles,
        workOrders,
        parts,
        sales,
        transactions,
        warehouses,
        suppliers,
        notifications,
        customerNotifications,
        thirdPartyServices,
        quotes,
        businessPolicies,
        inspections,
        workOrderTasks,
        stats,
        inventoryMovements,
        globalAuditLog,
        addClient,
        updateClient,
        deleteClient,
        getClientById,
        addMotorcycle,
        updateMotorcycle,
        deleteMotorcycle,
        getMotorcyclesByClient,
        addWorkOrder,
        updateWorkOrder,
        updateWorkOrderStatus,
        deleteWorkOrder,
        getWorkOrderById,
        getWorkOrdersByMechanic,
        getWorkOrdersByStatus,
        addPart,
        updatePart,
        updateStock,
        deletePart,
        getPartById,
        getLowStockParts,
        addSale,
        getSaleById,
        addTransaction,
        getTransactionsByDateRange,
        addNotification,
        markNotificationAsRead,
        clearNotifications,
        addCustomerNotification,
        sendCustomerNotification,
        markCustomerNotificationAsRead,
        getPendingNotifications,
        getNotificationsByWorkOrder,
        addThirdPartyService,
        updateThirdPartyService,
        updateThirdPartyServiceStatus,
        deleteThirdPartyService,
        getThirdPartyServicesByWorkOrder,
        getPendingThirdPartyServices,
        addQuote,
        updateQuote,
        updateQuoteStatus,
        deleteQuote,
        getQuoteById,
        getQuotesByClient,
        convertQuoteToWorkOrder,
        addBusinessPolicy,
        updateBusinessPolicy,
        deleteBusinessPolicy,
        getActivePolicies,
        addInspection,
        updateInspection,
        getInspectionsByMotorcycle,
        getInspectionByWorkOrder,
        addWorkOrderTask,
        updateWorkOrderTask,
        deleteWorkOrderTask,
        getTasksByWorkOrder,
        updateTaskStatus,
        refreshStats,
        exportDatabase,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (context === undefined) {
    throw new Error('useERP debe usarse dentro de ERPProvider');
  }
  return context;
}
