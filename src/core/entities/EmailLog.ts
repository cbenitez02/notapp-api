export type EmailLogStatus = 'sent' | 'failed' | 'blocked';

export interface EmailLogCreateData {
  userId: string;
  to: string;
  subject: string;
  status: EmailLogStatus;
  error?: string;
}

export interface EmailLogJSONData {
  id?: string;
  userId: string;
  to: string;
  subject: string;
  status: EmailLogStatus;
  error?: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class EmailLog {
  public readonly id: string;
  public readonly userId: string;
  public readonly to: string;
  public readonly subject: string;
  public readonly status: EmailLogStatus;
  public readonly error?: string;
  public readonly timestamp: Date;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(data: EmailLogCreateData, id?: string) {
    this.id = id || crypto.randomUUID();
    this.userId = data.userId;
    this.to = data.to;
    this.subject = data.subject;
    this.status = data.status;
    this.error = data.error;
    this.timestamp = new Date();
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // Validar datos al crear la instancia
    this.validate();
  }

  /**
   * Valida los datos del log de email
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('EmailLog: userId is required');
    }

    if (!this.to || !this.isValidEmail(this.to)) {
      throw new Error('EmailLog: valid email address is required');
    }

    if (!this.subject || this.subject.trim().length === 0) {
      throw new Error('EmailLog: subject is required');
    }

    if (this.subject.length > 200) {
      throw new Error('EmailLog: subject must be less than 200 characters');
    }

    if (!['sent', 'failed', 'blocked'].includes(this.status)) {
      throw new Error('EmailLog: status must be sent, failed, or blocked');
    }

    if (this.error && this.error.length > 1000) {
      throw new Error('EmailLog: error message must be less than 1000 characters');
    }
  }

  /**
   * Valida formato de email básico
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Actualiza el timestamp de updatedAt
   */
  public touch(): void {
    this.updatedAt = new Date();
  }

  /**
   * Verifica si el log indica un email enviado exitosamente
   */
  public isSuccessful(): boolean {
    return this.status === 'sent';
  }

  /**
   * Verifica si el log indica un error
   */
  public isError(): boolean {
    return this.status === 'failed' || this.status === 'blocked';
  }

  /**
   * Obtiene el dominio del email de destino
   */
  public getEmailDomain(): string {
    return this.to.split('@')[1] || '';
  }

  /**
   * Convierte la instancia a un objeto plano para serialización
   */
  public toJSON(): EmailLogJSONData {
    return {
      id: this.id,
      userId: this.userId,
      to: this.to,
      subject: this.subject,
      status: this.status,
      error: this.error,
      timestamp: this.timestamp.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Crea una instancia desde un objeto plano (útil para deserialización)
   */
  public static fromJSON(data: EmailLogJSONData): EmailLog {
    const emailLog = new EmailLog(
      {
        userId: data.userId,
        to: data.to,
        subject: data.subject,
        status: data.status,
        error: data.error,
      },
      data.id,
    );

    // Restaurar fechas si existen
    if (data.timestamp) {
      Object.defineProperty(emailLog, 'timestamp', {
        value: new Date(data.timestamp),
        writable: false,
      });
    }
    if (data.createdAt) {
      Object.defineProperty(emailLog, 'createdAt', {
        value: new Date(data.createdAt),
        writable: false,
      });
    }
    if (data.updatedAt) {
      emailLog.updatedAt = new Date(data.updatedAt);
    }

    return emailLog;
  }

  /**
   * Factory method para crear un log de email enviado exitosamente
   */
  public static createSentLog(userId: string, to: string, subject: string): EmailLog {
    return new EmailLog({
      userId,
      to,
      subject,
      status: 'sent',
    });
  }

  /**
   * Factory method para crear un log de email fallido
   */
  public static createFailedLog(userId: string, to: string, subject: string, error: string): EmailLog {
    return new EmailLog({
      userId,
      to,
      subject,
      status: 'failed',
      error,
    });
  }

  /**
   * Factory method para crear un log de email bloqueado
   */
  public static createBlockedLog(userId: string, to: string, subject: string, reason: string): EmailLog {
    return new EmailLog({
      userId,
      to,
      subject,
      status: 'blocked',
      error: reason,
    });
  }
}
