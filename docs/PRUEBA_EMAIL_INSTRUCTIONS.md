# Instrucciones para Probar el Servicio de Email

## 🧪 Prueba con Mail-Tester

Has proporcionado el email de prueba: `test-p2iuqpebr@srv1.mail-tester.com`

### Paso 1: Configurar Variables de Entorno

Asegúrate de que tu archivo `.env` tenga estas variables configuradas:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=tu_api_key_de_sendgrid
SENDGRID_FROM_EMAIL=tu_email_verificado@tudominio.com
SENDGRID_FROM_NAME=TickGuard

# Frontend URL
FRONTEND_URL=http://localhost:4200
```

### Paso 2: Ejecutar el Script de Prueba

```bash
# Ejecutar el script de prueba desde la raíz del proyecto
node scripts/test-email.js
```

### Paso 3: Probar con los Endpoints de la API

Alternativamente, puedes probar usando los endpoints reales:

#### 3.1 Crear un usuario de prueba (si no existe)

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Usuario de Prueba",
    "email": "test-p2iuqpebr@srv1.mail-tester.com",
    "password": "password123",
    "role": "buyer"
  }'
```

#### 3.2 Probar verificación de email

```bash
curl -X POST http://localhost:3000/emailverification/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-aqui"
  }'
```

#### 3.3 Probar reset de contraseña

```bash
curl -X POST http://localhost:3000/passwordreset/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-p2iuqpebr@srv1.mail-tester.com"
  }'
```

### Paso 4: Verificar los Resultados

1. **Revisar la consola** para ver si los emails se enviaron exitosamente
2. **Ir a Mail-Tester**: https://www.mail-tester.com/
3. **Buscar tu email de prueba** en la página de Mail-Tester
4. **Revisar el score** y recomendaciones

### Paso 5: Interpretar el Score de Mail-Tester

Mail-Tester te dará un score de 1-10:

- **8-10**: Excelente, el email pasará la mayoría de filtros de spam
- **6-7**: Bueno, pero hay mejoras que hacer
- **4-5**: Regular, necesita optimización
- **1-3**: Malo, probablemente irá a spam

### Posibles Mejoras Según el Score

Si el score es bajo, Mail-Tester te sugerirá:

1. **Autenticación SPF/DKIM**: Configurar en tu dominio
2. **Texto vs HTML**: Equilibrio entre contenido texto y HTML
3. **Imágenes**: No abusar de imágenes sin texto alternativo
4. **Enlaces**: Evitar muchos enlaces o enlaces sospechosos
5. **Palabras spam**: Evitar palabras que activen filtros

## 🛠️ Troubleshooting

### Error: "Unauthorized"

- Verifica que `SENDGRID_API_KEY` sea correcta
- Asegúrate de que la API key tenga permisos de "Mail Send"

### Error: "The from address does not match a verified Sender Identity"

- Verifica tu email/dominio en SendGrid → Settings → Sender Authentication
- Usa un email que esté verificado en SendGrid

### Email no llega a Mail-Tester

- Verifica que el email esté correctamente escrito
- Espera unos minutos, a veces hay delay
- Revisa los logs en SendGrid Dashboard → Activity

### Score bajo en Mail-Tester

- Asegúrate de tener SPF y DKIM configurados en tu dominio
- Equilibra el contenido HTML y texto plano
- Evita palabras como "gratis", "urgente", etc.

## 📊 Ejemplo de Respuesta Exitosa

```
🧪 Iniciando prueba del servicio de email...

📤 Desde: no-reply@tudominio.com (TickGuard)
📥 Para: test-p2iuqpebr@srv1.mail-tester.com

📧 Enviando email de verificación...
✅ Email de verificación enviado exitosamente!

🔐 Enviando email de restablecimiento de contraseña...
✅ Email de restablecimiento enviado exitosamente!

🎉 Todas las pruebas completadas exitosamente!
📬 Revisa tu bandeja de entrada en: test-p2iuqpebr@srv1.mail-tester.com
🔍 También puedes revisar el score del email en: https://www.mail-tester.com/

🏁 Prueba finalizada.
```
