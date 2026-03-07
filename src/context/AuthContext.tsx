import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (roles: UserRole[]) => boolean;
  canAccessModule: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuarios de prueba para el ERP RUDOLF
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@rudolf.com',
    role: 'admin',
    phone: '999-999-999',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '2',
    name: 'María Gonzales',
    email: 'secretaria@rudolf.com',
    role: 'secretaria',
    phone: '999-888-777',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    email: 'maestro1@rudolf.com',
    role: 'maestro',
    phone: '999-777-666',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '4',
    name: 'Juan Pérez',
    email: 'maestro2@rudolf.com',
    role: 'maestro',
    phone: '999-666-555',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '5',
    name: 'Pedro Sánchez',
    email: 'ayudante1@rudolf.com',
    role: 'ayudante',
    phone: '999-555-444',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '6',
    name: 'Luis Torres',
    email: 'ayudante2@rudolf.com',
    role: 'ayudante',
    phone: '999-444-333',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '7',
    name: 'Diego Ramírez',
    email: 'ayudante3@rudolf.com',
    role: 'ayudante',
    phone: '999-333-222',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '8',
    name: 'Andrés Castro',
    email: 'ayudante4@rudolf.com',
    role: 'ayudante',
    phone: '999-222-111',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: '9',
    name: 'Ana López',
    email: 'ventas@rudolf.com',
    role: 'vendedor',
    phone: '999-111-000',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
];

// Permisos por módulo según rol
const MODULE_PERMISSIONS: Record<string, UserRole[]> = {
  'dashboard': ['admin', 'secretaria', 'maestro', 'ayudante', 'vendedor'],
  'tablero': ['admin', 'secretaria', 'maestro', 'ayudante'],
  'clientes': ['admin', 'secretaria'],
  'motos': ['admin', 'secretaria', 'maestro', 'ayudante'],
  'cotizaciones': ['admin', 'secretaria'],
  'ordenes': ['admin', 'secretaria', 'maestro', 'ayudante'],
  'terceros': ['admin', 'secretaria', 'maestro'],
  'notificaciones': ['admin', 'secretaria'],
  'inventario': ['admin', 'vendedor'],
  'ventas': ['admin', 'vendedor'],
  'finanzas': ['admin'],
  'reportes': ['admin'],
  'politicas': ['admin', 'secretaria'],
  'usuarios': ['admin'],
  'configuracion': ['admin'],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión guardada
    const savedUser = localStorage.getItem('rudolf_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulación de login - en producción sería una API call
    const foundUser = MOCK_USERS.find(u => u.email === email && u.isActive);
    
    if (foundUser && password === '123456') {
      setUser(foundUser);
      localStorage.setItem('rudolf_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rudolf_user');
  };

  const hasPermission = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canAccessModule = (module: string): boolean => {
    if (!user) return false;
    const allowedRoles = MODULE_PERMISSIONS[module] || [];
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users: MOCK_USERS,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        canAccessModule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
