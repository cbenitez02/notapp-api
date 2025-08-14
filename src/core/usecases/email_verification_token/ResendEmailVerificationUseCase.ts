import { IEmailVerificationTokenRepository } from '@core/repositories/IEmailVerificationTokenRepository';
import { IUserRepository } from '@core/repositories/IUserRepository';
import { EmailVerificationToken } from '../../entities/EmailVerificationToken';
import { CreateEmailVerificationTokenUseCase } from './CreateEmailVerificationTokenUseCase';

export class ResendEmailVerificationUseCase {
  constructor(
    private readonly tokenRepository: IEmailVerificationTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly createTokenUseCase: CreateEmailVerificationTokenUseCase,
  ) {}

  async execute(userId: string): Promise<EmailVerificationToken> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Verificar límite de reenvíos (opcional)
    await this.checkResendLimit(userId);

    // Crear nuevo token usando el caso de uso existente
    return await this.createTokenUseCase.execute({ userId });
  }

  private async checkResendLimit(userId: string): Promise<void> {
    const recentTokens = await this.tokenRepository.findByUserId(userId);
    const recentCount = recentTokens.filter((token) => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return token.createdAt > fiveMinutesAgo;
    }).length;

    if (recentCount >= 3) {
      throw new Error('Too many verification attempts. Please wait 5 minutes before requesting again.');
    }
  }
}
