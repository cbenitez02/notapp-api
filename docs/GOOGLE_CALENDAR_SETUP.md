# Google Calendar Integration Setup

Esta guía te ayudará a configurar la integración con Google Calendar en tu aplicación.

## Configuración de Google Cloud Console

### 1. Crear un Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el ID del proyecto

### 2. Habilitar la API de Google Calendar

1. En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Google Calendar API"
3. Haz clic en "Google Calendar API" y luego en "HABILITAR"

### 3. Configurar OAuth 2.0

1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "CREAR CREDENCIALES" > "ID de cliente de OAuth 2.0"
3. Si no has configurado la pantalla de consentimiento, se te pedirá que lo hagas:
   - Selecciona "Externo" como tipo de usuario
   - Completa la información requerida (nombre de la aplicación, email de soporte, etc.)
   - En "Dominios autorizados", añade tu dominio (opcional para desarrollo)
   - Guarda los cambios

4. Una vez configurada la pantalla de consentimiento, crea las credenciales OAuth:
   - Tipo de aplicación: "Aplicación web"
   - Nombre: "NotApp API Google Calendar"
   - URIs de origen autorizados: `http://localhost:3000` (o tu dominio de producción)
   - URIs de redirección autorizados: `http://localhost:3000/api/google-calendar/callback`

5. Guarda las credenciales y anota:
   - **Client ID**
   - **Client Secret**

## Configuración de Variables de Entorno

Añade las siguientes variables a tu archivo `.env`:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

Para producción, cambia la GOOGLE_REDIRECT_URI a tu dominio real:

```env
GOOGLE_REDIRECT_URI=https://tudominio.com/api/google-calendar/callback
```

## Configuración de Base de Datos

La integración requiere una tabla para almacenar las integraciones de Google Calendar. Ejecuta la siguiente migración:

```sql
CREATE TABLE google_calendar_integrations (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  googleAccountId VARCHAR(255) NOT NULL,
  googleEmail VARCHAR(255) NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  tokenExpiresAt DATETIME NOT NULL,
  calendarId VARCHAR(255) NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_id (userId),
  INDEX idx_google_account_id (googleAccountId),
  INDEX idx_is_active (isActive),
  INDEX idx_token_expires_at (tokenExpiresAt)
);
```

## API Endpoints

### 1. Iniciar Autorización

```
GET /api/google-calendar/authorize
Headers: Authorization: Bearer <jwt_token>
```

Respuesta:

```json
{
  "success": true,
  "message": "Authorization URL generated successfully",
  "data": {
    "authUrl": "https://accounts.google.com/oauth/authorize?..."
  }
}
```

### 2. Callback OAuth (manejado automáticamente)

```
GET /api/google-calendar/callback?code=<code>&state=<user_id>
```

### 3. Obtener Integración

```
GET /api/google-calendar/integration
Headers: Authorization: Bearer <jwt_token>
```

### 4. Obtener Calendarios

```
GET /api/google-calendar/calendars
Headers: Authorization: Bearer <jwt_token>
```

### 5. Obtener Eventos

```
GET /api/google-calendar/events/:calendarId?
Headers: Authorization: Bearer <jwt_token>
Query params:
  - timeMin: ISO 8601 date (opcional)
  - timeMax: ISO 8601 date (opcional)
  - maxResults: número entre 1-250 (opcional, default: 50)
```

### 6. Crear Evento

```
POST /api/google-calendar/events/:calendarId?
Headers:
  - Authorization: Bearer <jwt_token>
  - Content-Type: application/json

Body:
{
  "summary": "Título del evento",
  "description": "Descripción del evento",
  "start": {
    "dateTime": "2024-01-20T10:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "end": {
    "dateTime": "2024-01-20T11:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "location": "Ubicación del evento",
  "attendees": [
    {
      "email": "invitado@example.com",
      "displayName": "Nombre del invitado"
    }
  ]
}
```

### 7. Desconectar Integración

```
DELETE /api/google-calendar/integration
Headers: Authorization: Bearer <jwt_token>
```

## Flujo de Autorización

1. **Frontend**: El usuario hace clic en "Conectar Google Calendar"
2. **Frontend**: Llama a `GET /api/google-calendar/authorize`
3. **Backend**: Devuelve la URL de autorización
4. **Frontend**: Redirige al usuario a la URL de Google
5. **Google**: El usuario autoriza la aplicación
6. **Google**: Redirige a `/api/google-calendar/callback`
7. **Backend**: Procesa el callback y crea la integración
8. **Backend**: Redirige al usuario de vuelta al frontend (puedes personalizar esto)

## Seguridad y Mejores Prácticas

### Tokens de Acceso

- Los tokens se refrescan automáticamente cuando están por expirar
- Los tokens se almacenan encriptados en la base de datos
- Nunca exponer tokens en respuestas JSON básicas

### Permisos

- La aplicación solicita permisos mínimos necesarios:
  - `calendar.readonly`: Leer calendarios y eventos
  - `calendar.events`: Crear, modificar y eliminar eventos
  - `userinfo.email`: Obtener email del usuario para identificación
  - `userinfo.profile`: Obtener información básica del perfil

### Rate Limiting

- Google Calendar API tiene límites de rate limiting
- Implementa caché cuando sea apropiado
- Maneja errores 429 (Too Many Requests) adecuadamente

## Troubleshooting

### Error: "redirect_uri_mismatch"

- Verifica que la URI de redirección en Google Cloud Console coincida exactamente con la configurada en tu aplicación
- Incluye el protocolo (http/https)
- No incluyas parámetros de query en la URI

### Error: "invalid_client"

- Verifica que GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET sean correctos
- Asegúrate de que no haya espacios extra en las variables de entorno

### Error: "access_denied"

- El usuario canceló la autorización
- Verifica que la pantalla de consentimiento esté configurada correctamente

### Tokens Expirados

- Los tokens se refrescan automáticamente
- Si hay problemas persistentes, el usuario debe volver a autorizar

## Desarrollo vs Producción

### Desarrollo

```env
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

### Producción

```env
GOOGLE_REDIRECT_URI=https://tudominio.com/api/google-calendar/callback
```

Asegúrate de actualizar las URIs autorizadas en Google Cloud Console para cada entorno.
