import { IEmailVerificationTokenRepository } from '@core/repositories/IEmailVerificationTokenRepository';
import { IUserRepository } from '@core/repositories/IUserRepository';
import { User } from '../../entities/User';

export class VerifyEmailTokenUseCase {
  constructor(
    private readonly tokenRepository: IEmailVerificationTokenRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(token: string): Promise<User> {
    if (!token || token.trim().length === 0) {
      throw new Error('Verification token is required');
    }

    // Buscar el token
    const verificationToken = await this.tokenRepository.findByToken(token);
    if (!verificationToken) {
      throw new Error('Invalid verification token');
    }

    // Verificar que el token es válido
    if (!verificationToken.isValid()) {
      throw new Error('Token is expired or already used');
    }

    // Buscar el usuario
    const user = await this.userRepository.findById(verificationToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Marcar token como usado
    verificationToken.markAsUsed();
    await this.tokenRepository.save(verificationToken);

    // Verificar email del usuario
    user.verifyEmail();
    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }
}
