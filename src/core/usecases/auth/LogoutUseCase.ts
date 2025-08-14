import { IUserSessionRepository } from '../../repositories/IUserSessionRepository';

export class LogoutUseCase {
  constructor(private readonly userSessionRepository: IUserSessionRepository) {}

  async execute(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    const session = await this.userSessionRepository.findByRefreshToken(refreshToken);
    if (!session) {
      throw new Error('Session not found');
    }

    // Revoke the session
    session.revoke();
    await this.userSessionRepository.save(session);
  }

  async logoutAllSessions(userId: string): Promise<void> {
    const sessions = await this.userSessionRepository.findActiveByUserId(userId);

    for (const session of sessions) {
      session.revoke();
      await this.userSessionRepository.save(session);
    }
  }
}
