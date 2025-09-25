import { Response } from 'express';
import { AuthRequest } from '../../core/interfaces/auth.interface';
import { EmailAuditService } from '../services/EmailAuditService';

export class EmailSecurityController {
  /**
   * Obtiene estadísticas de seguridad de emails (solo para administradores)
   */
  public async getEmailStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Verificar que el usuario sea administrador
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Solo los administradores pueden acceder a estas estadísticas',
        });
        return;
      }

      const stats = EmailAuditService.getEmailStats();
      const suspiciousActivities = EmailAuditService.getSuspiciousActivities(50);

      res.status(200).json({
        success: true,
        data: {
          stats,
          recentSuspiciousActivities: suspiciousActivities.slice(0, 10),
          suspiciousActivitiesCount: suspiciousActivities.length,
        },
      });
    } catch (error) {
      console.error('Error getting email stats:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al obtener estadísticas de emails',
      });
    }
  }

  /**
   * Obtiene el estado de cuota de un usuario específico
   */
  public async getUserQuotaStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Usuario no autenticado',
        });
        return;
      }

      const dailyCount = EmailAuditService.getDailyEmailCount(userId);
      const hasExceededLimit = EmailAuditService.hasExceededDailyLimit(userId, 50);

      res.status(200).json({
        success: true,
        data: {
          userId,
          dailyEmailCount: dailyCount,
          dailyLimit: 50,
          remaining: Math.max(0, 50 - dailyCount),
          hasExceededLimit,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    } catch (error) {
      console.error('Error getting user quota status:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al obtener estado de cuota',
      });
    }
  }

  /**
   * Limpia datos antiguos (endpoint de mantenimiento para administradores)
   */
  public async cleanupOldData(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Verificar que el usuario sea administrador
      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Solo los administradores pueden ejecutar limpieza de datos',
        });
        return;
      }

      EmailAuditService.cleanupOldData();

      res.status(200).json({
        success: true,
        message: 'Limpieza de datos completada exitosamente',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al limpiar datos antiguos',
      });
    }
  }
}
