# 🚀 QUICK REFERENCE - ERP RUDOLF Deploy

## ⚡ Comandos Rápidos

### Build Local
```bash
npm run build
npm run preview
```

### Git (Subir cambios)
```bash
git add .
git commit -m "mensaje"
git push origin main
```

### Script de Ayuda
```bash
./deploy-helper.sh
```

---

## 🔗 URLs Importantes

| Servicio | URL |
|----------|-----|
| Firebase Console | https://console.firebase.google.com/ |
| Netlify Dashboard | https://app.netlify.com/ |
| GitHub | https://github.com/ |

---

## 📋 Variables de Entorno Requeridas

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE=true
```

---

## 👤 Credenciales de Prueba

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `admin123` |
| Secretaria | `secretaria` | `secretaria123` |
| Maestro | `maestro` | `maestro123` |
| Ayudante | `ayudante` | `ayudante123` |
| Vendedor | `vendedor` | `vendedor123` |

---

## 🛠️ Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| "Permission denied" | Revisa reglas de Firestore |
| Datos no se guardan | Verifica `VITE_USE_FIREBASE=true` |
| Página en blanco | Revisa que Publish directory sea `dist` |
| Error de build | Ejecuta `npm run build` localmente |

---

## 📁 Estructura de Firestore

```
clients/           - Clientes
motorcycles/       - Motocicletas
workOrders/        - Órdenes de trabajo
parts/             - Repuestos
sales/             - Ventas
transactions/      - Finanzas
users/             - Usuarios
quotes/            - Cotizaciones
inspections/       - Pre-inspecciones
workOrderTasks/    - Items de trabajo
```

---

## 💰 Formato de Moneda

- **Símbolo**: `S/`
- **Ejemplo**: `S/ 1,234.56`
- **Separador decimal**: Punto (`.`)

---

## 📞 Soporte

- Documentación Firebase: https://firebase.google.com/docs
- Documentación Netlify: https://docs.netlify.com/

---

**Guarda esta referencia rápida para consultas futuras!** 📌
