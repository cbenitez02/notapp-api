import { IUserSessionRepository } from '../../repositories/IUserSessionRepository';

export class RevokeUserSessionUseCase {
  constructor(private readonly userSessionRepository: IUserSessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new Error('Session ID is required');
    }

    const session = await this.userSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.revoke();
    await this.userSessionRepository.save(session);
  }

  async executeByUserId(userId: string): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    const sessions = await this.userSessionRepository.findActiveByUserId(userId);

    for (const session of sessions) {
      session.revoke();
      await this.userSessionRepository.save(session);
    }
  }
}
