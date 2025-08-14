import { Request, Response } from 'express';
import { CreateEmailVerificationTokenDto, EmailVerificationTokenResponseDto } from '../../core/interfaces/emailVerificationToken.interface';
import { CreateEmailVerificationTokenUseCase } from '../../core/usecases/email_verification_token/CreateEmailVerificationTokenUseCase';
import { ResendEmailVerificationUseCase } from '../../core/usecases/email_verification_token/ResendEmailVerificationUseCase';
import { VerifyEmailTokenUseCase } from '../../core/usecases/email_verification_token/VerifyEmailTokenUseCase';

export class EmailVerificationController {
  constructor(
    private readonly createTokenUseCase: CreateEmailVerificationTokenUseCase,
    private readonly verifyTokenUseCase: VerifyEmailTokenUseCase,
    private readonly resendTokenUseCase: ResendEmailVerificationUseCase,
  ) {}

  public async createToken(req: Request, res: Response): Promise<void> {
    try {
      const validationErrors = this.validateCreateTokenRequest(req.body);
      if (validationErrors.length > 0) {
        res.status(400).json({ error: 'Validation failed', details: validationErrors });
        return;
      }

      const { userId, expiresInMinutes } = req.body;
      const tokenDto: CreateEmailVerificationTokenDto = {
        userId: userId.trim(),
        expiresInMinutes: expiresInMinutes || 1440, // 24 hours default
      };

      const token = await this.createTokenUseCase.execute(tokenDto);

      const tokenResponse: EmailVerificationTokenResponseDto = {
        id: token.id,
        userId: token.userId,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        isUsed: token.isUsed,
        isValid: token.isValid(),
      };

      res.status(201).json({ success: true, data: tokenResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        res.status(400).json({ error: 'Verification token is required' });
        return;
      }

      const user = await this.verifyTokenUseCase.execute(token.trim());

      const userResponse = {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      };

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: userResponse,
      });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId || userId.trim().length === 0) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const token = await this.resendTokenUseCase.execute(userId);

      const tokenResponse: EmailVerificationTokenResponseDto = {
        id: token.id,
        userId: token.userId,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        isUsed: token.isUsed,
        isValid: token.isValid(),
      };

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
        data: tokenResponse,
      });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private validateCreateTokenRequest(body: any): string[] {
    const errors: string[] = [];

    if (!body.userId || typeof body.userId !== 'string' || body.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (body.expiresInMinutes && (typeof body.expiresInMinutes !== 'number' || body.expiresInMinutes < 1)) {
      errors.push('Expiration time must be a positive number');
    }

    return errors;
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Not Found', message: error.message });
      } else if (error.message.includes('already')) {
        res.status(409).json({ error: 'Conflict', message: error.message });
      } else if (error.message.includes('Invalid') || error.message.includes('required')) {
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
