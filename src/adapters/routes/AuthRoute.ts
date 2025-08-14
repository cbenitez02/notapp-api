import { Router } from 'express';
import { LoginUseCase } from '../../core/usecases/auth/LoginUseCase';
import { LogoutUseCase } from '../../core/usecases/auth/LogoutUseCase';
import { RefreshTokenUseCase } from '../../core/usecases/auth/RefreshTokenUseCase';
import { AuthMiddleware } from '../../middlewares/Auth.middleware';
import { AuthController } from '../controllers/AuthController';
import { AppDataSource } from '../database/ormconfig';
import { UserEntity } from '../persistence/entities/UserEntity';
import { UserSessionEntity } from '../persistence/entities/UserSessionEntity';
import { UserRepositoryImpl } from '../persistence/repositories/UserRepositoryImpl';
import { UserSessionRepositoryImpl } from '../persistence/repositories/UserSessionRepositoryImpl';

const router = Router();

// Repositories
const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));
const sessionRepository = new UserSessionRepositoryImpl(AppDataSource.getRepository(UserSessionEntity));

// Use Cases
const loginUseCase = new LoginUseCase(userRepository, sessionRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, sessionRepository);
const logoutUseCase = new LogoutUseCase(sessionRepository);

// Controller
const authController = new AuthController(loginUseCase, logoutUseCase, refreshTokenUseCase);

// Routes
router.post('/login', (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/logout-all', AuthMiddleware.authenticate, (req, res) => authController.logoutAllSessions(req, res));
router.get('/profile', AuthMiddleware.authenticate, (req, res) => authController.profile(req, res));

export { router };
