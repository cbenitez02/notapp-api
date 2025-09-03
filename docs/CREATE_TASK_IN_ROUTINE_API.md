# API para Crear Tareas en Rutinas Existentes

## Endpoints

### 1. Obtener Rutinas para Selector

`GET /routines/user/selector`

### 2. Crear Nueva Tarea en Rutina

`POST /routines/:id/tasks`

---

## 1. Obtener Rutinas para Selector

### Descripción

Obtiene una lista ligera de las rutinas activas del usuario para mostrar en un selector/dropdown.

### Headers

```
Authorization: Bearer <jwt_token>
```

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-rutina-1",
      "title": "Rutina Matutina",
      "icon": 1,
      "taskCount": 5
    },
    {
      "id": "uuid-rutina-2",
      "title": "Rutina de Ejercicio",
      "icon": 2,
      "taskCount": 3
    }
  ]
}
```

---

## 2. Crear Nueva Tarea en Rutina

## Descripción

Este endpoint permite crear una nueva tarea en una rutina existente. El usuario debe estar autenticado y la rutina debe pertenecerle.

## Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Parámetros de URL

- `id` (string, requerido): ID de la rutina donde se quiere crear la nueva tarea

## Cuerpo de la Solicitud

```json
{
  "title": "string (requerido, 2-120 caracteres)",
  "timeLocal": "string (opcional, formato HH:MM:SS)",
  "durationMin": "number (opcional, 1-1440 minutos)",
  "categoryId": "string (opcional, ID de categoría existente)",
  "priority": "string (opcional, valores: 'Alta', 'Media', 'Baja')",
  "description": "string (opcional, máximo 500 caracteres)",
  "sortOrder": "number (opcional, orden de la tarea >= 0)"
}
```

## Ejemplo de Solicitud

```json
{
  "title": "Meditar por la mañana",
  "timeLocal": "07:00:00",
  "durationMin": 15,
  "priority": "Alta",
  "description": "Sesión de meditación matutina para empezar el día con calma"
}
```

## Respuestas

### Éxito (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "uuid-de-la-tarea",
    "routineId": "uuid-de-la-rutina",
    "routineName": "Mi Rutina Matutina",
    "title": "Meditar por la mañana",
    "timeLocal": "07:00:00",
    "durationMin": 15,
    "category": {
      "id": "uuid-categoria",
      "name": "Bienestar",
      "description": "Actividades de bienestar personal",
      "color": "#4CAF50",
      "icon": 1,
      "active": true,
      "sortOrder": 1,
      "createdAt": "2025-09-03T00:00:00.000Z",
      "updatedAt": "2025-09-03T00:00:00.000Z"
    },
    "priority": "Alta",
    "description": "Sesión de meditación matutina para empezar el día con calma",
    "sortOrder": 3,
    "createdAt": "2025-09-03T08:10:30.000Z",
    "updatedAt": "2025-09-03T08:10:30.000Z"
  }
}
```

### Errores

#### 400 Bad Request - Validación

```json
{
  "message": "Validation failed",
  "errors": ["Title is required and must be at least 2 characters", "timeLocal must be in HH:MM:SS format if provided"]
}
```

#### 401 Unauthorized

```json
{
  "message": "Authentication required"
}
```

#### 403 Forbidden

```json
{
  "message": "Access denied: routine does not belong to user"
}
```

#### 404 Not Found

```json
{
  "message": "Routine not found"
}
```

## Comportamiento Especial

1. **timeLocal**: Si no se proporciona, se usará el `defaultTimeLocal` de la rutina
2. **priority**: Si no se proporciona, se asignará "Media" por defecto
3. **sortOrder**: Si no se proporciona, se calculará automáticamente como el mayor sortOrder existente + 1
4. **category**: Si se proporciona `categoryId`, se vinculará la categoría y se incluirá en la respuesta

## Flujo de Usuario

1. El usuario navega a una pantalla de creación de tareas
2. Selecciona la rutina desde un dropdown/select que muestra sus rutinas activas
3. Completa el formulario con los datos de la nueva tarea
4. Al enviar, se hace el POST a `/routines/{routineId}/tasks`
5. La nueva tarea se crea y queda disponible en la rutina seleccionada

## Validaciones

- El usuario debe estar autenticado
- La rutina debe existir y pertenecer al usuario autenticado
- El título es obligatorio y debe tener entre 2 y 120 caracteres
- La hora debe estar en formato HH:MM:SS si se proporciona
- La duración debe estar entre 1 y 1440 minutos si se proporciona
- La descripción no puede exceder los 500 caracteres
- El sortOrder debe ser un número no negativo si se proporciona

## Ejemplo con cURL

```bash
curl -X POST http://localhost:3000/routines/123e4567-e89b-12d3-a456-426614174000/tasks \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ejercicio cardiovascular",
    "timeLocal": "06:30:00",
    "durationMin": 30,
    "priority": "Alta",
    "description": "Rutina de cardio para mantener la salud"
  }'
```
