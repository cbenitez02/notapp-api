import sgMail from '@sendgrid/mail';
import { EmailConfig, IEmailService, SendEmailDto, VerificationEmailDto, PasswordResetEmailDto } from '../../core/interfaces/email.interface';

export class SendGridEmailService implements IEmailService {
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(config: EmailConfig) {
    sgMail.setApiKey(config.apiKey);
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  async sendVerificationEmail(data: VerificationEmailDto): Promise<void> {
    const html = this.createVerificationEmailTemplate(data.username, data.verificationUrl);
    const text = this.createVerificationEmailText(data.username, data.verificationUrl);

    await this.sendEmail({
      to: data.to,
      subject: 'Verifica tu cuenta - TickGuard',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(data: PasswordResetEmailDto): Promise<void> {
    const html = this.createPasswordResetEmailTemplate(data.username, data.resetUrl);
    const text = this.createPasswordResetEmailText(data.username, data.resetUrl);

    await this.sendEmail({
      to: data.to,
      subject: 'Restablece tu contraseña - TickGuard',
      html,
      text,
    });
  }

  async sendEmail(data: SendEmailDto): Promise<void> {
    try {
      const msg = {
        to: data.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: data.subject,
        html: data.html,
        text: data.text || this.stripHtml(data.html),
      };

      await sgMail.send(msg);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
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
            <h1>¡Bienvenido a TickGuard! 🎯</h1>
          </div>
          <div class="content">
            <h2>Hola ${username},</h2>
            <p>Gracias por registrarte en TickGuard. Para completar tu registro, necesitas verificar tu dirección de correo electrónico.</p>
            <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>
            <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
            <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <p><strong>Este enlace expira en 24 horas.</strong></p>
            <p>Si no te registraste en TickGuard, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>© 2024 TickGuard. Todos los derechos reservados.</p>
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
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en TickGuard.</p>
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
            <p>© 2024 TickGuard. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private createVerificationEmailText(username: string, verificationUrl: string): string {
    return `
      ¡Bienvenido a TickGuard!

      Hola ${username},

      Gracias por registrarte en TickGuard. Para completar tu registro, necesitas verificar tu dirección de correo electrónico.

      Visita este enlace para verificar tu cuenta:
      ${verificationUrl}

      Este enlace expira en 24 horas.

      Si no te registraste en TickGuard, puedes ignorar este correo.

      © 2024 TickGuard. Todos los derechos reservados.
    `;
  }

  private createPasswordResetEmailText(username: string, resetUrl: string): string {
    return `
      Restablece tu contraseña - TickGuard

      Hola ${username},

      Recibimos una solicitud para restablecer la contraseña de tu cuenta en TickGuard.

      Visita este enlace para crear una nueva contraseña:
      ${resetUrl}

      IMPORTANTE:
      - Este enlace expira en 1 hora por seguridad
      - Solo puedes usar este enlace una vez
      - Si no solicitaste este cambio, ignora este correo

      © 2024 TickGuard. Todos los derechos reservados.
    `;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}