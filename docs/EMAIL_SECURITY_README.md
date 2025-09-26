# 🔐 Medidas de Seguridad para Envío de Emails

Este documento describe las medidas de seguridad implementadas en el sistema de envío de emails del backend.

## 📋 Resumen de Medidas Implementadas

### 1. Rate Limiting Específico para Emails

- **Rate Limiting General**: 5 emails por IP cada 15 minutos
- **Rate Limiting de Reenvío**: 3 reenvíos por IP cada hora
- **Cuotas Diarias**: Límite configurable por usuario (50 emails por defecto)

### 2. Validación y Sanitización de Inputs

- ✅ Validación de formato de email con normalización
- ✅ Sanitización HTML de contenido usando DOMPurify
- ✅ Validación de longitud de campos
- ✅ Detección de patrones sospechosos
- ✅ Filtrado de caracteres peligrosos

### 3. Autenticación y Autorización

- ✅ Verificación JWT para envío de emails
- ✅ Verificación de email confirmado
- ✅ Roles y permisos diferenciados
- ✅ Headers de autenticación personalizados

### 4. Configuración Segura con SendGrid

- ✅ Headers de seguridad personalizados
- ✅ Seguimiento de emails enviados
- ✅ Validación previa al envío
- ✅ Manejo seguro de errores

### 5. Auditoría y Logging

- ✅ Logging completo de actividad de emails
- ✅ Detección de patrones sospechosos
- ✅ Auditoría de cuotas diarias
- ✅ Alertas de seguridad

### 6. Protección contra Dominios Sospechosos

- ✅ Lista negra de dominios desechables
- ✅ Validación de dominios permitidos (opcional)
- ✅ Detección de dominios temporales

## 🛡️ Middlewares de Seguridad

### EmailSecurity.middleware.ts

```typescript
// Rate limiting específico para emails
emailSendRateLimit;
emailResendRateLimit;

// Validación y sanitización
validateEmailInput;
sanitizeEmailContent;

// Autenticación específica
requireEmailVerification;

// Logging y auditoría
logEmailActivity;
```

### EmailQuota.middleware.ts

```typescript
// Control de cuotas
checkDailyEmailQuota(limit);

// Detección de patrones sospechosos
checkSuspiciousPatterns;

// Bloqueo de dominios
blockSuspiciousDomains;

// Headers de seguridad
addEmailSecurityHeaders;
```

## 📊 Monitoreo y Estadísticas

### Endpoints de Administración

```
GET /api/email-security/stats    - Estadísticas generales (admin)
GET /api/email-security/quota    - Estado de cuota del usuario
POST /api/email-security/cleanup - Limpieza de datos antiguos (admin)
```

### Métricas Monitoreadas

- Total de emails enviados por día
- Actividades sospechosas detectadas
- Usuarios activos
- Intentos bloqueados
- Patrones de uso anómalos

## ⚙️ Configuración

### Variables de Entorno

```bash
# Seguridad básica
ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,company.com
ENABLE_DOMAIN_VALIDATION=true
MAX_DAILY_EMAILS_PER_USER=50

# Rate limiting
EMAIL_RATE_LIMIT_WINDOW_MS=900000
EMAIL_RATE_LIMIT_MAX_REQUESTS=5

# SendGrid
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourapp.com
SENDGRID_FROM_NAME=NotApp
```

## 🔍 Patrones Sospechosos Detectados

### Contenido Sospechoso

- Scripts maliciosos (`javascript:`, `<script>`)
- Intentos de phishing (`verify account immediately`)
- Contenido de spam (`urgent action`, `click here now`)
- Data URIs sospechosos (`data:text/html`)

### Comportamiento Sospechoso

- Múltiples intentos desde la misma IP
- Exceso de emails del mismo usuario
- User-Agents de bots conocidos
- Patrones de tiempo anómalos

## 🚨 Respuesta a Incidentes

### Acciones Automáticas

1. **Bloqueo temporal** de IPs sospechosas
2. **Limitación de cuota** para usuarios problemáticos
3. **Logging detallado** de todas las actividades
4. **Alertas en tiempo real** para actividades críticas

### Notificaciones

- Logs en consola con emojis para fácil identificación
- Headers HTTP informativos sobre estado de cuota
- Respuestas HTTP específicas con códigos de error claros

## 📝 Uso de las Medidas de Seguridad

### En Rutas de Verificación de Email

```typescript
router.post(
  '/create',
  addEmailSecurityHeaders,
  emailSendRateLimit,
  blockSuspiciousDomains,
  validateEmailInput,
  sanitizeEmailContent,
  checkDailyEmailQuota(10),
  logEmailActivity,
  controller.createToken,
);
```

### En Rutas de Recuperación de Contraseña

```typescript
router.post(
  '/request',
  addEmailSecurityHeaders,
  passwordResetRateLimit,
  blockSuspiciousDomains,
  validateEmailInput,
  sanitizeEmailContent,
  checkDailyEmailQuota(3),
  logEmailActivity,
  controller.requestPasswordReset,
);
```

## 🔧 Mantenimiento

### Limpieza Automática

- Datos de cuotas se limpian automáticamente cada día
- Actividades sospechosas se mantienen por 7 días
- Logs se rotan según configuración

### Comandos de Mantenimiento

```bash
# Limpiar datos antiguos manualmente
POST /api/email-security/cleanup
```

## 🎯 Ventajas de SendGrid

SendGrid ya maneja automáticamente:

- ✅ **SPF, DKIM, DMARC** - Autenticación de emails
- ✅ **Bounce handling** - Manejo de emails rebotados
- ✅ **Spam filtering** - Filtrado de spam
- ✅ **IP reputation** - Reputación de IPs
- ✅ **Delivery optimization** - Optimización de entrega
- ✅ **Compliance** - Cumplimiento con regulaciones

## 🚀 Próximas Mejoras

1. **Integración con base de datos** para persistencia de logs
2. **Dashboard de monitoreo** en tiempo real
3. **Machine learning** para detección avanzada de patrones
4. **Integración con servicios externos** de verificación de emails
5. **API de reputación** de dominios y IPs
6. **Notificaciones push** para administradores

---

## ⚠️ Notas Importantes

- Las medidas implementadas son **multicapa** para máxima protección
- El sistema es **configurable** mediante variables de entorno
- Los logs son **estructurados** para fácil análisis
- La implementación es **escalable** y **performante**
- Compatible con **arquitectura de microservicios**

Para más información, consulta la documentación técnica de cada middleware.
