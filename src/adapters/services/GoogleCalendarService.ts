import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { GoogleCalendarIntegration } from '../../core/entities/GoogleCalendarIntegration';
import { CalendarEvent, CalendarListEntry, EventDateTime } from '../../core/interfaces/googleCalendar.interface';

export class GoogleCalendarService {
  private readonly oauth2Client: OAuth2Client;
  private readonly redirectUri: string;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    redirectUri: string,
  ) {
    this.redirectUri = redirectUri;
    this.oauth2Client = new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
  }

  /**
   * Genera la URL de autorización para que el usuario autorice la aplicación
   */
  public generateAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Para identificar al usuario después del callback
      prompt: 'consent', // Fuerza el consent para obtener refresh token
    });
  }

  /**
   * Intercambia el código de autorización por tokens de acceso
   */
  public async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      if (!tokens.refresh_token) {
        throw new Error('No refresh token received from Google');
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600, // Default 1 hour
      };
    } catch (error) {
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene información del usuario de Google
   */
  public async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
  }> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });

      const { data } = await oauth2.userinfo.get();

      if (!data.id || !data.email) {
        throw new Error('Incomplete user information from Google');
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name || data.email,
      };
    } catch (error) {
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresca el token de acceso usando el refresh token
   */
  public async refreshAccessToken(integration: GoogleCalendarIntegration): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: integration.refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('No access token received from token refresh');
      }

      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || integration.refreshToken,
        expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600,
      };
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene la lista de calendarios del usuario
   */
  public async getCalendarList(integration: GoogleCalendarIntegration): Promise<CalendarListEntry[]> {
    try {
      await this.ensureValidToken(integration);

      this.oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const { data } = await calendar.calendarList.list();

      return (
        data.items?.map((item) => ({
          id: item.id || '',
          summary: item.summary || '',
          description: item.description || undefined,
          primary: item.primary || false,
          accessRole: item.accessRole || 'reader',
        })) || []
      );
    } catch (error) {
      throw new Error(`Failed to get calendar list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene eventos de un calendario específico
   */
  public async getEvents(
    integration: GoogleCalendarIntegration,
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 50,
    calendarId: string = 'primary',
  ): Promise<CalendarEvent[]> {
    try {
      await this.ensureValidToken(integration);

      this.oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const { data } = await calendar.events.list({
        calendarId,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (
        data.items?.map((event) => ({
          id: event.id || '',
          summary: event.summary || '',
          description: event.description || undefined,
          start: this.parseEventDateTime(event.start),
          end: this.parseEventDateTime(event.end),
          location: event.location || undefined,
          attendees: event.attendees?.map((attendee) => ({
            email: attendee.email || '',
            displayName: attendee.displayName || undefined,
            responseStatus: attendee.responseStatus as 'needsAction' | 'declined' | 'tentative' | 'accepted' | undefined,
          })),
          status: event.status as 'confirmed' | 'tentative' | 'cancelled' | undefined,
          htmlLink: event.htmlLink || undefined,
        })) || []
      );
    } catch (error) {
      throw new Error(`Failed to get events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crea un evento en el calendario
   */
  public async createEvent(
    integration: GoogleCalendarIntegration,
    event: Omit<CalendarEvent, 'id' | 'htmlLink'>,
    calendarId: string = 'primary',
  ): Promise<CalendarEvent> {
    try {
      await this.ensureValidToken(integration);

      this.oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const { data } = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: this.formatEventDateTime(event.start),
          end: this.formatEventDateTime(event.end),
          location: event.location,
          attendees: event.attendees?.map((attendee) => ({
            email: attendee.email,
            displayName: attendee.displayName,
          })),
        },
      });

      return {
        id: data.id || '',
        summary: data.summary || '',
        description: data.description || undefined,
        start: this.parseEventDateTime(data.start),
        end: this.parseEventDateTime(data.end),
        location: data.location || undefined,
        attendees: data.attendees?.map((attendee) => ({
          email: attendee.email || '',
          displayName: attendee.displayName || undefined,
          responseStatus: attendee.responseStatus as 'needsAction' | 'declined' | 'tentative' | 'accepted' | undefined,
        })),
        status: data.status as 'confirmed' | 'tentative' | 'cancelled' | undefined,
        htmlLink: data.htmlLink || undefined,
      };
    } catch (error) {
      throw new Error(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifica y actualiza el token si es necesario
   */
  private async ensureValidToken(integration: GoogleCalendarIntegration): Promise<void> {
    if (integration.isTokenExpiringSoon()) {
      const refreshedTokens = await this.refreshAccessToken(integration);
      integration.updateTokens(refreshedTokens.accessToken, refreshedTokens.refreshToken, refreshedTokens.expiresIn);
    }
  }

  /**
   * Convierte EventDateTime de la API de Google a nuestro formato
   */
  private parseEventDateTime(
    dateTime: { dateTime?: string | null; date?: string | null; timeZone?: string | null } | null | undefined,
  ): EventDateTime {
    if (!dateTime) {
      return { dateTime: new Date().toISOString() };
    }

    if (dateTime.dateTime) {
      return {
        dateTime: dateTime.dateTime,
        timeZone: dateTime.timeZone || undefined,
      };
    }

    if (dateTime.date) {
      return {
        date: dateTime.date,
        timeZone: dateTime.timeZone || undefined,
      };
    }

    return { dateTime: new Date().toISOString() };
  }

  /**
   * Convierte nuestro formato EventDateTime al formato de la API de Google
   */
  private formatEventDateTime(dateTime: EventDateTime): { dateTime?: string; date?: string; timeZone?: string } {
    if (dateTime.date) {
      return {
        date: dateTime.date,
        timeZone: dateTime.timeZone,
      };
    }

    return {
      dateTime: dateTime.dateTime,
      timeZone: dateTime.timeZone,
    };
  }
}
