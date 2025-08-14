import { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../core/interfaces/auth.interface';

export class AuthMiddleware {
  static authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access token is required' });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;

      if (decoded.type !== 'access') {
        res.status(401).json({ error: 'Invalid token type' });
        return;
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        emailVerified: decoded.emailVerified,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expired' });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
      } else {
        res.status(500).json({ error: 'Authentication error' });
      }
    }
  }

  static authorize(roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      next();
    };
  }

  static optional(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        next(); // Continue without authentication
        return;
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;

      if (decoded.type === 'access') {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          emailVerified: decoded.emailVerified,
        };
      }

      next();
    } catch (error) {
      // Log authentication errors in optional middleware
      console.error('Optional auth error:', error);
      next();
    }
  }
}
