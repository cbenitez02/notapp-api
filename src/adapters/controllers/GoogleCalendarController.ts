import { Request, Response } from 'express';
import { GoogleCalendarIntegration } from '../../core/entities/GoogleCalendarIntegration';
import { AuthRequest } from '../../core/interfaces/auth.interface';
import { GoogleCalendarIntegrationRepository } from '../persistence/repositories/GoogleCalendarIntegrationRepository';
import { GoogleCalendarService } from '../services/GoogleCalendarService';

export class GoogleCalendarController {
  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly integrationRepository: GoogleCalendarIntegrationRepository,
  ) {}

  /**
   * Inicia el proceso de autorización de Google Calendar
   */
  public authorize = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Verificar si ya existe una integración activa
      const existingIntegration = await this.integrationRepository.findByUserId(userId);
      if (existingIntegration) {
        res.status(400).json({
          success: false,
          message: 'Google Calendar integration already exists for this user',
          data: {
            integration: existingIntegration.toJSON(),
          },
        });
        return;
      }

      const authUrl = this.googleCalendarService.generateAuthUrl(userId);

      res.status(200).json({
        success: true,
        message: 'Authorization URL generated successfully',
        data: {
          authUrl,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate authorization URL',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Maneja el callback de Google OAuth
   */
  public callback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Error de Autorización</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #f44336; font-size: 24px; margin-bottom: 20px; }
              .message { color: #666; font-size: 16px; }
            </style>
          </head>
          <body>
            <div class="error">❌ Error de Autorización</div>
            <div class="message">Faltan parámetros requeridos. Esta ventana se cerrará automáticamente...</div>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
          </html>
        `);
        return;
      }

      const userId = state as string;

      // Intercambiar código por tokens
      const tokens = await this.googleCalendarService.exchangeCodeForTokens(code as string);

      // Obtener información del usuario de Google
      const userInfo = await this.googleCalendarService.getUserInfo(tokens.accessToken);

      // Verificar si esta cuenta de Google ya está asociada a otro usuario
      const existingIntegration = await this.integrationRepository.findByGoogleAccountId(userInfo.id);
      if (existingIntegration) {
        res.status(400).json({
          success: false,
          message: 'This Google account is already associated with another user',
        });
        return;
      }

      // Crear nueva integración
      const integration = new GoogleCalendarIntegration({
        userId,
        googleAccountId: userInfo.id,
        googleEmail: userInfo.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });

      const savedIntegration = await this.integrationRepository.save(integration);

      // Enviar página HTML simple que solo notifique al padre
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Autorización Exitosa</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f0f8ff;
            }
            .success { 
              color: #4CAF50; 
              font-size: 28px; 
              margin-bottom: 20px; 
              font-weight: bold;
            }
            .message { 
              color: #666; 
              font-size: 18px; 
              margin-bottom: 30px;
            }
            .close-btn {
              background: #4CAF50;
              color: white;
              border: none;
              padding: 15px 30px;
              font-size: 16px;
              border-radius: 8px;
              cursor: pointer;
              transition: background 0.3s;
            }
            .close-btn:hover {
              background: #45a049;
            }
          </style>
        </head>
        <body>
          <div class="success">✅ Google Calendar Conectado Exitosamente</div>
          <div class="message">Ya puedes cerrar esta ventana</div>
          <button class="close-btn" onclick="cerrarVentana()">
            Cerrar Ventana
          </button>
          <script>
            // Notificar inmediatamente al padre
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                  type: 'GOOGLE_CALENDAR_AUTH_SUCCESS',
                  success: true,
                  data: ${JSON.stringify(savedIntegration.toJSON())}
                }, '*');
                console.log('Mensaje enviado al padre');
              }
            } catch (e) {
              console.error('Error enviando mensaje:', e);
            }
            
            function cerrarVentana() {
              window.close();
            }
            
            // Auto-foco en el botón
            document.addEventListener('DOMContentLoaded', () => {
              document.querySelector('.close-btn').focus();
            });
            
            // Cerrar con Enter o Escape
            document.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                cerrarVentana();
              }
            });
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process OAuth callback',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Obtiene la integración del usuario actual
   */
  public getIntegration = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const integration = await this.integrationRepository.findByUserId(userId);

      if (!integration) {
        res.status(404).json({
          success: false,
          message: 'Google Calendar integration not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Integration retrieved successfully',
        data: {
          integration: integration.toJSON(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve integration',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Obtiene la lista de calendarios del usuario
   */
  public getCalendars = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const integration = await this.integrationRepository.findByUserId(userId);

      if (!integration) {
        res.status(404).json({
          success: false,
          message: 'Google Calendar integration not found',
        });
        return;
      }

      const calendars = await this.googleCalendarService.getCalendarList(integration);

      // Actualizar la integración si se refrescaron los tokens
      await this.integrationRepository.update(integration);

      res.status(200).json({
        success: true,
        message: 'Calendars retrieved successfully',
        data: {
          calendars,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve calendars',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Obtiene eventos de un calendario específico
   */
  public getEvents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const integration = await this.integrationRepository.findByUserId(userId);

      if (!integration) {
        res.status(404).json({
          success: false,
          message: 'Google Calendar integration not found',
        });
        return;
      }

      const calendarId = req.params.calendarId || 'primary';
      const { timeMin, timeMax, maxResults = '50' } = req.query;

      const events = await this.googleCalendarService.getEvents(
        integration,
        timeMin ? new Date(timeMin as string) : undefined,
        timeMax ? new Date(timeMax as string) : undefined,
        parseInt(maxResults as string, 10),
        calendarId,
      );

      // Actualizar la integración si se refrescaron los tokens
      await this.integrationRepository.update(integration);

      res.status(200).json({
        success: true,
        message: 'Events retrieved successfully',
        data: {
          events,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve events',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Crea un evento en el calendario
   */
  public createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const integration = await this.integrationRepository.findByUserId(userId);

      if (!integration) {
        res.status(404).json({
          success: false,
          message: 'Google Calendar integration not found',
        });
        return;
      }

      const calendarId = req.params.calendarId || 'primary';
      const eventData = req.body as Omit<import('../../core/interfaces/googleCalendar.interface').CalendarEvent, 'id' | 'htmlLink'>;

      const event = await this.googleCalendarService.createEvent(integration, eventData, calendarId);

      // Actualizar la integración si se refrescaron los tokens
      await this.integrationRepository.update(integration);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: {
          event,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create event',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Desconecta la integración de Google Calendar
   */
  public disconnect = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const integration = await this.integrationRepository.findByUserId(userId);

      if (!integration) {
        res.status(404).json({
          success: false,
          message: 'Google Calendar integration not found',
        });
        return;
      }

      integration.deactivate();
      await this.integrationRepository.update(integration);

      res.status(200).json({
        success: true,
        message: 'Google Calendar integration disconnected successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect integration',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
