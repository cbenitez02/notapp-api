import { Router } from 'express';
import { CreateEmailVerificationTokenUseCase } from '../../core/usecases/email_verification_token/CreateEmailVerificationTokenUseCase';
import { CreateUserUseCase } from '../../core/usecases/users/CreateUserUseCase';
import { DeleteUserUseCase } from '../../core/usecases/users/DeleteUserUseCase';
import { GetUserByIdUseCase } from '../../core/usecases/users/GetUserByIdUseCase';
import { generalRateLimit, registrationRateLimit } from '../../middlewares/RateLimit.middleware';
import { UserController } from '../controllers/UserController';
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
const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));
const emailVerificationTokenRepository = new EmailVerificationTokenRepositoryImpl(AppDataSource.getRepository(EmailVerificationTokenEntity));

// Use Cases
const createEmailVerificationTokenUseCase = new CreateEmailVerificationTokenUseCase(emailVerificationTokenRepository, userRepository, emailService);
const createUserUseCase = new CreateUserUseCase(userRepository, createEmailVerificationTokenUseCase);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);

// Controllers
const userController = new UserController(createUserUseCase, deleteUserUseCase, getUserByIdUseCase);

// Routes
router.post('/', registrationRateLimit, (req, res) => userController.create(req, res));
router.get('/:id', generalRateLimit, (req, res) => userController.getById(req, res));
router.delete('/:id', generalRateLimit, (req, res) => userController.delete(req, res));

export { router };
