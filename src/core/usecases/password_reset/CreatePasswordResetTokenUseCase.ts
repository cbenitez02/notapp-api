import { IPasswordResetTokenRepository } from '../../repositories/IPasswordResetTokenRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { IEmailService } from '../../interfaces/email.interface';
import { CreatePasswordResetTokenDto } from '../../interfaces/passwordReset.interface';
import { PasswordResetToken } from '../../entities/PasswordResetToken';

export class CreatePasswordResetTokenUseCase {
  constructor(
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(dto: CreatePasswordResetTokenDto): Promise<PasswordResetToken> {
    // Validar que el usuario existe
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('User not found with this email address');
    }

    // Invalidar todos los tokens existentes del usuario
    await this.passwordResetTokenRepository.invalidateAllUserTokens(user.id);

    // Crear nuevo token
    const token = new PasswordResetToken(user.id, dto.expiresInMinutes || 60);
    
    // Guardar el token
    const savedToken = await this.passwordResetTokenRepository.create(token);

    // Enviar email de reset
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${savedToken.token}`;
    
    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      username: user.fullname,
      resetUrl,
    });

    return savedToken;
  }
}