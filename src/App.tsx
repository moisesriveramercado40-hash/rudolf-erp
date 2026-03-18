import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ERPProvider, useERP } from '@/context/ERPContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientesPage } from '@/pages/ClientesPage';
import { MotosPage } from '@/pages/MotosPage';
import { OrdenesPage } from '@/pages/OrdenesPage';
import { InventarioPage } from '@/pages/InventarioPage';
import { VentasPage } from '@/pages/VentasPage';
import { FinanzasPage } from '@/pages/FinanzasPage';
import { ReportesPage } from '@/pages/ReportesPage';
import { UsuariosPage } from '@/pages/UsuariosPage';
import { ConfiguracionPage } from '@/pages/ConfiguracionPage';
import { Toaster } from '@/components/ui/sonner';

// Nuevos componentes para mejoras
import { VisualBoard } from '@/components/VisualBoard';
import { CustomerNotifications } from '@/components/CustomerNotifications';
import { ThirdPartyServices } from '@/components/ThirdPartyServices';
import { Quotes } from '@/components/Quotes';
import { BusinessPolicies } from '@/components/BusinessPolicies';

// Banner de estado de Firebase
function FirebaseStatusBanner() {
  const { firebaseError, isFirebaseConnected } = useERP();
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  if (firebaseError) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-amber-800 font-medium">Modo local</span>
          <span className="text-amber-600">— {firebaseError}</span>
        </div>
        <button 
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 text-xs font-medium"
        >
          Cerrar
        </button>
      </div>
    );
  }
  
  return null;
}

// Router simple basado en hash
function Router() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Cargando RUDOLF ERP...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ERPLoadingGate>
      <FirebaseStatusBanner />
      <MainLayout>
        <PageRouter path={currentPath} />
      </MainLayout>
    </ERPLoadingGate>
  );
}

// Gate que espera a que los datos de Firebase carguen
function ERPLoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useERP();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-slate-700 font-semibold text-lg">RUDOLF ERP</p>
            <p className="text-slate-500 text-sm mt-1">Conectando con la base de datos...</p>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Renderizador de páginas
function PageRouter({ path }: { path: string }) {
  const page = path.split('/')[1] || '';
  
  switch (page) {
    case '':
    case '/':
      return <DashboardPage />;
    case 'clientes':
      return <ClientesPage />;
    case 'motos':
      return <MotosPage />;
    case 'ordenes':
      return <OrdenesPage />;
    case 'inventario':
      return <InventarioPage />;
    case 'ventas':
      return <VentasPage />;
    case 'finanzas':
      return <FinanzasPage />;
    case 'reportes':
      return <ReportesPage />;
    case 'usuarios':
      return <UsuariosPage />;
    case 'configuracion':
      return <ConfiguracionPage />;
    case 'tablero':
      return <VisualBoard />;
    case 'notificaciones':
      return <CustomerNotifications />;
    case 'terceros':
      return <ThirdPartyServices />;
    case 'cotizaciones':
      return <Quotes />;
    case 'politicas':
      return <BusinessPolicies />;
    default:
      return <DashboardPage />;
  }
}

function App() {
  return (
    <AuthProvider>
      <ERPProvider>
        <Router />
        <Toaster position="top-right" />
      </ERPProvider>
    </AuthProvider>
  );
}

export default App;
