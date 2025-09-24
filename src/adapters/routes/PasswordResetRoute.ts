import { Router } from 'express';
import { CreatePasswordResetTokenUseCase } from '../../core/usecases/password_reset/CreatePasswordResetTokenUseCase';
import { ResetPasswordUseCase } from '../../core/usecases/password_reset/ResetPasswordUseCase';
import { passwordResetRateLimit } from '../../middlewares/RateLimit.middleware';
import { PasswordResetController } from '../controllers/PasswordResetController';
import { AppDataSource } from '../database/ormconfig';
import { PasswordResetTokenEntity } from '../persistence/entities/PasswordResetTokenEntity';
import { UserEntity } from '../persistence/entities/UserEntity';
import { PasswordResetTokenRepositoryImpl } from '../persistence/repositories/PasswordResetTokenRepositoryImpl';
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
const passwordResetTokenRepository = new PasswordResetTokenRepositoryImpl(AppDataSource.getRepository(PasswordResetTokenEntity));
const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));

// Use Cases
const createTokenUseCase = new CreatePasswordResetTokenUseCase(passwordResetTokenRepository, userRepository, emailService);
const resetPasswordUseCase = new ResetPasswordUseCase(passwordResetTokenRepository, userRepository);

// Controller
const passwordResetController = new PasswordResetController(createTokenUseCase, resetPasswordUseCase);

// Routes
router.post('/request', passwordResetRateLimit, (req, res) => passwordResetController.requestPasswordReset(req, res));
router.post('/reset', passwordResetRateLimit, (req, res) => passwordResetController.resetPassword(req, res));

export { router };
