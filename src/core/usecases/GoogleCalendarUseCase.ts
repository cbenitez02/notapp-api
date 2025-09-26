import { GoogleCalendarService } from '../../adapters/services/GoogleCalendarService';
import { GoogleCalendarIntegration } from '../entities/GoogleCalendarIntegration';
import { CalendarEvent, CalendarListEntry } from '../interfaces/googleCalendar.interface';
import { IGoogleCalendarIntegrationRepository } from '../repositories/IGoogleCalendarIntegrationRepository';

export class GoogleCalendarUseCase {
  constructor(
    private readonly integrationRepository: IGoogleCalendarIntegrationRepository,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  /**
   * Genera la URL de autorización para un usuario
   */
  async generateAuthUrl(userId: string): Promise<string> {
    // Verificar si ya existe una integración activa
    const existingIntegration = await this.integrationRepository.findByUserId(userId);
    if (existingIntegration) {
      throw new Error('Google Calendar integration already exists for this user');
    }

    return this.googleCalendarService.generateAuthUrl(userId);
  }

  /**
   * Procesa el callback de OAuth y crea la integración
   */
  async processOAuthCallback(code: string, userId: string): Promise<GoogleCalendarIntegration> {
    // Intercambiar código por tokens
    const tokens = await this.googleCalendarService.exchangeCodeForTokens(code);

    // Obtener información del usuario de Google
    const userInfo = await this.googleCalendarService.getUserInfo(tokens.accessToken);

    // Verificar si esta cuenta de Google ya está asociada a otro usuario
    const existingIntegration = await this.integrationRepository.findByGoogleAccountId(userInfo.id);
    if (existingIntegration) {
      throw new Error('This Google account is already associated with another user');
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

    return await this.integrationRepository.save(integration);
  }

  /**
   * Obtiene la integración de un usuario
   */
  async getUserIntegration(userId: string): Promise<GoogleCalendarIntegration> {
    const integration = await this.integrationRepository.findByUserId(userId);
    if (!integration) {
      throw new Error('Google Calendar integration not found');
    }

    return integration;
  }

  /**
   * Obtiene la lista de calendarios
   */
  async getCalendars(userId: string): Promise<CalendarListEntry[]> {
    const integration = await this.getUserIntegration(userId);
    const calendars = await this.googleCalendarService.getCalendarList(integration);

    // Actualizar la integración si se refrescaron los tokens
    await this.integrationRepository.update(integration);

    return calendars;
  }

  /**
   * Obtiene eventos de un calendario
   */
  async getEvents(userId: string, timeMin?: Date, timeMax?: Date, maxResults: number = 50, calendarId: string = 'primary'): Promise<CalendarEvent[]> {
    const integration = await this.getUserIntegration(userId);
    const events = await this.googleCalendarService.getEvents(integration, timeMin, timeMax, maxResults, calendarId);

    // Actualizar la integración si se refrescaron los tokens
    await this.integrationRepository.update(integration);

    return events;
  }

  /**
   * Crea un evento en el calendario
   */
  async createEvent(userId: string, eventData: Omit<CalendarEvent, 'id' | 'htmlLink'>, calendarId: string = 'primary'): Promise<CalendarEvent> {
    const integration = await this.getUserIntegration(userId);
    const event = await this.googleCalendarService.createEvent(integration, eventData, calendarId);

    // Actualizar la integración si se refrescaron los tokens
    await this.integrationRepository.update(integration);

    return event;
  }

  /**
   * Desconecta la integración de Google Calendar
   */
  async disconnectIntegration(userId: string): Promise<void> {
    const integration = await this.getUserIntegration(userId);
    integration.deactivate();
    await this.integrationRepository.update(integration);
  }

  /**
   * Refresca tokens que están por expirar
   */
  async refreshExpiringSoonTokens(): Promise<void> {
    const integrations = await this.integrationRepository.findTokensExpiringSoon(10); // 10 minutos antes

    for (const integration of integrations) {
      try {
        const refreshedTokens = await this.googleCalendarService.refreshAccessToken(integration);
        integration.updateTokens(refreshedTokens.accessToken, refreshedTokens.refreshToken, refreshedTokens.expiresIn);
        await this.integrationRepository.update(integration);
      } catch (error) {
        console.error(`Failed to refresh tokens for integration ${integration.id}:`, error);
        // Podrías desactivar la integración si el refresh falla repetidamente
      }
    }
  }
}
