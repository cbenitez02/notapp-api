import { IPasswordResetTokenRepository } from '../../repositories/IPasswordResetTokenRepository';
import { IUserRepository } from '../../repositories/IUserRepository';
import { ResetPasswordDto } from '../../interfaces/passwordReset.interface';
import { User } from '../../entities/User';
import bcrypt from 'bcrypt';

export class ResetPasswordUseCase {
  constructor(
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<User> {
    // Buscar el token
    const resetToken = await this.passwordResetTokenRepository.findByToken(dto.token);
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Verificar que el token sea válido
    if (!resetToken.isValid()) {
      throw new Error('Reset token has expired or has already been used');
    }

    // Buscar el usuario
    const user = await this.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validar la nueva contraseña
    if (dto.newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Actualizar la contraseña del usuario
    const updatedUser = await this.userRepository.update(user.id, { passwordHash: hashedPassword });

    // Marcar el token como usado
    resetToken.markAsUsed();
    await this.passwordResetTokenRepository.update(resetToken);

    // Invalidar todos los tokens de reset del usuario por seguridad
    await this.passwordResetTokenRepository.invalidateAllUserTokens(user.id);

    return updatedUser;
  }
}