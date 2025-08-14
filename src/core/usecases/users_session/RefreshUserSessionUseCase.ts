import { UserSession } from '../../entities/UserSession';
import { IUserSessionRepository } from '../../repositories/IUserSessionRepository';

export class RefreshUserSessionUseCase {
  constructor(private readonly userSessionRepository: IUserSessionRepository) {}

  async execute(refreshToken: string, newRefreshToken: string, newExpiresAt: Date): Promise<UserSession> {
    if (!refreshToken || refreshToken.trim().length === 0) {
      throw new Error('Refresh token is required');
    }

    const session = await this.userSessionRepository.findByRefreshToken(refreshToken);
    if (!session) {
      throw new Error('Invalid refresh token');
    }

    if (!session.isValidForRefresh()) {
      throw new Error('Session is not valid for refresh');
    }

    // Actualizar la sesión
    session.updateRefreshToken(newRefreshToken);
    session.extendSession(newExpiresAt);

    return await this.userSessionRepository.save(session);
  }
}
