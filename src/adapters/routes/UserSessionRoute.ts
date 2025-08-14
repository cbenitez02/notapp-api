import { Router } from 'express';
import { CreateUserSessionUseCase } from '../../core/usecases/users_session/CreateUserSessionUseCase';
import { RefreshUserSessionUseCase } from '../../core/usecases/users_session/RefreshUserSessionUseCase';
import { RevokeUserSessionUseCase } from '../../core/usecases/users_session/RevokeUserSessionUseCase';
import { UserSessionController } from '../controllers/UserSessionController';
import { AppDataSource } from '../database/ormconfig';
import { UserEntity } from '../persistence/entities/UserEntity';
import { UserSessionEntity } from '../persistence/entities/UserSessionEntity';
import { UserRepositoryImpl } from '../persistence/repositories/UserRepositoryImpl';
import { UserSessionRepositoryImpl } from '../persistence/repositories/UserSessionRepositoryImpl';

const router = Router();

//Repositories
const userSessionRepository = new UserSessionRepositoryImpl(AppDataSource.getRepository(UserSessionEntity));
const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));

// Use Cases
const createUserSessionUseCase = new CreateUserSessionUseCase(userSessionRepository, userRepository);
const refreshUserSessionUseCase = new RefreshUserSessionUseCase(userSessionRepository);
const revokeUserSessionUseCase = new RevokeUserSessionUseCase(userSessionRepository);

// Controller
const userSessionController = new UserSessionController(createUserSessionUseCase, refreshUserSessionUseCase, revokeUserSessionUseCase);

// Routes
router.post('/', (req, res) => userSessionController.create(req, res));
router.put('/refresh', (req, res) => userSessionController.refresh(req, res));
router.delete('/:sessionId', (req, res) => userSessionController.revoke(req, res));
router.delete('/user/:userId/all', (req, res) => userSessionController.revokeAllUserSessions(req, res));

export { router };
