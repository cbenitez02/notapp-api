# Servicio de Email con SendGrid

Este proyecto utiliza SendGrid para el envío de emails de verificación y restablecimiento de contraseña.

## Configuración

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=no-reply@yourdomain.com
SENDGRID_FROM_NAME=TickGuard

# Frontend URL para los enlaces en los emails
FRONTEND_URL=http://localhost:4200  # Para desarrollo
# FRONTEND_URL=https://yourdomain.com  # Para producción
```

### 2. Configuración de SendGrid

1. **Crear cuenta en SendGrid**: https://sendgrid.com/
2. **Verificar dominio/email**: En Settings > Sender Authentication
3. **Crear API Key**: En Settings > API Keys
   - Crear una nueva API Key con permisos de "Full Access" o "Mail Send"
   - Copiar la API Key generada a `SENDGRID_API_KEY`

### 3. Configuración del Frontend

El frontend debe tener las siguientes rutas para manejar los tokens:

- `/verify-email?token=<token>` - Para verificación de email
- `/reset-password?token=<token>` - Para restablecimiento de contraseña

## Funcionalidades Implementadas

### Verificación de Email

**Endpoint**: `POST /emailverification/create`

```json
{
  "userId": "user-uuid",
  "expiresInMinutes": 1440 // opcional, default 24 horas
}
```

**Endpoint**: `POST /emailverification/resend/:userId`

### Restablecimiento de Contraseña

**Endpoint**: `POST /passwordreset/request`

```json
{
  "email": "user@example.com"
}
```

**Endpoint**: `POST /passwordreset/reset`

```json
{
  "token": "reset-token-uuid",
  "newPassword": "newSecurePassword123"
}
```

## Templates de Email

Los emails utilizan plantillas HTML responsivas con:

- **Verificación de Email**:
  - Válido por 24 horas
  - Diseño con colores azules (#007bff)
  - Incluye versión texto plano

- **Restablecimiento de Contraseña**:
  - Válido por 1 hora
  - Diseño con colores rojos (#dc3545) para indicar urgencia
  - Advertencias de seguridad
  - Incluye versión texto plano

## Estructura de la Base de Datos

### Tabla: `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

## Seguridad

- **Rate Limiting**: Aplicado a todas las rutas de email
- **Tokens únicos**: Cada token es un UUID v4 único
- **Expiración**: Tokens con tiempo de vida limitado
- **Invalidación**: Tokens de un usuario se invalidan al crear uno nuevo
- **Uso único**: Los tokens se marcan como usados después del primer uso

## Limpieza Automática

El sistema incluye métodos para limpiar tokens expirados:

```typescript
// Eliminar tokens expirados
await passwordResetTokenRepository.deleteExpiredTokens();
```

## Testing

Para probar el servicio en desarrollo:

1. Configurar variables de entorno con una API Key de prueba de SendGrid
2. Usar un email verificado en SendGrid para `SENDGRID_FROM_EMAIL`
3. Los emails se enviarán a direcciones reales

## Troubleshooting

### Error: "Failed to send email"

- Verificar que `SENDGRID_API_KEY` sea válida
- Verificar que `SENDGRID_FROM_EMAIL` esté verificado en SendGrid
- Revisar los logs de SendGrid en su dashboard

### Error: "Invalid or expired reset token"

- El token puede haber expirado (1 hora para reset, 24 horas para verificación)
- El token puede ya haber sido usado
- Verificar que el token sea correcto y completo

### Emails no llegan

- Revisar la carpeta de spam
- Verificar que la dirección de destino sea válida
- Revisar los logs en el dashboard de SendGrid
