import { EmailLog } from '../../core/entities/EmailLog';
import { EmailActivity } from '../interfaces/emailAudit.interface';

export class EmailAuditService {
  private static readonly dailyEmailCounts = new Map<string, { count: number; date: string }>();
  private static suspiciousActivities: EmailActivity[] = [];

  /**
   * Obtiene el conteo diario de emails enviados por un usuario
   */
  static getDailyEmailCount(userId: string): number {
    const today = new Date().toISOString().split('T')[0];
    const userCount = this.dailyEmailCounts.get(userId);

    if (!userCount || userCount.date !== today) {
      return 0;
    }

    return userCount.count;
  }

  /**
   * Incrementa el contador diario de emails para un usuario
   */
  static incrementDailyCount(userId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const currentCount = this.getDailyEmailCount(userId);

    this.dailyEmailCounts.set(userId, {
      count: currentCount + 1,
      date: today,
    });
  }

  /**
   * Verifica si un usuario ha excedido su límite diario
   */
  static hasExceededDailyLimit(userId: string, limit: number = 50): boolean {
    return this.getDailyEmailCount(userId) >= limit;
  }

  /**
   * Registra actividad de email para auditoría
   */
  static logEmailActivity(activity: EmailActivity): void {
    // En un entorno de producción, esto debería ir a una base de datos
    console.log('📊 Email Activity:', {
      ...activity,
      timestamp: activity.timestamp || new Date().toISOString(),
    });

    // Si es sospechosa, agregarla a la lista de actividades sospechosas
    if (activity.suspicious) {
      this.suspiciousActivities.push(activity);

      // Mantener solo las últimas 1000 actividades sospechosas en memoria
      if (this.suspiciousActivities.length > 1000) {
        this.suspiciousActivities = this.suspiciousActivities.slice(-1000);
      }
    }
  }

  /**
   * Obtiene las actividades sospechosas recientes
   */
  static getSuspiciousActivities(limit: number = 100): EmailActivity[] {
    return this.suspiciousActivities.slice(-limit);
  }

  /**
   * Verifica si hay patrones sospechosos para un usuario o IP
   */
  static detectSuspiciousPatterns(
    userId?: string,
    ip?: string,
  ): {
    isSuspicious: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let isSuspicious = false;

    // Verificar intentos excesivos del mismo usuario
    if (userId) {
      const userActivities = this.suspiciousActivities.filter((activity) => activity.userId === userId);

      if (userActivities.length > 10) {
        reasons.push('Usuario con múltiples actividades sospechosas');
        isSuspicious = true;
      }

      // Verificar límite diario
      if (this.hasExceededDailyLimit(userId, 50)) {
        reasons.push('Usuario ha excedido el límite diario de emails');
        isSuspicious = true;
      }
    }

    // Verificar intentos excesivos de la misma IP
    if (ip) {
      const ipActivities = this.suspiciousActivities.filter((activity) => activity.ip === ip);

      if (ipActivities.length > 20) {
        reasons.push('IP con múltiples actividades sospechosas');
        isSuspicious = true;
      }
    }

    return { isSuspicious, reasons };
  }

  /**
   * Limpia los datos antiguos (debería ejecutarse periódicamente)
   */
  static cleanupOldData(): void {
    const today = new Date().toISOString().split('T')[0];

    // Limpiar contadores de días anteriores
    for (const [userId, data] of this.dailyEmailCounts.entries()) {
      if (data.date !== today) {
        this.dailyEmailCounts.delete(userId);
      }
    }

    // Limpiar actividades sospechosas más antiguas que 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.suspiciousActivities = this.suspiciousActivities.filter((activity) => new Date(activity.timestamp) > sevenDaysAgo);
  }

  /**
   * Crea un log de email para persistencia (si se implementa base de datos)
   */
  static createEmailLog(userId: string, to: string, subject: string, status: 'sent' | 'failed' | 'blocked', error?: string): EmailLog {
    return new EmailLog({
      userId,
      to,
      subject,
      status,
      error,
    });
  }

  /**
   * Obtiene estadísticas de uso de email
   */
  static getEmailStats(): {
    totalDailyEmails: number;
    suspiciousActivitiesCount: number;
    activeUsers: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    let totalDailyEmails = 0;
    let activeUsers = 0;

    for (const [, data] of this.dailyEmailCounts.entries()) {
      if (data.date === today) {
        totalDailyEmails += data.count;
        activeUsers++;
      }
    }

    return {
      totalDailyEmails,
      suspiciousActivitiesCount: this.suspiciousActivities.length,
      activeUsers,
    };
  }
}
