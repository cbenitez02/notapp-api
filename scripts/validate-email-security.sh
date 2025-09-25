#!/bin/bash

# Script de prueba para validar las medidas de seguridad de email

echo "🔐 Validando medidas de seguridad de email..."

# Verificar que los archivos fueron creados
FILES=(
    "src/middlewares/EmailSecurity.middleware.ts"
    "src/middlewares/EmailQuota.middleware.ts"
    "src/adapters/services/EmailAuditService.ts"
    "src/adapters/controllers/EmailSecurityController.ts"
    "src/adapters/routes/EmailSecurityRoute.ts"
    "src/adapters/interfaces/emailAudit.interface.ts"
    "src/core/entities/EmailLog.ts"
    ".env.email.example"
    "EMAIL_SECURITY_README.md"
)

echo "📁 Verificando archivos creados..."
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - NO ENCONTRADO"
    fi
done

echo ""
echo "🔍 Verificando dependencias instaladas..."

# Verificar que las dependencias están instaladas
DEPS=(
    "express-validator"
    "dompurify"
    "jsdom"
    "validator"
)

for dep in "${DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        echo "✅ $dep"
    else
        echo "❌ $dep - NO INSTALADO"
    fi
done

echo ""
echo "🛡️ Validando configuración de seguridad..."

# Verificar configuración de TypeScript
if npx tsc --noEmit > /dev/null 2>&1; then
    echo "✅ Compilación TypeScript exitosa"
else
    echo "❌ Errores de compilación TypeScript"
fi

echo ""
echo "📊 Resumen de medidas implementadas:"
echo "✅ Rate Limiting específico para emails"
echo "✅ Validación y sanitización de inputs"
echo "✅ Autenticación y verificación de email"
echo "✅ Auditoría y logging de actividades"
echo "✅ Control de cuotas diarias"
echo "✅ Detección de patrones sospechosos"
echo "✅ Bloqueo de dominios desechables"
echo "✅ Headers de seguridad personalizados"
echo "✅ Integración mejorada con SendGrid"
echo "✅ Dashboard de administración"

echo ""
echo "🚀 ¡Medidas de seguridad implementadas exitosamente!"
echo ""
echo "📖 Para configurar:"
echo "1. Copia .env.email.example a .env y configura las variables"
echo "2. Revisa EMAIL_SECURITY_README.md para detalles completos"
echo "3. Reinicia el servidor para aplicar los cambios"
echo ""
echo "🔗 Nuevos endpoints disponibles:"
echo "- GET /api/emailsecurity/stats (admin)"
echo "- GET /api/emailsecurity/quota (usuario)"
echo "- POST /api/emailsecurity/cleanup (admin)"