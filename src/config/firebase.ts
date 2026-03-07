// Configuración de Firebase
// Reemplaza estos valores con los de tu proyecto de Firebase

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCL9DsquucoqYwXt0COb2f4huhVBN6nK3I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rudolf-erp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rudolf-erp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rudolf-erp.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "740277042343",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:740277042343:web:a3fed76ad15f2c995faf82"
};

// Colecciones de Firestore
export const COLLECTIONS = {
  CLIENTS: 'clients',
  MOTORCYCLES: 'motorcycles',
  WORK_ORDERS: 'workOrders',
  PARTS: 'parts',
  SALES: 'sales',
  TRANSACTIONS: 'transactions',
  USERS: 'users',
  WAREHOUSES: 'warehouses',
  SUPPLIERS: 'suppliers',
  NOTIFICATIONS: 'notifications',
  CUSTOMER_NOTIFICATIONS: 'customerNotifications',
  THIRD_PARTY_SERVICES: 'thirdPartyServices',
  QUOTES: 'quotes',
  BUSINESS_POLICIES: 'businessPolicies',
  INSPECTIONS: 'inspections',
  WORK_ORDER_TASKS: 'workOrderTasks',
} as const;
