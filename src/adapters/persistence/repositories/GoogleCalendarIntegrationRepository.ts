import { Repository } from 'typeorm';
import { GoogleCalendarIntegration } from '../../../core/entities/GoogleCalendarIntegration';
import { IGoogleCalendarIntegrationRepository } from '../../../core/repositories/IGoogleCalendarIntegrationRepository';
import { AppDataSource } from '../../database/ormconfig';
import { GoogleCalendarIntegrationEntity } from '../entities/GoogleCalendarIntegrationEntity';

export class GoogleCalendarIntegrationRepository implements IGoogleCalendarIntegrationRepository {
  private readonly repository: Repository<GoogleCalendarIntegrationEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(GoogleCalendarIntegrationEntity);
  }

  async findByUserId(userId: string): Promise<GoogleCalendarIntegration | null> {
    try {
      const entity = await this.repository.findOne({
        where: { userId, isActive: true },
      });

      return entity ? this.mapEntityToClass(entity) : null;
    } catch (error) {
      throw new Error(`Failed to find integration by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByGoogleAccountId(googleAccountId: string): Promise<GoogleCalendarIntegration | null> {
    try {
      const entity = await this.repository.findOne({
        where: { googleAccountId, isActive: true },
      });

      return entity ? this.mapEntityToClass(entity) : null;
    } catch (error) {
      throw new Error(`Failed to find integration by Google account ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<GoogleCalendarIntegration | null> {
    try {
      const entity = await this.repository.findOne({
        where: { id },
      });

      return entity ? this.mapEntityToClass(entity) : null;
    } catch (error) {
      throw new Error(`Failed to find integration by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async save(integration: GoogleCalendarIntegration): Promise<GoogleCalendarIntegration> {
    try {
      const entity = this.mapClassToEntity(integration);
      const savedEntity = await this.repository.save(entity);
      return this.mapEntityToClass(savedEntity);
    } catch (error) {
      throw new Error(`Failed to save integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(integration: GoogleCalendarIntegration): Promise<GoogleCalendarIntegration> {
    try {
      const entity = this.mapClassToEntity(integration);
      entity.updatedAt = new Date();

      await this.repository.update(integration.id, entity);
      const updatedEntity = await this.repository.findOne({
        where: { id: integration.id },
      });

      if (!updatedEntity) {
        throw new Error('Integration not found after update');
      }

      return this.mapEntityToClass(updatedEntity);
    } catch (error) {
      throw new Error(`Failed to update integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findActiveIntegrations(): Promise<GoogleCalendarIntegration[]> {
    try {
      const entities = await this.repository.find({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });

      return entities.map((entity) => this.mapEntityToClass(entity));
    } catch (error) {
      throw new Error(`Failed to find active integrations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findTokensExpiringSoon(minutesBefore: number = 5): Promise<GoogleCalendarIntegration[]> {
    try {
      const expirationThreshold = new Date(Date.now() + minutesBefore * 60 * 1000);

      const entities = await this.repository
        .createQueryBuilder('integration')
        .where('integration.isActive = :isActive', { isActive: true })
        .andWhere('integration.tokenExpiresAt <= :threshold', { threshold: expirationThreshold })
        .getMany();

      return entities.map((entity) => this.mapEntityToClass(entity));
    } catch (error) {
      throw new Error(`Failed to find tokens expiring soon: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapEntityToClass(entity: GoogleCalendarIntegrationEntity): GoogleCalendarIntegration {
    const integration = new GoogleCalendarIntegration({
      userId: entity.userId,
      googleAccountId: entity.googleAccountId,
      googleEmail: entity.googleEmail,
      accessToken: entity.accessToken,
      refreshToken: entity.refreshToken,
      expiresIn: Math.floor((entity.tokenExpiresAt.getTime() - Date.now()) / 1000),
      id: entity.id,
      calendarId: entity.calendarId,
    });

    // Actualizar campos que no están en el constructor
    Object.assign(integration, {
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      tokenExpiresAt: entity.tokenExpiresAt,
    });

    return integration;
  }

  private mapClassToEntity(integration: GoogleCalendarIntegration): GoogleCalendarIntegrationEntity {
    const entity = new GoogleCalendarIntegrationEntity();
    entity.id = integration.id;
    entity.userId = integration.userId;
    entity.googleAccountId = integration.googleAccountId;
    entity.googleEmail = integration.googleEmail;
    entity.accessToken = integration.accessToken;
    entity.refreshToken = integration.refreshToken;
    entity.tokenExpiresAt = integration.tokenExpiresAt;
    entity.calendarId = integration.calendarId;
    entity.isActive = integration.isActive;
    entity.createdAt = integration.createdAt;
    entity.updatedAt = integration.updatedAt;

    return entity;
  }
}
