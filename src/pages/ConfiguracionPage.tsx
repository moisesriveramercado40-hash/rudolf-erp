import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
  Store, Clock, Bell, Shield, Save, CheckCircle, Download, Upload, Database, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useERP } from '@/context/ERPContext';

export function ConfiguracionPage() {
  const { exportDatabase, importDatabase } = useERP();
  const [saved, setSaved] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState({
    companyName: 'RUDOLF - Taller de Motos',
    companyRuc: '20123456789',
    companyAddress: 'Av. Principal 123, Lima',
    companyPhone: '01-234-5678',
    companyEmail: 'contacto@rudolf.com',
    workStartTime: '08:00',
    workEndTime: '18:00',
    lowStockAlert: true,
    orderCompletionAlert: true,
    newSaleAlert: false,
    autoBackup: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDownloadDB = () => {
    exportDatabase();
    setShowDownloadConfirm(false);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.json')) {
      setUploadFile(file);
      setShowUploadConfirm(true);
    }
    if (e.target) e.target.value = '';
  };

  const handleUploadDB = async () => {
    if (!uploadFile) return;
    try {
      const text = await uploadFile.text();
      const data = JSON.parse(text);
      if (!data.metadata || !data.clients) {
        alert('Archivo de respaldo inválido. Debe ser un archivo generado por RUDOLF ERP.');
        return;
      }
      importDatabase(data);
      setShowUploadConfirm(false);
      setUploadFile(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {
      alert('Error al leer el archivo. Asegúrese de que sea un archivo JSON válido.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500">Personaliza el sistema según tus necesidades</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="horario">Horario</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" />
                Información de la Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Taller</Label>
                  <Input 
                    value={config.companyName}
                    onChange={e => setConfig({...config, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RUC</Label>
                  <Input 
                    value={config.companyRuc}
                    onChange={e => setConfig({...config, companyRuc: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input 
                  value={config.companyAddress}
                  onChange={e => setConfig({...config, companyAddress: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input 
                    value={config.companyPhone}
                    onChange={e => setConfig({...config, companyPhone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={config.companyEmail}
                    onChange={e => setConfig({...config, companyEmail: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="horario" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Horario de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora de Apertura</Label>
                  <Input 
                    type="time"
                    value={config.workStartTime}
                    onChange={e => setConfig({...config, workStartTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora de Cierre</Label>
                  <Input 
                    type="time"
                    value={config.workEndTime}
                    onChange={e => setConfig({...config, workEndTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  El horario de trabajo se utiliza para calcular los tiempos de entrega estimados 
                  y las notificaciones de órdenes pendientes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notificaciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500" />
                Configuración de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Alerta de Stock Bajo</p>
                  <p className="text-sm text-slate-500">
                    Notificar cuando un producto esté por debajo del stock mínimo
                  </p>
                </div>
                <Switch 
                  checked={config.lowStockAlert}
                  onCheckedChange={v => setConfig({...config, lowStockAlert: v})}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Orden Completada</p>
                  <p className="text-sm text-slate-500">
                    Notificar cuando una orden de trabajo sea completada
                  </p>
                </div>
                <Switch 
                  checked={config.orderCompletionAlert}
                  onCheckedChange={v => setConfig({...config, orderCompletionAlert: v})}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Nueva Venta</p>
                  <p className="text-sm text-slate-500">
                    Notificar al administrador de cada nueva venta realizada
                  </p>
                </div>
                <Switch 
                  checked={config.newSaleAlert}
                  onCheckedChange={v => setConfig({...config, newSaleAlert: v})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Configuración del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Respaldo Automático</p>
                  <p className="text-sm text-slate-500">
                    Realizar respaldo automático de los datos cada 24 horas
                  </p>
                </div>
                <Switch 
                  checked={config.autoBackup}
                  onCheckedChange={v => setConfig({...config, autoBackup: v})}
                />
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Información del Sistema</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Versión</p>
                    <p className="font-medium">RUDOLF ERP v1.0.0</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Última actualización</p>
                    <p className="font-medium">{new Date().toLocaleDateString('es-PE')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Database Section */}
          <Card className="border-2 border-dashed border-slate-300">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-500" />
                Respaldo de Base de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">
                Descargue o restaure una copia completa de todos los datos del sistema (clientes, motos, órdenes, inventario, ventas, etc.)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className={cn(
                    "h-20 flex flex-col items-center justify-center gap-2 border-2 transition-all",
                    downloadSuccess
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                  )}
                  onClick={() => setShowDownloadConfirm(true)}
                >
                  {downloadSuccess ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-sm font-medium">¡Descarga iniciada!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-6 h-6 text-blue-500" />
                      <span className="text-sm font-medium">Descargar Base de Datos Completa</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-20 flex flex-col items-center justify-center gap-2 border-2 transition-all",
                    uploadSuccess
                      ? "border-green-400 bg-green-50 text-green-700"
                      : "border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadSuccess ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-sm font-medium">¡Datos restaurados!</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-orange-500" />
                      <span className="text-sm font-medium">Subir Base de Datos Completa</span>
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Importante:</strong> Al subir una base de datos, los datos actuales serán reemplazados por los del archivo. 
                  Se recomienda descargar un respaldo antes de restaurar.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Download Confirmation Dialog */}
      <AlertDialog open={showDownloadConfirm} onOpenChange={setShowDownloadConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-500" />
              Descargar Base de Datos
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se descargará un archivo JSON con <strong>toda la información del sistema</strong>: 
              clientes, motos, órdenes de trabajo, inventario, ventas, transacciones, cotizaciones y más.
              <br /><br />
              ¿Desea continuar con la descarga?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDownloadDB} className="bg-blue-500 hover:bg-blue-600">
              <Download className="w-4 h-4 mr-2" />
              Sí, Descargar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Confirmation Dialog */}
      <AlertDialog open={showUploadConfirm} onOpenChange={setShowUploadConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Restaurar Base de Datos
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-red-600">¡Atención!</strong> Esta acción reemplazará <strong>todos los datos actuales</strong> del sistema 
              con los datos del archivo seleccionado:
              <br /><br />
              <span className="font-medium text-slate-700">📄 {uploadFile?.name}</span>
              <br /><br />
              Los datos actuales se perderán si no tiene un respaldo previo. 
              <strong> ¿Está seguro de que desea continuar?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUploadFile(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUploadDB} className="bg-orange-500 hover:bg-orange-600">
              <Upload className="w-4 h-4 mr-2" />
              Sí, Restaurar Datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          className={cn(
            "min-w-[150px]",
            saved ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
          )}
          onClick={handleSave}
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Guardado
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
