import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

// Configuración para diferentes ambientes
const isDevelopment = process.env.NODE_ENV === 'development';

// Rate limiting general para toda la API
export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos por defecto
  max: isDevelopment
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000') // 1000 requests en desarrollo
    : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests en producción
  message: {
    error: 'Too Many Requests',
    message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos.',
      retryAfter: Math.round(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000),
    });
  },
});

// Rate limiting estricto para rutas de autenticación
export const authRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'), // 15 minutos por defecto
  max: isDevelopment
    ? parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '100') // 100 intentos en desarrollo
    : parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '5'), // 5 intentos en producción
  message: {
    error: 'Too Many Login Attempts',
    message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Login Attempts',
      message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.',
      retryAfter: Math.round(parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000') / 1000),
    });
  },
});

// Rate limiting para rutas de registro y verificación de email
export const registrationRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_REGISTRATION_WINDOW_MS || '3600000'), // 1 hora por defecto
  max: isDevelopment
    ? parseInt(process.env.RATE_LIMIT_REGISTRATION_MAX_REQUESTS || '50') // 50 registros en desarrollo
    : parseInt(process.env.RATE_LIMIT_REGISTRATION_MAX_REQUESTS || '3'), // 3 registros en producción
  message: {
    error: 'Too Many Registration Attempts',
    message: 'Demasiados intentos de registro. Intenta nuevamente en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Registration Attempts',
      message: 'Demasiados intentos de registro. Intenta nuevamente en 1 hora.',
      retryAfter: Math.round(parseInt(process.env.RATE_LIMIT_REGISTRATION_WINDOW_MS || '3600000') / 1000),
    });
  },
});

// Rate limiting para recuperación de contraseña
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDevelopment ? 50 : 3, // 50 intentos en desarrollo, 3 en producción
  message: {
    error: 'Too Many Password Reset Attempts',
    message: 'Demasiados intentos de recuperación de contraseña. Intenta nuevamente en 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Password Reset Attempts',
      message: 'Demasiados intentos de recuperación de contraseña. Intenta nuevamente en 1 hora.',
      retryAfter: Math.round(60 * 60),
    });
  },
});

// Rate limiting para endpoints que consumen muchos recursos
export const resourceIntensiveRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: isDevelopment ? 100 : 10, // 100 requests en desarrollo, 10 en producción
  message: {
    error: 'Too Many Requests',
    message: 'Este endpoint tiene un límite especial. Intenta nuevamente en 5 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Este endpoint tiene un límite especial. Intenta nuevamente en 5 minutos.',
      retryAfter: Math.round(5 * 60),
    });
  },
});
