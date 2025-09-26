import { GoogleCalendarIntegration } from '../../core/entities/GoogleCalendarIntegration';

export interface IGoogleCalendarIntegrationRepository {
  /**
   * Busca una integración por ID de usuario
   */
  findByUserId(userId: string): Promise<GoogleCalendarIntegration | null>;

  /**
   * Busca una integración por ID de cuenta de Google
   */
  findByGoogleAccountId(googleAccountId: string): Promise<GoogleCalendarIntegration | null>;

  /**
   * Busca una integración por ID
   */
  findById(id: string): Promise<GoogleCalendarIntegration | null>;

  /**
   * Guarda una nueva integración
   */
  save(integration: GoogleCalendarIntegration): Promise<GoogleCalendarIntegration>;

  /**
   * Actualiza una integración existente
   */
  update(integration: GoogleCalendarIntegration): Promise<GoogleCalendarIntegration>;

  /**
   * Elimina una integración
   */
  delete(id: string): Promise<void>;

  /**
   * Obtiene todas las integraciones activas
   */
  findActiveIntegrations(): Promise<GoogleCalendarIntegration[]>;

  /**
   * Obtiene integraciones con tokens que expiran pronto
   */
  findTokensExpiringSoon(minutesBefore: number): Promise<GoogleCalendarIntegration[]>;
}
