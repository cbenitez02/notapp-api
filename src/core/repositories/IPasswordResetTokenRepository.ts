import { PasswordResetToken } from '../entities/PasswordResetToken';
import { PasswordResetTokenFilters } from '../interfaces/passwordReset.interface';

export interface IPasswordResetTokenRepository {
  create(token: PasswordResetToken): Promise<PasswordResetToken>;
  findByToken(token: string): Promise<PasswordResetToken | null>;
  findByUserId(userId: string): Promise<PasswordResetToken[]>;
  findActiveByUserId(userId: string): Promise<PasswordResetToken | null>;
  update(token: PasswordResetToken): Promise<PasswordResetToken>;
  delete(id: string): Promise<void>;
  findAll(filters?: PasswordResetTokenFilters): Promise<PasswordResetToken[]>;
  deleteExpiredTokens(): Promise<number>;
  invalidateAllUserTokens(userId: string): Promise<void>;
}
