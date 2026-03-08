import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, Plus, Edit, Trash2, Phone,
  Shield, Wrench, ShoppingCart, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

// Usuarios de demostración extendidos
const DEMO_USERS = [
  { id: '1', name: 'Administrador', email: 'admin@rudolf.com', role: 'admin' as UserRole, phone: '999-999-999', isActive: true },
  { id: '2', name: 'María Gonzales', email: 'secretaria@rudolf.com', role: 'secretaria' as UserRole, phone: '999-888-777', isActive: true },
  { id: '3', name: 'Carlos Rodríguez', email: 'maestro1@rudolf.com', role: 'maestro' as UserRole, phone: '999-777-666', isActive: true },
  { id: '4', name: 'Juan Pérez', email: 'maestro2@rudolf.com', role: 'maestro' as UserRole, phone: '999-666-555', isActive: true },
  { id: '5', name: 'Pedro Sánchez', email: 'ayudante1@rudolf.com', role: 'ayudante' as UserRole, phone: '999-555-444', isActive: true },
  { id: '6', name: 'Luis Torres', email: 'ayudante2@rudolf.com', role: 'ayudante' as UserRole, phone: '999-444-333', isActive: true },
  { id: '7', name: 'Diego Ramírez', email: 'ayudante3@rudolf.com', role: 'ayudante' as UserRole, phone: '999-333-222', isActive: true },
  { id: '8', name: 'Andrés Castro', email: 'ayudante4@rudolf.com', role: 'ayudante' as UserRole, phone: '999-222-111', isActive: true },
  { id: '9', name: 'Ana López', email: 'ventas@rudolf.com', role: 'vendedor' as UserRole, phone: '999-111-000', isActive: true },
];

const ROLE_OPTIONS: { value: UserRole; label: string; icon: React.ElementType }[] = [
  { value: 'admin', label: 'Administrador', icon: Shield },
  { value: 'secretaria', label: 'Secretaria', icon: ClipboardList },
  { value: 'maestro', label: 'Maestro Mecánico', icon: Wrench },
  { value: 'ayudante', label: 'Ayudante', icon: Wrench },
  { value: 'vendedor', label: 'Vendedor', icon: ShoppingCart },
];

export function UsuariosPage() {
  const [users, setUsers] = useState(DEMO_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof DEMO_USERS[0] | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ayudante' as UserRole,
    password: '',
  });

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      secretaria: 'bg-blue-100 text-blue-700 border-blue-200',
      maestro: 'bg-orange-100 text-orange-700 border-orange-200',
      ayudante: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      vendedor: 'bg-green-100 text-green-700 border-green-200',
    };
    return styles[role] || 'bg-slate-100 text-slate-700';
  };

  const getRoleLabel = (role: UserRole) => {
    return ROLE_OPTIONS.find(r => r.value === role)?.label || role;
  };

  const handleAdd = () => {
    const newUser = {
      id: Date.now().toString(),
      ...formData,
      isActive: true,
    };
    setUsers([...users, newUser]);
    setShowAddDialog(false);
    setFormData({ name: '', email: '', phone: '', role: 'ayudante', password: '' });
  };

  const handleEdit = () => {
    if (selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
      setShowEditDialog(false);
    }
  };

  const handleDelete = (user: typeof DEMO_USERS[0]) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const openEdit = (user: typeof DEMO_USERS[0]) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
    });
    setShowEditDialog(true);
  };

  const toggleStatus = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-slate-500">Administra el personal del taller</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {ROLE_OPTIONS.map(role => (
          <Card key={role.value}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <role.icon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{role.label}</p>
                  <p className="text-xl font-bold">{users.filter(u => u.role === role.value).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getRoleBadge(user.role))}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {user.phone}
                        </p>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleStatus(user.id)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                            user.isActive 
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea una nueva cuenta de usuario para el sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={formData.role} onValueChange={(v: UserRole) => setFormData({...formData, role: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input 
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleAdd}>
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={formData.role} onValueChange={(v: UserRole) => setFormData({...formData, role: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleEdit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar al usuario <strong>{selectedUser?.name}</strong>? 
              Esta acción no se puede deshacer y el usuario perderá acceso al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Eliminar Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
