import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, Users, Bike, ClipboardList, Package, 
  ShoppingCart, DollarSign, BarChart3, Settings, UserCog,
  ChevronLeft, ChevronRight, Wrench, Kanban, Bell, ExternalLink,
  FileText, Shield
} from 'lucide-react';
import type { UserRole } from '@/types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  module: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    href: '/', 
    module: 'dashboard',
    roles: ['admin', 'secretaria', 'maestro', 'ayudante', 'vendedor'] 
  },
  { 
    label: 'Tablero Visual', 
    icon: Kanban, 
    href: '/tablero', 
    module: 'tablero',
    roles: ['admin', 'secretaria', 'maestro', 'ayudante'] 
  },
  { 
    label: 'Clientes', 
    icon: Users, 
    href: '/clientes', 
    module: 'clientes',
    roles: ['admin', 'secretaria'] 
  },
  { 
    label: 'Motos', 
    icon: Bike, 
    href: '/motos', 
    module: 'motos',
    roles: ['admin', 'secretaria', 'maestro', 'ayudante'] 
  },
  { 
    label: 'Órdenes de Trabajo', 
    icon: ClipboardList, 
    href: '/ordenes', 
    module: 'ordenes',
    roles: ['admin', 'secretaria', 'maestro', 'ayudante'] 
  },
  { 
    label: 'Cotizaciones', 
    icon: FileText, 
    href: '/cotizaciones', 
    module: 'cotizaciones',
    roles: ['admin', 'secretaria'] 
  },
  { 
    label: 'Servicios de Terceros', 
    icon: ExternalLink, 
    href: '/terceros', 
    module: 'terceros',
    roles: ['admin', 'secretaria', 'maestro'] 
  },
  { 
    label: 'Notificaciones', 
    icon: Bell, 
    href: '/notificaciones', 
    module: 'notificaciones',
    roles: ['admin', 'secretaria'] 
  },
  { 
    label: 'Inventario', 
    icon: Package, 
    href: '/inventario', 
    module: 'inventario',
    roles: ['admin', 'vendedor'] 
  },
  { 
    label: 'Ventas', 
    icon: ShoppingCart, 
    href: '/ventas', 
    module: 'ventas',
    roles: ['admin', 'vendedor'] 
  },
  { 
    label: 'Finanzas', 
    icon: DollarSign, 
    href: '/finanzas', 
    module: 'finanzas',
    roles: ['admin'] 
  },
  { 
    label: 'Reportes', 
    icon: BarChart3, 
    href: '/reportes', 
    module: 'reportes',
    roles: ['admin'] 
  },
  { 
    label: 'Políticas', 
    icon: Shield, 
    href: '/politicas', 
    module: 'politicas',
    roles: ['admin', 'secretaria'] 
  },
  { 
    label: 'Usuarios', 
    icon: UserCog, 
    href: '/usuarios', 
    module: 'usuarios',
    roles: ['admin'] 
  },
  { 
    label: 'Configuración', 
    icon: Settings, 
    href: '/configuracion', 
    module: 'configuracion',
    roles: ['admin'] 
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, canAccessModule } = useAuth();
  
  if (!user) return null;

  const accessibleItems = navItems.filter(item => canAccessModule(item.module));

  const navigateTo = (href: string) => {
    window.location.hash = href;
  };

  const isActive = (href: string) => {
    const currentHash = window.location.hash.slice(1) || '/';
    return currentHash === href;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-slate-800",
        collapsed ? "justify-center px-2" : "px-4"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">RUDOLF</span>
              <span className="text-xs text-slate-400">Taller de Motos</span>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-orange-600 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {accessibleItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigateTo(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive(item.href)
                  ? "bg-orange-500 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive(item.href) ? "text-white" : "text-slate-400 group-hover:text-white"
              )} />
              {!collapsed && (
                <span className="text-sm font-medium text-left">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className={cn(
        "border-t border-slate-800 p-4",
        collapsed && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-slate-300">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">{user.name}</span>
              <span className="text-xs text-slate-400 capitalize">{user.role}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
