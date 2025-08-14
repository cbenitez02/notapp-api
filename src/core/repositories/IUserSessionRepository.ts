import { UserSession } from '../entities/UserSession';
import { UserSessionFilters } from '../interfaces/user.interface';

export interface IUserSessionRepository {
  create(session: UserSession): Promise<UserSession>;
  save(session: UserSession): Promise<UserSession>;
  findById(id: string): Promise<UserSession | null>;
  findByUserId(userId: string): Promise<UserSession[]>;
  findByRefreshToken(refreshToken: string): Promise<UserSession | null>;
  findActiveByUserId(userId: string): Promise<UserSession[]>;
  findAll(filters?: UserSessionFilters): Promise<UserSession[]>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
}
