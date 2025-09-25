import sgMail from '@sendgrid/mail';
import { EmailConfig, IEmailService, PasswordResetEmailDto, SendEmailDto, VerificationEmailDto } from '../../core/interfaces/email.interface';
import { EmailAuditService } from './EmailAuditService';

export class SendGridEmailService implements IEmailService {
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly maxEmailsPerHour: number;
  private readonly enableDomainValidation: boolean;

  constructor(config: EmailConfig) {
    sgMail.setApiKey(config.apiKey);
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
    this.maxEmailsPerHour = parseInt(process.env.MAX_EMAILS_PER_HOUR || '100');
    this.enableDomainValidation = process.env.ENABLE_DOMAIN_VALIDATION === 'true';
  }

  async sendVerificationEmail(data: VerificationEmailDto, userId?: string): Promise<void> {
    const html = this.createVerificationEmailTemplate(data.username, data.verificationUrl);
    const text = this.createVerificationEmailText(data.username, data.verificationUrl);

    await this.sendEmail(
      {
        to: data.to,
        subject: 'Verifica tu cuenta - NotAapp',
        html,
        text,
      },
      userId,
    );
  }

  async sendPasswordResetEmail(data: PasswordResetEmailDto, userId?: string): Promise<void> {
    const html = this.createPasswordResetEmailTemplate(data.username, data.resetUrl);
    const text = this.createPasswordResetEmailText(data.username, data.resetUrl);

    await this.sendEmail(
      {
        to: data.to,
        subject: 'Restablece tu contraseña - NotApp',
        html,
        text,
      },
      userId,
    );
  }

  async sendEmail(data: SendEmailDto, userId?: string): Promise<void> {
    try {
      // Validaciones de seguridad previas al envío
      await this.validateEmailSecurity(data, userId);

      const msg = {
        to: data.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: data.subject,
        html: data.html,
        text: data.text || this.stripHtml(data.html),
        headers: {
          'X-Entity-Ref-ID': userId || 'system',
          'X-Mailer': 'NotApp-API-v1.0',
          'X-Priority': '3',
        },
      };

      await sgMail.send(msg);

      // Registrar éxito en auditoría
      if (userId) {
        EmailAuditService.incrementDailyCount(userId);
      }

      EmailAuditService.logEmailActivity({
        timestamp: new Date().toISOString(),
        userId: userId || 'system',
        method: 'SEND_EMAIL',
        path: '/email/send',
        to: data.to,
        subject: data.subject,
        statusCode: 200,
        suspicious: false,
      });
    } catch (error) {
      console.error('Error sending email:', error);

      // Registrar error en auditoría
      if (userId) {
        EmailAuditService.logEmailActivity({
          timestamp: new Date().toISOString(),
          userId,
          method: 'SEND_EMAIL',
          path: '/email/send',
          to: data.to,
          subject: data.subject,
          statusCode: 500,
          suspicious: false,
        });
      }

      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateEmailSecurity(data: SendEmailDto, userId?: string): Promise<void> {
    // Validar dominio si está habilitada la validación
    if (this.enableDomainValidation) {
      const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',').map((d) => d.trim().toLowerCase()) || [];
      if (allowedDomains.length > 0) {
        const domain = data.to.split('@')[1]?.toLowerCase();
        if (!domain || !allowedDomains.includes(domain)) {
          throw new Error(`Email domain not allowed: ${domain}`);
        }
      }
    }

    // Verificar límite diario si hay userId
    if (userId && EmailAuditService.hasExceededDailyLimit(userId, 50)) {
      throw new Error('Daily email limit exceeded');
    }

    // Detectar patrones sospechosos
    const content = `${data.subject} ${data.html}`;
    const suspiciousPatterns = [
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<script/gi,
      /urgent.{0,20}action/gi,
      /verify.{0,20}account.{0,20}immediately/gi,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new Error('Email content contains suspicious patterns');
      }
    }

    // Validar longitud del email
    if (data.to.length > 254) {
      throw new Error('Email address too long');
    }

    // Validar longitud del asunto
    if (data.subject.length > 200) {
      throw new Error('Email subject too long');
    }

    // Validar longitud del contenido
    if (data.html.length > 100000) {
      throw new Error('Email content too long');
    }
  }

  private createVerificationEmailTemplate(username: string, verificationUrl: string): string {
    return `
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
            <h1>¡Bienvenido a NotApp! 🎯</h1>
          </div>
          <div class="content">
            <h2>Hola ${username},</h2>
            <p>Gracias por registrarte en NotApp. Para completar tu registro, necesitas verificar tu dirección de correo electrónico.</p>
            <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>
            <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
            <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <p><strong>Este enlace expira en 24 horas.</strong></p>
            <p>Si no te registraste en NotApp, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>© 2024 NotApp. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private createPasswordResetEmailTemplate(username: string, resetUrl: string): string {
    return `
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
            <h2>Hola ${username},</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en NotApp.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <a href="${resetUrl}" class="button">Restablecer contraseña</a>
            <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expira en 1 hora por seguridad</li>
                <li>Solo puedes usar este enlace una vez</li>
                <li>Si no solicitaste este cambio, ignora este correo</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 NotApp. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private createVerificationEmailText(username: string, verificationUrl: string): string {
    return `
      ¡Bienvenido a NotApp!

      Hola ${username},

      Gracias por registrarte en NotApp. Para completar tu registro, necesitas verificar tu dirección de correo electrónico.

      Visita este enlace para verificar tu cuenta:
      ${verificationUrl}

      Este enlace expira en 24 horas.

      Si no te registraste en NotApp, puedes ignorar este correo.

      © 2024 NotApp. Todos los derechos reservados.
    `;
  }

  private createPasswordResetEmailText(username: string, resetUrl: string): string {
    return `
      Restablece tu contraseña - NotApp

      Hola ${username},

      Recibimos una solicitud para restablecer la contraseña de tu cuenta en NotApp.

      Visita este enlace para crear una nueva contraseña:
      ${resetUrl}

      IMPORTANTE:
      - Este enlace expira en 1 hora por seguridad
      - Solo puedes usar este enlace una vez
      - Si no solicitaste este cambio, ignora este correo

      © 2024 NotApp. Todos los derechos reservados.
    `;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
