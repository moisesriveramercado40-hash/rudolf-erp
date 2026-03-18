import { useState } from 'react';
import { useERP } from '@/context/ERPContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Plus, Edit2, Trash2, Clock, DollarSign, Shield, 
  FileText, Package
} from 'lucide-react';
import type { BusinessPolicy } from '@/types';

// Categorías de políticas
const POLICY_CATEGORIES = [
  { id: 'general', label: 'General', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  { id: 'garantia', label: 'Garantía', icon: Shield, color: 'bg-green-100 text-green-700' },
  { id: 'pagos', label: 'Pagos', icon: DollarSign, color: 'bg-amber-100 text-amber-700' },
  { id: 'tiempos', label: 'Tiempos', icon: Clock, color: 'bg-purple-100 text-purple-700' },
  { id: 'repuestos', label: 'Repuestos', icon: Package, color: 'bg-orange-100 text-orange-700' },
];

// Diálogo para nueva/editar política
function PolicyDialog({ policy, onClose }: { policy?: BusinessPolicy; onClose: () => void }) {
  const { addBusinessPolicy, updateBusinessPolicy } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    category: policy?.category || 'general',
    title: policy?.title || '',
    content: policy?.content || '',
    order: policy?.order || 0,
    isActive: policy?.isActive ?? true,
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (policy) {
      updateBusinessPolicy(policy.id, formData);
    } else {
      addBusinessPolicy({
        category: formData.category as BusinessPolicy['category'],
        title: formData.title,
        content: formData.content,
        order: formData.order,
        isActive: formData.isActive,
      });
    }
    
    setIsOpen(false);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {policy ? (
          <Button variant="ghost" size="sm">
            <Edit2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Política
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{policy ? 'Editar Política' : 'Nueva Política'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(v) => setFormData({ ...formData, category: v as BusinessPolicy['category'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POLICY_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Política de Garantía"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Contenido *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describa la política..."
              rows={5}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Orden de Visualización</Label>
            <Input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Número menor = aparece primero</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="text-sm font-normal">Política activa</Label>
          </div>
          
          <Button type="submit" className="w-full">
            {policy ? 'Guardar Cambios' : 'Crear Política'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Tarjeta de política
function PolicyCard({ policy }: { policy: BusinessPolicy }) {
  const { deleteBusinessPolicy } = useERP();
  const categoryInfo = POLICY_CATEGORIES.find(c => c.id === policy.category);
  const Icon = categoryInfo?.icon || FileText;
  
  return (
    <Card className={`hover:shadow-md transition-shadow ${!policy.isActive ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${categoryInfo?.color || 'bg-gray-100'}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium">{policy.title}</p>
              {!policy.isActive && (
                <Badge variant="secondary">Inactiva</Badge>
              )}
            </div>
            
            <Badge variant="outline" className="text-xs mb-2">
              {categoryInfo?.label}
            </Badge>
            
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {policy.content}
            </p>
            
            <div className="flex items-center justify-end gap-1 mt-3">
              <PolicyDialog policy={policy} onClose={() => {}} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar política?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente la política "{policy.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteBusinessPolicy(policy.id)} className="bg-red-600 hover:bg-red-700">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Vista pública de políticas (para mostrar a clientes)
export function PublicPoliciesView() {
  const { getActivePolicies } = useERP();
  const policies = getActivePolicies();
  
  const policiesByCategory = POLICY_CATEGORIES.map(cat => ({
    ...cat,
    policies: policies.filter(p => p.category === cat.id),
  })).filter(cat => cat.policies.length > 0);
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Políticas del Taller</h2>
        <p className="text-muted-foreground">
          Información importante sobre nuestros servicios
        </p>
      </div>
      
      {policiesByCategory.map(category => {
        const Icon = category.icon;
        return (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${category.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">{category.label}</h3>
            </div>
            
            <div className="space-y-3 pl-4">
              {category.policies.map(policy => (
                <div key={policy.id} className="border-l-2 border-muted pl-4">
                  <p className="font-medium">{policy.title}</p>
                  <p className="text-sm text-muted-foreground">{policy.content}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {policies.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hay políticas configuradas
        </div>
      )}
    </div>
  );
}

// Componente principal de administración
export function BusinessPolicies() {
  const { businessPolicies, getActivePolicies } = useERP();
  const [activeTab, setActiveTab] = useState('all');
  
  const activePolicies = getActivePolicies();
  const inactivePolicies = businessPolicies.filter(p => !p.isActive);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Políticas del Negocio</h2>
          <p className="text-muted-foreground">Configura las políticas que se mostrarán a los clientes</p>
        </div>
        <PolicyDialog onClose={() => {}} />
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{activePolicies.length}</p>
            <p className="text-sm text-muted-foreground">Activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{inactivePolicies.length}</p>
            <p className="text-sm text-muted-foreground">Inactivas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{businessPolicies.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Vista Previa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Vista del Cliente</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <PublicPoliciesView />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs por categoría */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          {POLICY_CATEGORIES.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all">
          <div className="space-y-3">
            {businessPolicies
              .sort((a, b) => a.order - b.order)
              .map(policy => (
                <PolicyCard key={policy.id} policy={policy} />
              ))}
            {businessPolicies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay políticas registradas
              </div>
            )}
          </div>
        </TabsContent>
        
        {POLICY_CATEGORIES.map(cat => (
          <TabsContent key={cat.id} value={cat.id}>
            <div className="space-y-3">
              {businessPolicies
                .filter(p => p.category === cat.id)
                .sort((a, b) => a.order - b.order)
                .map(policy => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))}
              {businessPolicies.filter(p => p.category === cat.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay políticas en esta categoría
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Icono de ojo para vista previa
function Eye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
