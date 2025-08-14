import { IEmailVerificationTokenRepository } from '@core/repositories/IEmailVerificationTokenRepository';
import { IUserRepository } from '@core/repositories/IUserRepository';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { EmailVerificationToken } from '../../entities/EmailVerificationToken';
import { CreateEmailVerificationTokenDto } from '../../interfaces/emailVerificationToken.interface';

export class CreateEmailVerificationTokenUseCase {
  constructor(
    private readonly tokenRepository: IEmailVerificationTokenRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(createTokenDto: CreateEmailVerificationTokenDto): Promise<EmailVerificationToken> {
    this.validateCreateTokenDto(createTokenDto);

    const { userId, expiresInMinutes = 1440 } = createTokenDto; // Default: 24 hours

    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('Cannot create verification token for inactive user');
    }

    if (user.emailVerified) {
      throw new Error('User email is already verified');
    }

    // Invalidar tokens existentes para este usuario
    await this.invalidateExistingTokens(userId);

    // Generar token seguro
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Crear nuevo token
    const newToken = new EmailVerificationToken(uuidv4(), userId, token, new Date(), expiresAt, false);

    return await this.tokenRepository.create(newToken);
  }

  private async invalidateExistingTokens(userId: string): Promise<void> {
    const existingTokens = await this.tokenRepository.findValidByUserId(userId);
    if (existingTokens) {
      existingTokens.markAsUsed();
      await this.tokenRepository.save(existingTokens);
    }
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private validateCreateTokenDto(dto: CreateEmailVerificationTokenDto): void {
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (dto.expiresInMinutes && (dto.expiresInMinutes < 1 || dto.expiresInMinutes > 10080)) {
      throw new Error('Expiration time must be between 1 minute and 1 week');
    }
  }
}
