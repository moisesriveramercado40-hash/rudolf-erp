import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ERPProvider } from '@/context/ERPContext';
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

// Router simple basado en hash
function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
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

  // Renderizar página según la ruta
  const renderPage = () => {
    const path = currentPath.split('/')[1] || '';
    
    switch (path) {
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
      // Nuevas rutas para mejoras
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
  };

  return (
    <MainLayout>
      {renderPage()}
    </MainLayout>
  );
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
