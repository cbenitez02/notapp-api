import DOMPurify from 'dompurify';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { JSDOM } from 'jsdom';
import { AuthRequest } from '../core/interfaces/auth.interface';

// Configurar DOMPurify para Node.js
const window = new JSDOM('').window;
const DOMPurifyServer = DOMPurify(window);

// Configuración de dominios permitidos (opcional - si está vacío permite todos)
const ALLOWED_EMAIL_DOMAINS = process.env.ALLOWED_EMAIL_DOMAINS?.split(',').map((d) => d.trim().toLowerCase()) || [];

// Rate limiting específico para envío de emails
export const emailSendRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Apply rate limiting in production
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 emails por IP cada 15 minutos en producción
    message: {
      error: 'Too Many Email Requests',
      message: 'Demasiados intentos de envío de email desde esta IP. Intente de nuevo en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too Many Email Requests',
        message: 'Demasiados intentos de envío de email. Intente de nuevo en 15 minutos.',
        retryAfter: Math.round(15 * 60),
      });
    },
  });

  return limiter(req, res, next);
};

// Rate limiting para resend de verificación de email
export const emailResendRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Apply rate limiting in production
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 resends por hora en producción
    message: {
      error: 'Too Many Resend Attempts',
      message: 'Demasiados intentos de reenvío de email. Intente de nuevo en 1 hora.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too Many Resend Attempts',
        message: 'Demasiados intentos de reenvío de email. Intente de nuevo en 1 hora.',
        retryAfter: Math.round(60 * 60),
      });
    },
  });

  return limiter(req, res, next);
};

// Validadores para email
export const validateEmailInput = [
  body('email')
    .if(body('email').exists())
    .isEmail()
    .normalizeEmail({
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_lowercase: true,
      outlookdotcom_remove_subaddress: false,
    })
    .custom((email: string) => {
      // Validar dominio si está configurado
      if (ALLOWED_EMAIL_DOMAINS.length > 0) {
        const domain = email.split('@')[1].toLowerCase();
        if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
          throw new Error(`Dominio de email no permitido: ${domain}`);
        }
      }

      // Validaciones adicionales de seguridad
      // RFC 5321 límite
      if (email.length > 254) {
        throw new Error('Email demasiado largo');
      }

      // Verificar caracteres sospechosos
      const suspiciousPatterns = [
        /[<>]/g, // Posibles intentos de XSS
        /javascript:/gi, // Intentos de inyección de script
        /data:/gi, // Data URIs sospechosos
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(email)) {
          throw new Error('Email contiene caracteres no permitidos');
        }
      }

      return true;
    })
    .withMessage('Email válido es requerido'),

  body('subject')
    .if(body('subject').exists())
    .trim()
    .isLength({ min: 1, max: 200 })
    .custom((subject: string) => {
      // Sanitizar y validar el asunto
      const sanitized = DOMPurifyServer.sanitize(subject, { ALLOWED_TAGS: [] });
      if (sanitized !== subject) {
        throw new Error('Asunto contiene contenido no permitido');
      }
      return true;
    })
    .withMessage('Asunto debe tener entre 1 y 200 caracteres válidos'),

  body('content')
    .if(body('content').exists())
    .trim()
    .isLength({ min: 1, max: 10000 })
    .custom((content: string) => {
      // Validar que el contenido no sea excesivamente sospechoso
      const suspiciousKeywords = ['javascript:', 'data:', 'vbscript:', 'onload=', 'onerror=', 'onclick=', '<script', '</script>'];

      const contentLower = content.toLowerCase();
      for (const keyword of suspiciousKeywords) {
        if (contentLower.includes(keyword)) {
          throw new Error('Contenido contiene elementos no permitidos');
        }
      }

      return true;
    })
    .withMessage('Contenido debe tener entre 1 y 10000 caracteres válidos'),
];

// Middleware para validar y limpiar inputs de email
export const sanitizeEmailContent = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Datos de entrada inválidos',
        details: errors.array(),
      });
      return;
    }

    // Sanitizar contenido HTML si existe
    if (req.body.content) {
      req.body.content = DOMPurifyServer.sanitize(req.body.content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
        ALLOWED_ATTR: ['href'],
      });
    }

    next();
  } catch (error) {
    console.error('Error in email content sanitization:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al procesar el contenido del email',
    });
  }
};

// Middleware para verificar la autenticación de email
export const requireEmailVerification = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication Required',
      message: 'Autenticación requerida para enviar emails',
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      error: 'Email Not Verified',
      message: 'Debe verificar su email antes de enviar mensajes',
    });
    return;
  }

  next();
};

// Función para validar dominio de email
export const isAllowedEmailDomain = (email: string): boolean => {
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;

  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? ALLOWED_EMAIL_DOMAINS.includes(domain) : false;
};

// Función para detectar patrones sospechosos
export const detectSuspiciousPattern = (content: string, userAgent?: string): boolean => {
  const suspiciousPatterns = [
    // Intentos de phishing
    /verify.{0,20}account/gi,
    /urgent.{0,20}action/gi,
    /suspend.{0,20}account/gi,

    // Spam común
    /click.{0,10}here.{0,10}now/gi,
    /limited.{0,10}time.{0,10}offer/gi,
    /act.{0,10}now/gi,

    // Intentos de inyección
    /<script/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];

  // Verificar patrones sospechosos en el contenido
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }

  // Verificar User-Agent sospechoso (bots comunes)
  if (userAgent) {
    const botPatterns = [/bot/gi, /crawler/gi, /spider/gi, /scraper/gi];

    for (const pattern of botPatterns) {
      if (pattern.test(userAgent)) {
        return true;
      }
    }
  }

  return false;
};

// Middleware para logging de actividad de email
export const logEmailActivity = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const originalSend = res.json;

  res.json = function (body: unknown) {
    // Log de la actividad de email
    const logData = {
      timestamp: new Date().toISOString(),
      userId: req.user?.userId || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      body:
        req.method === 'POST'
          ? {
              to: req.body.to || req.body.email,
              subject: req.body.subject,
              hasContent: !!req.body.content,
            }
          : undefined,
      statusCode: res.statusCode,
      suspicious: req.body ? detectSuspiciousPattern(JSON.stringify(req.body), req.get('User-Agent')) : false,
    };

    // Log a consola (en producción debería ir a un servicio de logging)
    if (logData.suspicious || res.statusCode >= 400) {
      console.warn('🚨 Suspicious email activity:', JSON.stringify(logData, null, 2));
    } else {
      console.log('📧 Email activity:', JSON.stringify(logData, null, 2));
    }

    return originalSend.call(this, body);
  };

  next();
};
