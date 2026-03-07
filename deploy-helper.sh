#!/bin/bash

# Script de ayuda para deploy del ERP RUDOLF
# Este script te guía paso a paso para publicar el ERP

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🏍️  ERP RUDOLF - Helper de Deploy a Firebase/Netlify    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependencias
echo "📋 Verificando dependencias..."
echo ""

if ! command_exists git; then
    echo "❌ Git no está instalado. Instálalo desde: https://git-scm.com/"
    exit 1
else
    echo "✅ Git instalado"
fi

if ! command_exists node; then
    echo "❌ Node.js no está instalado. Instálalo desde: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js instalado: $NODE_VERSION"
fi

if ! command_exists npm; then
    echo "❌ npm no está instalado"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo "✅ npm instalado: $NPM_VERSION"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar archivo .env
echo "📄 Verificando configuración..."
if [ -f ".env" ]; then
    echo "✅ Archivo .env encontrado"
    
    # Verificar si tiene las variables de Firebase
    if grep -q "VITE_FIREBASE_API_KEY" .env; then
        echo "✅ Variables de Firebase configuradas"
    else
        echo "⚠️  No se encontraron variables de Firebase en .env"
        echo "   Por favor configura el archivo .env primero"
    fi
else
    echo "⚠️  No se encontró archivo .env"
    echo "   Crea un archivo .env con tus credenciales de Firebase"
    echo ""
    echo "   Ejemplo:"
    echo "   VITE_FIREBASE_API_KEY=tu_api_key"
    echo "   VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com"
    echo "   VITE_FIREBASE_PROJECT_ID=tu_proyecto"
    echo "   VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com"
    echo "   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id"
    echo "   VITE_FIREBASE_APP_ID=tu_app_id"
    echo "   VITE_USE_FIREBASE=true"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Menú de opciones
echo "🚀 ¿Qué deseas hacer?"
echo ""
echo "  1) Construir el proyecto localmente (npm run build)"
echo "  2) Verificar configuración de Firebase"
echo "  3) Preparar para deploy (git add, commit)"
echo "  4) Ver instrucciones completas"
echo "  5) Salir"
echo ""
read -p "Selecciona una opción (1-5): " option

case $option in
    1)
        echo ""
        echo "🔨 Construyendo proyecto..."
        npm run build
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Build exitoso!"
            echo "📁 Los archivos están en la carpeta 'dist/'"
            echo ""
            echo "Para probar localmente, ejecuta:"
            echo "  npm run preview"
        else
            echo ""
            echo "❌ Error en el build. Revisa los errores arriba."
        fi
        ;;
    
    2)
        echo ""
        echo "🔍 Verificando configuración de Firebase..."
        if [ -f "src/config/firebase.ts" ]; then
            echo "✅ Archivo firebase.ts encontrado"
            echo ""
            echo "Colecciones configuradas:"
            grep "export const COLLECTIONS" -A 20 src/config/firebase.ts | grep -E "^\s+\w+:" | head -15
        else
            echo "❌ No se encontró src/config/firebase.ts"
        fi
        ;;
    
    3)
        echo ""
        echo "📦 Preparando para deploy..."
        
        # Verificar si es un repositorio git
        if [ -d ".git" ]; then
            echo "✅ Repositorio Git inicializado"
        else
            echo "🔄 Inicializando repositorio Git..."
            git init
            git branch -M main
        fi
        
        echo ""
        read -p "Mensaje del commit (default: 'Update ERP RUDOLF'): " commit_msg
        commit_msg=${commit_msg:-"Update ERP RUDOLF"}
        
        echo ""
        echo "➕ Agregando archivos..."
        git add .
        
        echo "💾 Creando commit..."
        git commit -m "$commit_msg"
        
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "✅ Commit creado exitosamente!"
        echo ""
        echo "Para subir a GitHub, ejecuta:"
        echo "  git push origin main"
        echo ""
        echo "Si aún no has conectado con GitHub:"
        echo "  git remote add origin https://github.com/TU_USUARIO/rudolf-erp.git"
        echo "  git push -u origin main"
        ;;
    
    4)
        echo ""
        echo "📖 Abriendo guía completa..."
        if [ -f "GUIA-DEPLOY-FIREBASE.md" ]; then
            cat GUIA-DEPLOY-FIREBASE.md
        else
            echo "❌ No se encontró GUIA-DEPLOY-FIREBASE.md"
        fi
        ;;
    
    5)
        echo ""
        echo "👋 ¡Hasta luego!"
        exit 0
        ;;
    
    *)
        echo ""
        echo "❌ Opción inválida"
        exit 1
        ;;
esac
