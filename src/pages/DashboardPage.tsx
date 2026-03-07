import { useAuth } from '@/context/AuthContext';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { SecretariaDashboard } from '@/components/dashboard/SecretariaDashboard';
import { MecanicoDashboard } from '@/components/dashboard/MecanicoDashboard';
import { VendedorDashboard } from '@/components/dashboard/VendedorDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wrench className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500">No hay sesión activa</p>
        </CardContent>
      </Card>
    );
  }

  // Renderizar dashboard según el rol
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'secretaria':
      return <SecretariaDashboard />;
    case 'maestro':
    case 'ayudante':
      return <MecanicoDashboard />;
    case 'vendedor':
      return <VendedorDashboard />;
    default:
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500">Rol no reconocido</p>
          </CardContent>
        </Card>
      );
  }
}
