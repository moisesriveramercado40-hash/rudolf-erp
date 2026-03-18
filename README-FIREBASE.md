# 🔥 Configuración de Firebase para ERP RUDOLF

## 📚 Documentación Disponible

| Documento | Descripción |
|-----------|-------------|
| **GUIA-DEPLOY-FIREBASE.md** | 📖 Guía completa paso a paso (35 min) |
| **QUICK-REFERENCE.md** | ⚡ Referencia rápida de comandos |
| **deploy-helper.sh** | 🛠️ Script de ayuda interactivo |

---

## 🚀 Inicio Rápido

### Opción 1: Guía Completa (Recomendado para principiantes)
Abre el archivo **`GUIA-DEPLOY-FIREBASE.md`** y sigue las instrucciones detalladas paso a paso.

### Opción 2: Script de Ayuda
```bash
./deploy-helper.sh
```

### Opción 3: Referencia Rápida
Abre **`QUICK-REFERENCE.md`** para ver comandos y URLs importantes.

---

## 📋 Resumen del Proceso

```
┌─────────────────────────────────────────────────────────────────┐
│  PASO 1: Crear proyecto en Firebase Console                     │
│  → https://console.firebase.google.com/                         │
├─────────────────────────────────────────────────────────────────┤
│  PASO 2: Configurar Firestore Database                          │
│  → Modo de prueba, región us-central                            │
├─────────────────────────────────────────────────────────────────┤
│  PASO 3: Obtener credenciales de Firebase                       │
│  → Copiar API Key, Auth Domain, Project ID, etc.                │
├─────────────────────────────────────────────────────────────────┤
│  PASO 4: Subir código a GitHub                                  │
│  → git init, git add, git commit, git push                      │
├─────────────────────────────────────────────────────────────────┤
│  PASO 5: Deploy en Netlify                                      │
│  → Conectar repo, configurar build, agregar variables           │
├─────────────────────────────────────────────────────────────────┤
│  PASO 6: Probar el sistema                                      │
│  → Login, crear cliente, crear orden de trabajo                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto:

```env
# Firebase Configuration (obtenidas de Firebase Console)
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# Habilitar Firebase
VITE_USE_FIREBASE=true
```

---

## 🗂️ Colecciones de Firestore

El sistema utiliza las siguientes colecciones:

| Colección | Descripción |
|-----------|-------------|
| `clients` | Clientes del taller |
| `motorcycles` | Motocicletas registradas |
| `workOrders` | Órdenes de trabajo |
| `parts` | Inventario de repuestos |
| `sales` | Registro de ventas |
| `transactions` | Transacciones financieras |
| `users` | Usuarios del sistema |
| `warehouses` | Almacenes |
| `suppliers` | Proveedores |
| `quotes` | Cotizaciones |
| `businessPolicies` | Políticas del negocio |
| `inspections` | Pre-inspecciones de motos |
| `workOrderTasks` | Items de trabajo detallados |

---

## 🔒 Reglas de Seguridad (Desarrollo)

Para desarrollo, usa estas reglas permisivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **IMPORTANTE**: Para producción, configura reglas de seguridad apropiadas.

---

## 💰 Formato de Moneda

El sistema está configurado para **Soles Peruanos (PEN)**:

- **Símbolo**: `S/`
- **Separador de decimales**: `.` (punto)
- **Separador de miles**: `,` (coma)
- **Ejemplo**: `S/ 1,234.56`

---

## 👤 Usuarios Predeterminados

| Rol | Usuario | Contraseña | Permisos |
|-----|---------|------------|----------|
| Administrador | `admin` | `admin123` | Acceso total |
| Secretaria | `secretaria` | `secretaria123` | Clientes, órdenes, cotizaciones |
| Maestro | `maestro` | `maestro123` | Taller, editar costos |
| Ayudante | `ayudante` | `ayudante123` | Ver órdenes, no editar costos |
| Vendedor | `vendedor` | `vendedor123` | Ventas, inventario |

---

## 🛠️ Solución de Problemas

### Error: "Firebase App named '[DEFAULT]' already exists"
```
Solución: Recarga la página (F5) o limpia la caché del navegador
```

### Error: "Permission denied"
```
Solución: Verifica las reglas de Firestore permitan lectura/escritura
```

### Los datos no se guardan
```
Solución: Verifica que VITE_USE_FIREBASE=true esté configurado
```

### Error de build en Netlify
```
Solución: Ejecuta 'npm run build' localmente para ver errores
```

---

## 📞 Enlaces Útiles

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Netlify Documentation](https://docs.netlify.com/)
- [GitHub](https://github.com/)

---

## ✅ Checklist Pre-Deploy

- [ ] Proyecto Firebase creado
- [ ] Firestore Database habilitada
- [ ] Credenciales de Firebase copiadas
- [ ] Archivo `.env` configurado
- [ ] Código subido a GitHub
- [ ] Repositorio conectado a Netlify
- [ ] Variables de entorno en Netlify configuradas
- [ ] Deploy exitoso
- [ ] Login funciona correctamente
- [ ] Crear cliente guarda en Firebase
- [ ] Crear orden de trabajo funciona

---

**¿Necesitas ayuda?** Consulta la guía completa en **`GUIA-DEPLOY-FIREBASE.md`**
