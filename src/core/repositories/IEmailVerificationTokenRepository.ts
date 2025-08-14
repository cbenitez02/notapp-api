import { EmailVerificationToken } from '../entities/EmailVerificationToken';
import { EmailVerificationTokenFilters } from '../interfaces/emailVerificationToken.interface';

export interface IEmailVerificationTokenRepository {
  create(token: EmailVerificationToken): Promise<EmailVerificationToken>;
  save(token: EmailVerificationToken): Promise<EmailVerificationToken>;
  findById(id: string): Promise<EmailVerificationToken | null>;
  findByToken(token: string): Promise<EmailVerificationToken | null>;
  findByUserId(userId: string): Promise<EmailVerificationToken[]>;
  findValidByUserId(userId: string): Promise<EmailVerificationToken | null>;
  findAll(filters?: EmailVerificationTokenFilters): Promise<EmailVerificationToken[]>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
}
