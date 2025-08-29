import { Repository } from 'typeorm';
import { UserSession } from '../../../core/entities/UserSession';
import { UserSessionFilters } from '../../../core/interfaces/user.interface';
import { IUserSessionRepository } from '../../../core/repositories/IUserSessionRepository';
import { UserSessionEntity } from '../entities/UserSessionEntity';

export class UserSessionRepositoryImpl implements IUserSessionRepository {
  constructor(private readonly repository: Repository<UserSessionEntity>) {}

  public async create(session: UserSession): Promise<UserSession> {
    const sessionEntity = this.repository.create({
      id: session.id,
      userId: session.userId,
      refreshToken: session.refreshToken,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    });

    const savedEntity = await this.repository.save(sessionEntity);
    return this.toDomainEntity(savedEntity);
  }

  public async save(session: UserSession): Promise<UserSession> {
    await this.repository.update(session.id, {
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });

    const updatedEntity = await this.repository.findOneBy({ id: session.id });
    if (!updatedEntity) {
      throw new Error('Session not found after update');
    }

    return this.toDomainEntity(updatedEntity);
  }

  public async findById(id: string): Promise<UserSession | null> {
    const sessionEntity = await this.repository.findOne({ where: { id } });
    return sessionEntity ? this.toDomainEntity(sessionEntity) : null;
  }

  public async findByUserId(userId: string): Promise<UserSession[]> {
    const sessionEntities = await this.repository.find({ where: { userId } });
    return sessionEntities.map(this.toDomainEntity);
  }

  public async findByRefreshToken(refreshToken: string): Promise<UserSession | null> {
    const sessionEntity = await this.repository.findOne({ where: { refreshToken } });
    return sessionEntity ? this.toDomainEntity(sessionEntity) : null;
  }

  public async findActiveByUserId(userId: string): Promise<UserSession[]> {
    const sessionEntities = await this.repository.find({
      where: {
        userId,
        expiresAt: require('typeorm').MoreThan(new Date()),
      },
    });
    return sessionEntities.map((entity) => this.toDomainEntity(entity));
  }

  public async findAll(filters?: UserSessionFilters): Promise<UserSession[]> {
    const query = this.repository.createQueryBuilder('session');

    if (filters?.userId) {
      query.andWhere('session.userId = :userId', { userId: filters.userId });
    }

    if (filters?.isActive !== undefined) {
      if (filters.isActive) {
        query.andWhere('session.expiresAt > :now', { now: new Date() });
      } else {
        query.andWhere('session.expiresAt <= :now', { now: new Date() });
      }
    }

    if (filters?.ipAddress) {
      query.andWhere('session.ipAddress = :ipAddress', { ipAddress: filters.ipAddress });
    }

    const sessionEntities = await query.getMany();
    return sessionEntities.map((entity) => this.toDomainEntity(entity));
  }

  public async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  public async deleteByUserId(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }

  public async deleteExpiredSessions(): Promise<void> {
    await this.repository.createQueryBuilder().delete().where('expires_at <= :now', { now: new Date() }).execute();
  }

  private toDomainEntity(sessionEntity: UserSessionEntity): UserSession {
    return new UserSession(
      sessionEntity.id,
      sessionEntity.userId,
      sessionEntity.refreshToken || '',
      sessionEntity.ipAddress || '',
      sessionEntity.userAgent || '',
      sessionEntity.createdAt,
      sessionEntity.expiresAt || new Date(),
      sessionEntity.expiresAt ? sessionEntity.expiresAt > new Date() : false,
    );
  }
}
