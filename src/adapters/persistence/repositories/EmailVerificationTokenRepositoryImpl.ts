import { IEmailVerificationTokenRepository } from '@core/repositories/IEmailVerificationTokenRepository';
import { Repository } from 'typeorm';
import { EmailVerificationToken } from '../../../core/entities/EmailVerificationToken';
import { EmailVerificationTokenFilters } from '../../../core/interfaces/emailVerificationToken.interface';
import { EmailVerificationTokenEntity } from '../entities/EmailVerificationTokenEntity';

export class EmailVerificationTokenRepositoryImpl implements IEmailVerificationTokenRepository {
  constructor(private readonly repository: Repository<EmailVerificationTokenEntity>) {}

  public async create(token: EmailVerificationToken): Promise<EmailVerificationToken> {
    const tokenEntity = this.repository.create({
      id: token.id,
      userId: token.userId,
      token: token.token,
      expiresAt: token.expiresAt,
      isUsed: token.isUsed,
    });

    const savedEntity = await this.repository.save(tokenEntity);
    return this.toDomainEntity(savedEntity);
  }

  public async save(token: EmailVerificationToken): Promise<EmailVerificationToken> {
    await this.repository.update(token.id, {
      isUsed: token.isUsed,
    });

    const updatedEntity = await this.repository.findOne({ where: { id: token.id } });
    if (!updatedEntity) {
      throw new Error('Token not found after update');
    }

    return this.toDomainEntity(updatedEntity);
  }

  public async findById(id: string): Promise<EmailVerificationToken | null> {
    const tokenEntity = await this.repository.findOne({ where: { id } });
    return tokenEntity ? this.toDomainEntity(tokenEntity) : null;
  }

  public async findByToken(token: string): Promise<EmailVerificationToken | null> {
    const tokenEntity = await this.repository.findOne({ where: { token } });
    return tokenEntity ? this.toDomainEntity(tokenEntity) : null;
  }

  public async findByUserId(userId: string): Promise<EmailVerificationToken[]> {
    const tokenEntities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return tokenEntities.map((entity) => this.toDomainEntity(entity));
  }

  public async findValidByUserId(userId: string): Promise<EmailVerificationToken | null> {
    const tokenEntity = await this.repository.findOne({
      where: {
        userId,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!tokenEntity) {
      return null;
    }

    const domainToken = this.toDomainEntity(tokenEntity);
    return domainToken.isValid() ? domainToken : null;
  }

  public async findAll(filters?: EmailVerificationTokenFilters): Promise<EmailVerificationToken[]> {
    const query = this.repository.createQueryBuilder('token');

    if (filters?.userId) {
      query.andWhere('token.userId = :userId', { userId: filters.userId });
    }

    if (filters?.isUsed !== undefined) {
      query.andWhere('token.isUsed = :isUsed', { isUsed: filters.isUsed });
    }

    if (filters?.isExpired !== undefined) {
      if (filters.isExpired) {
        query.andWhere('token.expiresAt <= :now', { now: new Date() });
      } else {
        query.andWhere('token.expiresAt > :now', { now: new Date() });
      }
    }

    const tokenEntities = await query.getMany();
    return tokenEntities.map((entity) => this.toDomainEntity(entity));
  }

  public async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  public async deleteByUserId(userId: string): Promise<void> {
    await this.repository.delete({ userId });
  }

  public async deleteExpiredTokens(): Promise<void> {
    await this.repository.createQueryBuilder().delete().where('expiresAt <= :now', { now: new Date() }).execute();
  }

  private toDomainEntity(tokenEntity: EmailVerificationTokenEntity): EmailVerificationToken {
    return new EmailVerificationToken(
      tokenEntity.id,
      tokenEntity.userId,
      tokenEntity.token,
      tokenEntity.createdAt,
      tokenEntity.expiresAt,
      tokenEntity.isUsed,
    );
  }
}
