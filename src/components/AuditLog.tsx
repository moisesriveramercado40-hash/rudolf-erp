import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, ArrowRightLeft, UserCheck, Package, 
  CheckCircle, Truck, FileText, Edit, Clock 
} from 'lucide-react';
import type { WorkOrderAuditEntry } from '@/types';

interface AuditLogProps {
  auditLog?: WorkOrderAuditEntry[];
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  created: Plus,
  status_changed: ArrowRightLeft,
  assigned: UserCheck,
  parts_requested: Package,
  parts_received: CheckCircle,
  completed: CheckCircle,
  delivered: Truck,
  note_added: FileText,
  modified: Edit,
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Creó la orden',
  status_changed: 'Cambió estado',
  assigned: 'Asignó mecánicos',
  parts_requested: 'Solicitó repuestos',
  parts_received: 'Recibió repuestos',
  completed: 'Completó orden',
  delivered: 'Entregó moto',
  note_added: 'Agregó nota',
  modified: 'Modificó orden',
};

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700',
  status_changed: 'bg-blue-100 text-blue-700',
  assigned: 'bg-purple-100 text-purple-700',
  parts_requested: 'bg-orange-100 text-orange-700',
  parts_received: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700',
  delivered: 'bg-teal-100 text-teal-700',
  note_added: 'bg-gray-100 text-gray-700',
  modified: 'bg-yellow-100 text-yellow-700',
};

export function AuditLog({ auditLog }: AuditLogProps) {
  const { users } = useAuth();
  
  if (!auditLog || auditLog.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay historial de actividades</p>
      </div>
    );
  }
  
  // Ordenar por fecha (más reciente primero)
  const sortedLog = [...auditLog].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  return (
    <ScrollArea className="max-h-[400px]">
      <div className="space-y-3">
        {sortedLog.map((entry, index) => {
          const Icon = ACTION_ICONS[entry.action] || Edit;
          const user = users.find(u => u.id === entry.userId);
          
          return (
            <div 
              key={entry.id} 
              className="flex gap-3 p-3 bg-muted/50 rounded-lg"
            >
              {/* Icono */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ACTION_COLORS[entry.action] || 'bg-gray-100'}`}>
                <Icon className="w-4 h-4" />
              </div>
              
              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs ${ACTION_COLORS[entry.action]}`}>
                    {ACTION_LABELS[entry.action] || entry.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                
                <p className="text-sm font-medium mt-1">
                  {user?.name || entry.userName || 'Usuario'}
                </p>
                
                <p className="text-sm text-muted-foreground">
                  {entry.details}
                </p>
                
                {entry.oldValue && entry.newValue && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="line-through">{entry.oldValue}</span>
                    {' → '}
                    <span className="text-green-600 font-medium">{entry.newValue}</span>
                  </p>
                )}
              </div>
              
              {/* Número de orden */}
              <div className="text-xs text-muted-foreground">
                #{sortedLog.length - index}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
