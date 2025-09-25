import { NextFunction, Response } from 'express';
import { EmailAuditService } from '../adapters/services/EmailAuditService';
import { AuthRequest } from '../core/interfaces/auth.interface';

/**
 * Middleware para verificar cuotas diarias de email
 */
export const checkDailyEmailQuota = (limit: number = 50) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Solo verificar si hay usuario autenticado
      if (!req.user) {
        next();
        return;
      }

      const userId = req.user.userId;
      const dailyCount = EmailAuditService.getDailyEmailCount(userId);

      if (dailyCount >= limit) {
        res.status(429).json({
          error: 'Daily Email Quota Exceeded',
          message: `Has alcanzado el límite diario de ${limit} emails. Intenta mañana.`,
          dailyCount,
          limit,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
        return;
      }

      // Agregar información de cuota a la respuesta para el cliente
      res.setHeader('X-Email-Quota-Remaining', (limit - dailyCount).toString());
      res.setHeader('X-Email-Quota-Limit', limit.toString());
      res.setHeader('X-Email-Quota-Used', dailyCount.toString());

      next();
    } catch (error) {
      console.error('Error checking daily email quota:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al verificar cuota de emails',
      });
    }
  };
};

/**
 * Middleware para verificar patrones sospechosos de usuario/IP
 */
export const checkSuspiciousPatterns = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const userId = req.user?.userId;
    const ip = req.ip;

    const suspiciousCheck = EmailAuditService.detectSuspiciousPatterns(userId, ip);

    if (suspiciousCheck.isSuspicious) {
      console.warn('🚨 Blocking suspicious email activity:', {
        userId,
        ip,
        reasons: suspiciousCheck.reasons,
        timestamp: new Date().toISOString(),
      });

      res.status(403).json({
        error: 'Suspicious Activity Detected',
        message: 'Tu actividad ha sido marcada como sospechosa. Contacta soporte si crees que esto es un error.',
        reasons: suspiciousCheck.reasons,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking suspicious patterns:', error);
    next(); // Continuar en caso de error para no bloquear usuarios legítimos
  }
};

/**
 * Middleware para bloquear dominios específicos
 */
export const blockSuspiciousDomains = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const email = req.body.email || req.body.to;

    if (!email) {
      next();
      return;
    }

    const domain = email.split('@')[1]?.toLowerCase();

    // Lista de dominios comúnmente usados para spam
    const suspiciousDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com',
      '7days-a-week.net',
      'deadaddress.com',
      'spamgourmet.com',
    ];

    if (domain && suspiciousDomains.includes(domain)) {
      res.status(403).json({
        error: 'Domain Not Allowed',
        message: 'El dominio de email utilizado no está permitido.',
        domain,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking suspicious domains:', error);
    next(); // Continuar en caso de error
  }
};

/**
 * Middleware para agregar headers de seguridad específicos para emails
 */
export const addEmailSecurityHeaders = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Headers de seguridad específicos para APIs de email
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Header personalizado para identificar respuestas de API de email
  res.setHeader('X-API-Type', 'email-service');
  res.setHeader('X-API-Version', '1.0');

  next();
};
