import { Repository } from 'typeorm';
import { PasswordResetToken } from '../../../core/entities/PasswordResetToken';
import { PasswordResetTokenFilters } from '../../../core/interfaces/passwordReset.interface';
import { IPasswordResetTokenRepository } from '../../../core/repositories/IPasswordResetTokenRepository';
import { PasswordResetTokenEntity } from '../entities/PasswordResetTokenEntity';

export class PasswordResetTokenRepositoryImpl implements IPasswordResetTokenRepository {
  constructor(private readonly repository: Repository<PasswordResetTokenEntity>) {}

  public async create(token: PasswordResetToken): Promise<PasswordResetToken> {
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

  public async update(token: PasswordResetToken): Promise<PasswordResetToken> {
    await this.repository.update(token.id, {
      isUsed: token.isUsed,
    });

    const updatedEntity = await this.repository.findOne({ where: { id: token.id } });
    if (!updatedEntity) {
      throw new Error('Token not found after update');
    }

    return this.toDomainEntity(updatedEntity);
  }

  public async findByToken(token: string): Promise<PasswordResetToken | null> {
    const tokenEntity = await this.repository.findOne({ where: { token } });
    return tokenEntity ? this.toDomainEntity(tokenEntity) : null;
  }

  public async findByUserId(userId: string): Promise<PasswordResetToken[]> {
    const tokenEntities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return tokenEntities.map((entity) => this.toDomainEntity(entity));
  }

  public async findActiveByUserId(userId: string): Promise<PasswordResetToken | null> {
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

  public async findAll(filters?: PasswordResetTokenFilters): Promise<PasswordResetToken[]> {
    const query = this.repository.createQueryBuilder('token');

    if (filters?.userId) {
      query.andWhere('token.userId = :userId', { userId: filters.userId });
    }

    if (filters?.isUsed !== undefined) {
      query.andWhere('token.isUsed = :isUsed', { isUsed: filters.isUsed });
    }

    if (filters?.isValid !== undefined) {
      if (filters.isValid) {
        query.andWhere('token.isUsed = :isUsed AND token.expiresAt > :now', {
          isUsed: false,
          now: new Date(),
        });
      } else {
        query.andWhere('token.isUsed = :isUsed OR token.expiresAt <= :now', {
          isUsed: true,
          now: new Date(),
        });
      }
    }

    const tokenEntities = await query.getMany();
    return tokenEntities.map((entity) => this.toDomainEntity(entity));
  }

  public async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  public async deleteExpiredTokens(): Promise<number> {
    const result = await this.repository.createQueryBuilder().delete().where('expires_at <= :now', { now: new Date() }).execute();

    return result.affected || 0;
  }

  public async invalidateAllUserTokens(userId: string): Promise<void> {
    await this.repository.update({ userId }, { isUsed: true });
  }

  private toDomainEntity(tokenEntity: PasswordResetTokenEntity): PasswordResetToken {
    const token = new PasswordResetToken(tokenEntity.userId, 0); // expiresInMinutes no es usado aquí

    // Asignamos los valores de la entidad manualmente
    (token as any).id = tokenEntity.id;
    (token as any).token = tokenEntity.token;
    (token as any).createdAt = tokenEntity.createdAt;
    (token as any).expiresAt = tokenEntity.expiresAt;
    token.isUsed = tokenEntity.isUsed;

    return token;
  }
}
