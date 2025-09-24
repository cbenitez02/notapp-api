import dotenv from 'dotenv';
import 'reflect-metadata';

// Cargar variables de entorno
dotenv.config();

import { SendGridEmailService } from '../src/adapters/services/SendGridEmailService';

async function testEmailService() {
  console.log('🧪 Iniciando prueba del servicio de email...\n');

  // Configurar el servicio de email
  const emailService = new SendGridEmailService({
    apiKey: process.env.SENDGRID_API_KEY!,
    fromEmail: process.env.SENDGRID_FROM_EMAIL!,
    fromName: process.env.SENDGRID_FROM_NAME || 'TickGuard',
  });

  const testEmail = 'cbenitez1265@gmail.com';

  try {
    console.log('📧 Enviando email de verificación de cuenta...');
    await emailService.sendVerificationEmail({
      to: testEmail,
      username: 'Usuario de Prueba',
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-email?token=test-token-123456789`,
    });
    console.log('✅ Email de verificación enviado exitosamente!\n');

    console.log('🔐 Enviando email de restablecimiento de contraseña...');
    await emailService.sendPasswordResetEmail({
      to: testEmail,
      username: 'Usuario de Prueba',
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=reset-token-987654321`,
    });
    console.log('✅ Email de restablecimiento enviado exitosamente!\n');

    console.log('🎉 Todas las pruebas completadas exitosamente!');
    console.log(`📬 Revisa tu bandeja de entrada en: ${testEmail}`);
    console.log('🔍 También puedes revisar el score del email en: https://www.mail-tester.com/');
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);

    if (error instanceof Error) {
      if (error.message.includes('Failed to send email')) {
        console.error('\n🔧 Posibles soluciones:');
        console.error('   - Verifica que SENDGRID_API_KEY esté configurada correctamente');
        console.error('   - Verifica que SENDGRID_FROM_EMAIL esté verificado en SendGrid');
        console.error('   - Revisa los logs en el dashboard de SendGrid');
      }
    }
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
