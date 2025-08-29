import { Request, Response } from 'express';
import { AuthRequest, LoginDto, RefreshTokenDto } from '../../core/interfaces/auth.interface';
import { LoginUseCase } from '../../core/usecases/auth/LoginUseCase';
import { LogoutUseCase } from '../../core/usecases/auth/LogoutUseCase';
import { RefreshTokenUseCase } from '../../core/usecases/auth/RefreshTokenUseCase';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const validationErrors = this.validateLoginRequest(req.body);
      if (validationErrors.length > 0) {
        res.status(400).json({ error: 'Validation failed', details: validationErrors });
        return;
      }

      const { email, password } = req.body;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent') || 'Unknown';

      const loginDto: LoginDto = {
        email: email.trim(),
        password,
        ipAddress,
        userAgent,
      };

      const loginResponse = await this.loginUseCase.execute(loginDto);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', loginResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        data: {
          user: loginResponse.user,
          accessToken: loginResponse.accessToken,
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token is required' });
        return;
      }

      const ipAddress = this.getClientIp(req);
      const userAgent = req.get('User-Agent') || 'Unknown';

      const refreshDto: RefreshTokenDto = {
        refreshToken,
        ipAddress,
        userAgent,
      };

      const tokens = await this.refreshTokenUseCase.execute(refreshDto);

      // Update refresh token cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await this.logoutUseCase.execute(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async logoutAllSessions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await this.logoutUseCase.logoutAllSessions(req.user.userId);

      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'All sessions logged out successfully',
      });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async profile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private validateLoginRequest(body: Partial<LoginDto>): string[] {
    const errors: string[] = [];

    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
      errors.push('Password is required and must be at least 6 characters');
    }

    return errors;
  }

  private getClientIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'Unknown';
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
      } else if (error.message.includes('not found')) {
        res.status(404).json({ error: 'Not Found', message: error.message });
      } else if (error.message.includes('verify your email')) {
        res.status(403).json({ error: 'Email Verification Required', message: error.message });
      } else if (error.message.includes('deactivated')) {
        res.status(403).json({ error: 'Account Deactivated', message: error.message });
      } else {
        res.status(400).json({ error: 'Bad Request', message: error.message });
      }
    } else {
      res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
    }
  }
}
