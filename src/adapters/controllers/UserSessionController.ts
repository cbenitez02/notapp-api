import { Request, Response } from 'express';
import { CreateUserSessionDto, UserSessionResponseDto } from '../../core/interfaces/user.interface';
import { CreateUserSessionUseCase } from '../../core/usecases/users_session/CreateUserSessionUseCase';
import { RefreshUserSessionUseCase } from '../../core/usecases/users_session/RefreshUserSessionUseCase';
import { RevokeUserSessionUseCase } from '../../core/usecases/users_session/RevokeUserSessionUseCase';

export class UserSessionController {
  constructor(
    private readonly createUserSessionUseCase: CreateUserSessionUseCase,
    private readonly refreshUserSessionUseCase: RefreshUserSessionUseCase,
    private readonly revokeUserSessionUseCase: RevokeUserSessionUseCase,
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const validationErrors = this.validateCreateSessionRequest(req.body);
      if (validationErrors.length > 0) {
        res.status(400).json({ error: 'Validation failed', details: validationErrors });
        return;
      }

      const { userId, refreshToken, expiresAt } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent') || 'Unknown';

      const sessionDto: CreateUserSessionDto = {
        userId: userId.trim(),
        refreshToken: refreshToken.trim(),
        ipAddress,
        userAgent,
        expiresAt: new Date(expiresAt),
      };

      const session = await this.createUserSessionUseCase.execute(sessionDto);

      const sessionResponse: UserSessionResponseDto = {
        id: session.id,
        userId: session.userId,
        ipAddress: session.ipAddress ?? 'Unknown',
        userAgent: session.userAgent ?? 'Unknown',
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isActive: session.isActive,
      };

      res.status(201).json({ success: true, data: sessionResponse });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken, newRefreshToken, expiresAt } = req.body;

      if (!refreshToken || !newRefreshToken || !expiresAt) {
        res.status(400).json({ error: 'Refresh token, new refresh token, and expiration date are required' });
        return;
      }

      const session = await this.refreshUserSessionUseCase.execute(refreshToken, newRefreshToken, new Date(expiresAt));

      const sessionResponse: UserSessionResponseDto = {
        id: session.id,
        userId: session.userId,
        ipAddress: session.ipAddress ?? 'Unknown',
        userAgent: session.userAgent ?? 'Unknown',
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isActive: session.isActive,
      };
      res.status(200).json({ success: true, data: sessionResponse });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  public async revoke(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
      }

      await this.revokeUserSessionUseCase.execute(sessionId);
      res.status(200).json({ success: true, message: 'Session revoked successfully' });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async revokeAllUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      await this.revokeUserSessionUseCase.executeByUserId(userId);
      res.status(200).json({ success: true, message: 'All user sessions revoked successfully' });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private validateCreateSessionRequest(body: { userId?: string; refreshToken?: string; expiresAt?: string }): string[] {
    const errors: string[] = [];

    if (!body.userId || typeof body.userId !== 'string' || body.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!body.refreshToken || typeof body.refreshToken !== 'string' || body.refreshToken.trim().length === 0) {
      errors.push('Refresh token is required');
    }

    if (!body.expiresAt || isNaN(Date.parse(body.expiresAt))) {
      errors.push('Valid expiration date is required');
    } else {
      const expirationDate = new Date(body.expiresAt);
      if (expirationDate <= new Date()) {
        errors.push('Expiration date must be in the future');
      }
    }

    return errors;
  }

  private getClientIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || 'Unknown';
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Not Found', message: error.message });
      } else if (error.message.includes('Invalid') || error.message.includes('required')) {
        res.status(400).json({ error: 'Bad Request', message: error.message });
      } else {
        res.status(400).json({ error: 'Bad Request', message: error.message });
      }
    } else {
      res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
    }
  }
}
