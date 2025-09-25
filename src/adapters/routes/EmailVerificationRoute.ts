import { Request, Response, Router } from 'express';
import { CreateEmailVerificationTokenUseCase } from '../../core/usecases/email_verification_token/CreateEmailVerificationTokenUseCase';
import { ResendEmailVerificationUseCase } from '../../core/usecases/email_verification_token/ResendEmailVerificationUseCase';
import { VerifyEmailTokenUseCase } from '../../core/usecases/email_verification_token/VerifyEmailTokenUseCase';
import { AuthMiddleware } from '../../middlewares/Auth.middleware';
import { addEmailSecurityHeaders, blockSuspiciousDomains, checkDailyEmailQuota } from '../../middlewares/EmailQuota.middleware';
import {
  emailResendRateLimit,
  emailSendRateLimit,
  logEmailActivity,
  sanitizeEmailContent,
  validateEmailInput,
} from '../../middlewares/EmailSecurity.middleware';
import { generalRateLimit } from '../../middlewares/RateLimit.middleware';
import { EmailVerificationController } from '../controllers/EmailVerificationController';
import { AppDataSource } from '../database/ormconfig';
import { EmailVerificationTokenEntity } from '../persistence/entities/EmailVerificationTokenEntity';
import { UserEntity } from '../persistence/entities/UserEntity';
import { EmailVerificationTokenRepositoryImpl } from '../persistence/repositories/EmailVerificationTokenRepositoryImpl';
import { UserRepositoryImpl } from '../persistence/repositories/UserRepositoryImpl';
import { SendGridEmailService } from '../services/SendGridEmailService';

const router = Router();

// Email Service
const emailService = new SendGridEmailService({
  apiKey: process.env.SENDGRID_API_KEY!,
  fromEmail: process.env.SENDGRID_FROM_EMAIL!,
  fromName: process.env.SENDGRID_FROM_NAME || 'TickGuard',
});

// Repositories
const tokenRepository = new EmailVerificationTokenRepositoryImpl(AppDataSource.getRepository(EmailVerificationTokenEntity));
const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));

// Use Cases
const createTokenUseCase = new CreateEmailVerificationTokenUseCase(tokenRepository, userRepository, emailService);
const verifyTokenUseCase = new VerifyEmailTokenUseCase(tokenRepository, userRepository);
const resendTokenUseCase = new ResendEmailVerificationUseCase(tokenRepository, userRepository, createTokenUseCase);

// Controller
const emailVerificationController = new EmailVerificationController(createTokenUseCase, verifyTokenUseCase, resendTokenUseCase);

// Routes
router.post(
  '/create',
  addEmailSecurityHeaders,
  emailSendRateLimit,
  blockSuspiciousDomains,
  validateEmailInput,
  sanitizeEmailContent,
  checkDailyEmailQuota(10), // Límite de 10 tokens de verificación por día
  logEmailActivity,
  (req: Request, res: Response) => emailVerificationController.createToken(req, res),
);
router.post('/verify', generalRateLimit, validateEmailInput, sanitizeEmailContent, logEmailActivity, (req: Request, res: Response) =>
  emailVerificationController.verifyEmail(req, res),
);
router.post(
  '/resend/:userId',
  addEmailSecurityHeaders,
  AuthMiddleware.authenticate,
  emailResendRateLimit,
  blockSuspiciousDomains,
  checkDailyEmailQuota(5), // Límite de 5 reenvíos por día
  logEmailActivity,
  (req: Request, res: Response) => emailVerificationController.resendVerification(req, res),
);

export { router };
