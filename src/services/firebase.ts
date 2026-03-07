import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import { firebaseConfig, COLLECTIONS } from '@/config/firebase';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper para convertir Timestamp a Date
const convertTimestamps = (data: DocumentData): DocumentData => {
  const result: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = convertTimestamps(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

// Helper para convertir Date a Timestamp
const datesToTimestamps = (data: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      result[key] = Timestamp.fromDate(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = datesToTimestamps(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
};

// Servicio genérico para operaciones CRUD
export class FirebaseService<T extends { id: string }> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private getCollectionRef() {
    return collection(db, this.collectionName);
  }

  private getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  // Obtener todos los documentos
  async getAll(): Promise<T[]> {
    const q = query(this.getCollectionRef(), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as T[];
  }

  // Obtener un documento por ID
  async getById(id: string): Promise<T | null> {
    const docSnap = await getDoc(this.getDocRef(id));
    if (!docSnap.exists()) return null;
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data()),
    } as T;
  }

  // Agregar un documento
  async add(data: Omit<T, 'id'>): Promise<string> {
    const dataWithTimestamps = datesToTimestamps(data as Record<string, unknown>);
    const docRef = await addDoc(this.getCollectionRef(), {
      ...dataWithTimestamps,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  // Actualizar un documento
  async update(id: string, data: Partial<T>): Promise<void> {
    const dataWithTimestamps = datesToTimestamps(data as Record<string, unknown>);
    await updateDoc(this.getDocRef(id), {
      ...dataWithTimestamps,
      updatedAt: Timestamp.now(),
    });
  }

  // Eliminar un documento
  async delete(id: string): Promise<void> {
    await deleteDoc(this.getDocRef(id));
  }

  // Escuchar cambios en tiempo real
  onSnapshot(callback: (data: T[]) => void): () => void {
    const q = query(this.getCollectionRef(), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      })) as T[];
      callback(data);
    });
  }

  // Consultar por campo
  async queryByField(field: string, value: unknown): Promise<T[]> {
    const q = query(this.getCollectionRef(), where(field, '==', value));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as T[];
  }
}

// Instancias de servicios para cada colección
export const clientsService = new FirebaseService(COLLECTIONS.CLIENTS);
export const motorcyclesService = new FirebaseService(COLLECTIONS.MOTORCYCLES);
export const workOrdersService = new FirebaseService(COLLECTIONS.WORK_ORDERS);
export const partsService = new FirebaseService(COLLECTIONS.PARTS);
export const salesService = new FirebaseService(COLLECTIONS.SALES);
export const transactionsService = new FirebaseService(COLLECTIONS.TRANSACTIONS);
export const usersService = new FirebaseService(COLLECTIONS.USERS);
export const warehousesService = new FirebaseService(COLLECTIONS.WAREHOUSES);
export const suppliersService = new FirebaseService(COLLECTIONS.SUPPLIERS);
export const notificationsService = new FirebaseService(COLLECTIONS.NOTIFICATIONS);
export const customerNotificationsService = new FirebaseService(COLLECTIONS.CUSTOMER_NOTIFICATIONS);
export const thirdPartyServicesService = new FirebaseService(COLLECTIONS.THIRD_PARTY_SERVICES);
export const quotesService = new FirebaseService(COLLECTIONS.QUOTES);
export const businessPoliciesService = new FirebaseService(COLLECTIONS.BUSINESS_POLICIES);
export const inspectionsService = new FirebaseService(COLLECTIONS.INSPECTIONS);
export const workOrderTasksService = new FirebaseService(COLLECTIONS.WORK_ORDER_TASKS);

export default {
  clients: clientsService,
  motorcycles: motorcyclesService,
  workOrders: workOrdersService,
  parts: partsService,
  sales: salesService,
  transactions: transactionsService,
  users: usersService,
  warehouses: warehousesService,
  suppliers: suppliersService,
  notifications: notificationsService,
  customerNotifications: customerNotificationsService,
  thirdPartyServices: thirdPartyServicesService,
  quotes: quotesService,
  businessPolicies: businessPoliciesService,
  inspections: inspectionsService,
  workOrderTasks: workOrderTasksService,
};
