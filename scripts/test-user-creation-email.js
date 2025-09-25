require('dotenv').config();

async function testUserCreationWithEmail() {
  console.log('🧪 Probando creación de usuario con envío automático de email...\n');

  const testEmail = 'test-p2iuqpebr@srv1.mail-tester.com';
  const apiUrl = 'http://localhost:3000';

  try {
    console.log('👤 Creando nuevo usuario...');

    const response = await fetch(`${apiUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullname: 'Usuario de Prueba Email',
        email: testEmail,
        password: 'Password123!',
        role: 'buyer',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const userData = await response.json();
    console.log('✅ Usuario creado exitosamente!');
    console.log('📋 Datos del usuario:', {
      id: userData.data.id,
      email: userData.data.email,
      emailVerified: userData.data.emailVerified,
    });

    console.log('\n📧 Si todo está configurado correctamente:');
    console.log(`   - Se debería haber enviado un email de verificación a: ${testEmail}`);
    console.log('   - Revisa los logs del servidor para confirmar el envío');
    console.log('   - Ve a https://www.mail-tester.com/ para ver el email');

    console.log('\n🔗 Para verificar el email, usa el endpoint:');
    console.log(`   POST ${apiUrl}/emailverification/verify`);
    console.log('   Body: { "token": "token_del_email" }');
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);

    if (error.message.includes('already exists')) {
      console.log('\n💡 El usuario ya existe. Puedes probar con otro email o eliminar el existente.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
      console.log('   Ejecuta: npm run dev');
    }
  }
}

// Verificar que fetch esté disponible (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Este script requiere Node.js 18+ o instalar node-fetch');
  console.log('💡 Alternativa: usar curl para probar el endpoint');
  console.log(`
curl -X POST http://localhost:3000/users \\
  -H "Content-Type: application/json" \\
  -d '{
    "fullname": "Usuario de Prueba Email",
    "email": "test-p2iuqpebr@srv1.mail-tester.com",
    "password": "Password123!",
    "role": "buyer"
  }'
  `);
  process.exit(1);
}

testUserCreationWithEmail();
