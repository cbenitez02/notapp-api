require('dotenv').config();
const sgMail = require('@sendgrid/mail');

async function testEmailService() {
  console.log('🧪 Iniciando prueba del servicio de email...\n');

  // Configurar SendGrid
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const testEmail = 'cbenitez1265@gmail.com';
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME || 'TickGuard';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  // Verificar configuración
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY no está configurada');
    return;
  }

  if (!fromEmail) {
    console.error('❌ SENDGRID_FROM_EMAIL no está configurada');
    return;
  }

  console.log(`📤 Desde: ${fromEmail} (${fromName})`);
  console.log(`📥 Para: ${testEmail}\n`);

  try {
    // Email de verificación
    console.log('📧 Enviando email de verificación...');
    const verificationMsg = {
      to: testEmail,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'Prueba - Verifica tu cuenta - TickGuard',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu cuenta</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a TickGuard! 🎯</h1>
            </div>
            <div class="content">
              <h2>Hola Usuario de Prueba,</h2>
              <p>Esta es una prueba del sistema de envío de emails de TickGuard.</p>
              <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>
              <a href="${frontendUrl}/verify-email?token=test-token-123456789" class="button">Verificar mi cuenta</a>
              <p><strong>Este es un email de prueba.</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 TickGuard. Todos los derechos reservados.</p>
              <p>Email de prueba enviado a: ${testEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ¡Bienvenido a TickGuard!
        
        Hola Usuario de Prueba,
        
        Esta es una prueba del sistema de envío de emails de TickGuard.
        
        Visita este enlace para verificar tu cuenta:
        ${frontendUrl}/verify-email?token=test-token-123456789
        
        Este es un email de prueba.
        
        © 2024 TickGuard. Todos los derechos reservados.
      `,
    };

    await sgMail.send(verificationMsg);
    console.log('✅ Email de verificación enviado exitosamente!\n');

    // Esperar un poco antes del siguiente email
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Email de restablecimiento de contraseña
    console.log('🔐 Enviando email de restablecimiento de contraseña...');
    const resetMsg = {
      to: testEmail,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'Prueba - Restablece tu contraseña - TickGuard',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restablece tu contraseña</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Restablece tu contraseña</h1>
            </div>
            <div class="content">
              <h2>Hola Usuario de Prueba,</h2>
              <p>Esta es una prueba del sistema de restablecimiento de contraseña de TickGuard.</p>
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              <a href="${frontendUrl}/reset-password?token=reset-token-987654321" class="button">Restablecer contraseña</a>
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este es un email de prueba</li>
                  <li>Los enlaces no son funcionales</li>
                  <li>No uses este email para acciones reales</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© 2024 TickGuard. Todos los derechos reservados.</p>
              <p>Email de prueba enviado a: ${testEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Restablece tu contraseña - TickGuard
        
        Hola Usuario de Prueba,
        
        Esta es una prueba del sistema de restablecimiento de contraseña de TickGuard.
        
        Visita este enlace para crear una nueva contraseña:
        ${frontendUrl}/reset-password?token=reset-token-987654321
        
        IMPORTANTE:
        - Este es un email de prueba
        - Los enlaces no son funcionales
        - No uses este email para acciones reales
        
        © 2024 TickGuard. Todos los derechos reservados.
      `,
    };

    await sgMail.send(resetMsg);
    console.log('✅ Email de restablecimiento enviado exitosamente!\n');

    console.log('🎉 Todas las pruebas completadas exitosamente!');
    console.log(`📬 Revisa tu bandeja de entrada en: ${testEmail}`);
    console.log('🔍 También puedes revisar el score del email en: https://www.mail-tester.com/');
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);

    if (error.response) {
      console.error('📋 Detalles del error:', error.response.body);
    }

    console.error('\n🔧 Posibles soluciones:');
    console.error('   - Verifica que SENDGRID_API_KEY esté configurada correctamente');
    console.error('   - Verifica que SENDGRID_FROM_EMAIL esté verificado en SendGrid');
    console.error('   - Revisa los logs en el dashboard de SendGrid');
  }
}

// Ejecutar la prueba
testEmailService()
  .then(() => {
    console.log('\n🏁 Prueba finalizada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
