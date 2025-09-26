import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { AuthMiddleware } from '../../middlewares/Auth.middleware';
import { GoogleCalendarController } from '../controllers/GoogleCalendarController';
import { GoogleCalendarIntegrationRepository } from '../persistence/repositories/GoogleCalendarIntegrationRepository';
import { GoogleCalendarService } from '../services/GoogleCalendarService';

// Inicializar dependencias
const googleCalendarService = new GoogleCalendarService(
  process.env.GOOGLE_CLIENT_ID || '',
  process.env.GOOGLE_CLIENT_SECRET || '',
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-calendar/callback',
);

const integrationRepository = new GoogleCalendarIntegrationRepository();
const googleCalendarController = new GoogleCalendarController(googleCalendarService, integrationRepository);

const router = Router();

/**
 * @route   GET /google-calendar/authorize
 * @desc    Inicia el proceso de autorización de Google Calendar
 * @access  Private
 */
router.get('/authorize', AuthMiddleware.authenticate, googleCalendarController.authorize);

/**
 * @route   GET /google-calendar/callback
 * @desc    Maneja el callback de Google OAuth
 * @access  Public
 */
router.get('/callback', googleCalendarController.callback);

/**
 * @route   GET /google-calendar/integration
 * @desc    Obtiene la integración del usuario actual
 * @access  Private
 */
router.get('/integration', AuthMiddleware.authenticate, googleCalendarController.getIntegration);

/**
 * @route   GET /google-calendar/calendars
 * @desc    Obtiene la lista de calendarios del usuario
 * @access  Private
 */
router.get('/calendars', AuthMiddleware.authenticate, googleCalendarController.getCalendars);

/**
 * @route   GET /google-calendar/events
 * @route   GET /google-calendar/events/:calendarId
 * @desc    Obtiene eventos de un calendario específico
 * @access  Private
 */
router.get(
  '/events',
  AuthMiddleware.authenticate,
  [
    query('timeMin').optional().isISO8601().withMessage('timeMin must be a valid ISO 8601 date'),
    query('timeMax').optional().isISO8601().withMessage('timeMax must be a valid ISO 8601 date'),
    query('maxResults').optional().isInt({ min: 1, max: 250 }).withMessage('maxResults must be between 1 and 250'),
  ],
  googleCalendarController.getEvents,
);

router.get(
  '/events/:calendarId',
  AuthMiddleware.authenticate,
  [
    param('calendarId').isString().withMessage('Calendar ID must be a string'),
    query('timeMin').optional().isISO8601().withMessage('timeMin must be a valid ISO 8601 date'),
    query('timeMax').optional().isISO8601().withMessage('timeMax must be a valid ISO 8601 date'),
    query('maxResults').optional().isInt({ min: 1, max: 250 }).withMessage('maxResults must be between 1 and 250'),
  ],
  googleCalendarController.getEvents,
);

/**
 * @route   POST /google-calendar/events
 * @route   POST /google-calendar/events/:calendarId
 * @desc    Crea un evento en el calendario
 * @access  Private
 */
router.post(
  '/events',
  AuthMiddleware.authenticate,
  [
    body('summary').notEmpty().withMessage('Event summary is required'),
    body('start').isObject().withMessage('Event start is required'),
    body('start.dateTime').optional().isISO8601().withMessage('Start dateTime must be a valid ISO 8601 date'),
    body('start.date').optional().isDate().withMessage('Start date must be a valid date'),
    body('end').isObject().withMessage('Event end is required'),
    body('end.dateTime').optional().isISO8601().withMessage('End dateTime must be a valid ISO 8601 date'),
    body('end.date').optional().isDate().withMessage('End date must be a valid date'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('location').optional().isString().withMessage('Location must be a string'),
  ],
  googleCalendarController.createEvent,
);

router.post(
  '/events/:calendarId',
  AuthMiddleware.authenticate,
  [
    param('calendarId').isString().withMessage('Calendar ID must be a string'),
    body('summary').notEmpty().withMessage('Event summary is required'),
    body('start').isObject().withMessage('Event start is required'),
    body('start.dateTime').optional().isISO8601().withMessage('Start dateTime must be a valid ISO 8601 date'),
    body('start.date').optional().isDate().withMessage('Start date must be a valid date'),
    body('end').isObject().withMessage('Event end is required'),
    body('end.dateTime').optional().isISO8601().withMessage('End dateTime must be a valid ISO 8601 date'),
    body('end.date').optional().isDate().withMessage('End date must be a valid date'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('location').optional().isString().withMessage('Location must be a string'),
  ],
  googleCalendarController.createEvent,
);

/**
 * @route   DELETE /google-calendar/integration
 * @desc    Desconecta la integración de Google Calendar
 * @access  Private
 */
router.delete('/integration', AuthMiddleware.authenticate, googleCalendarController.disconnect);

export { router };
export default router;
