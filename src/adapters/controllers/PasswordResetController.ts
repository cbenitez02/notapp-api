import { Request, Response } from 'express';
import { CreatePasswordResetTokenDto, PasswordResetTokenResponseDto, ResetPasswordDto } from '../../core/interfaces/passwordReset.interface';
import { CreatePasswordResetTokenUseCase } from '../../core/usecases/password_reset/CreatePasswordResetTokenUseCase';
import { ResetPasswordUseCase } from '../../core/usecases/password_reset/ResetPasswordUseCase';

export class PasswordResetController {
  constructor(
    private readonly createTokenUseCase: CreatePasswordResetTokenUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  public async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const validationErrors = this.validateRequestPasswordReset(req.body);
      if (validationErrors.length > 0) {
        res.status(400).json({ error: 'Validation failed', details: validationErrors });
        return;
      }

      const { email } = req.body;
      const tokenDto: CreatePasswordResetTokenDto = {
        email: email.trim().toLowerCase(),
      };

      const token = await this.createTokenUseCase.execute(tokenDto);

      const tokenResponse: PasswordResetTokenResponseDto = {
        id: token.id,
        userId: token.userId,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        isUsed: token.isUsed,
        isValid: token.isValid(),
      };

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
        data: tokenResponse,
      });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const validationErrors = this.validateResetPassword(req.body);
      if (validationErrors.length > 0) {
        res.status(400).json({ error: 'Validation failed', details: validationErrors });
        return;
      }

      const { token, newPassword } = req.body;
      const resetDto: ResetPasswordDto = {
        token: token.trim(),
        newPassword,
      };

      const updatedUser = await this.resetPasswordUseCase.execute(resetDto);

      const userResponse = {
        id: updatedUser.id,
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        isActive: updatedUser.isActive,
      };

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        data: userResponse,
      });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private validateRequestPasswordReset(body: Partial<CreatePasswordResetTokenDto>): string[] {
    const errors: string[] = [];

    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      errors.push('Valid email is required');
    }

    return errors;
  }

  private validateResetPassword(body: Partial<ResetPasswordDto>): string[] {
    const errors: string[] = [];

    if (!body.token || typeof body.token !== 'string' || body.token.trim().length === 0) {
      errors.push('Reset token is required');
    }

    if (!body.newPassword || typeof body.newPassword !== 'string' || body.newPassword.length < 6) {
      errors.push('New password is required and must be at least 6 characters');
    }

    return errors;
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Not Found', message: error.message });
      } else if (error.message.includes('Invalid') || error.message.includes('expired')) {
        res.status(400).json({ error: 'Bad Request', message: error.message });
      } else if (error.message.includes('Too many')) {
        res.status(429).json({ error: 'Too Many Requests', message: error.message });
      } else {
        res.status(400).json({ error: 'Bad Request', message: error.message });
      }
    } else {
      res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
    }
  }
}
