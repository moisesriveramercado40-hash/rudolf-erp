import { useAuth } from '@/context/AuthContext';
import { useERP } from '@/context/ERPContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bell, LogOut, User, Settings, Menu,
  CheckCircle, AlertTriangle, Package, Wrench 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import type { Notification } from '@/types';

interface HeaderProps {
  onMenuToggle: () => void;
  isMobile?: boolean;
}

export function Header({ onMenuToggle, isMobile = false }: HeaderProps) {
  const { user, logout } = useAuth();
  const { notifications, markNotificationAsRead, stats, isFirebaseConnected } = useERP();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(date);
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'short', day: 'numeric', month: 'short',
    }).format(date);
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-40">
      {/* Left: Menu + Date */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hamburger menu */}
        <button 
          onClick={onMenuToggle} 
          className="p-2 -ml-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        
        {/* Date - full on desktop, short on mobile */}
        <div className="flex items-center gap-2 text-slate-500">
          <span className="hidden md:inline text-sm font-medium capitalize">{formatDate(currentTime)}</span>
          <span className="md:hidden text-xs font-medium capitalize">{formatDateShort(currentTime)}</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-sm">{formatTime(currentTime)}</span>
          <span className="text-slate-300 hidden lg:inline">|</span>
          <span className={cn(
            "hidden lg:flex items-center gap-1 text-xs",
            isFirebaseConnected ? "text-green-600" : "text-amber-600"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", isFirebaseConnected ? "bg-green-500" : "bg-amber-500")} />
            {isFirebaseConnected ? 'Firebase' : 'Local'}
          </span>
        </div>
      </div>

      {/* Right: Alerts + Notifications + User */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Stock alert - icon only on mobile */}
        {stats.lowStockItems > 0 && (
          <>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs">
              <Package className="w-3.5 h-3.5" />
              <span className="font-medium">{stats.lowStockItems} bajo</span>
            </div>
            <div className="sm:hidden relative">
              <Package className="w-4 h-4 text-red-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                {stats.lowStockItems}
              </span>
            </div>
          </>
        )}

        {/* Pending orders - icon only on mobile */}
        {stats.pendingOrders > 0 && (
          <>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs">
              <Wrench className="w-3.5 h-3.5" />
              <span className="font-medium">{stats.pendingOrders} pend.</span>
            </div>
            <div className="sm:hidden relative">
              <Wrench className="w-4 h-4 text-orange-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                {stats.pendingOrders}
              </span>
            </div>
          </>
        )}

        {/* Notifications */}
        <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 sm:w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <span className="text-xs text-slate-500">{unreadCount} sin leer</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer",
                      !notification.isRead && "bg-slate-50"
                    )}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-white">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium leading-tight">{user?.name}</span>
                <span className="text-[10px] text-slate-500 capitalize">{user?.role}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="w-4 h-4 mr-2" />Perfil</DropdownMenuItem>
            <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />Configuración</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
