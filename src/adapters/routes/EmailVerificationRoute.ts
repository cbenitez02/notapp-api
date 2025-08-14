import { Router } from 'express';
import { CreateEmailVerificationTokenUseCase } from '../../core/usecases/email_verification_token/CreateEmailVerificationTokenUseCase';
import { ResendEmailVerificationUseCase } from '../../core/usecases/email_verification_token/ResendEmailVerificationUseCase';
import { VerifyEmailTokenUseCase } from '../../core/usecases/email_verification_token/VerifyEmailTokenUseCase';
import { EmailVerificationController } from '../controllers/EmailVerificationController';
import { AppDataSource } from '../database/ormconfig';
import { EmailVerificationTokenEntity } from '../persistence/entities/EmailVerificationTokenEntity';
import { UserEntity } from '../persistence/entities/UserEntity';
import { EmailVerificationTokenRepositoryImpl } from '../persistence/repositories/EmailVerificationTokenRepositoryImpl';
import { UserRepositoryImpl } from '../persistence/repositories/UserRepositoryImpl';

const router = Router();

// Repositories
const tokenRepository = new EmailVerificationTokenRepositoryImpl(AppDataSource.getRepository(EmailVerificationTokenEntity));
const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));

// Use Cases
const createTokenUseCase = new CreateEmailVerificationTokenUseCase(tokenRepository, userRepository);
const verifyTokenUseCase = new VerifyEmailTokenUseCase(tokenRepository, userRepository);
const resendTokenUseCase = new ResendEmailVerificationUseCase(tokenRepository, userRepository, createTokenUseCase);

// Controller
const emailVerificationController = new EmailVerificationController(createTokenUseCase, verifyTokenUseCase, resendTokenUseCase);

// Routes
router.post('/create', (req, res) => emailVerificationController.createToken(req, res));
router.post('/verify', (req, res) => emailVerificationController.verifyEmail(req, res));
router.post('/resend/:userId', (req, res) => emailVerificationController.resendVerification(req, res));

export { router };
