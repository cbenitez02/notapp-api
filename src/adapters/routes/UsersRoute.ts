import { Router } from 'express';
import { CreateUserUseCase } from '../../core/usecases/users/CreateUserUseCase';
import { DeleteUserUseCase } from '../../core/usecases/users/DeleteUserUseCase';
import { GetUserByIdUseCase } from '../../core/usecases/users/GetUserByIdUseCase';
import { UserController } from '../controllers/UserController';
import { AppDataSource } from '../database/ormconfig';
import { UserEntity } from '../persistence/entities/UserEntity';
import { UserRepositoryImpl } from '../persistence/repositories/UserRepositoryImpl';

const router = Router();

// Repositories
const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));

// Use Cases
const createUserUseCase = new CreateUserUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);

// Controllers
const userController = new UserController(createUserUseCase, deleteUserUseCase, getUserByIdUseCase);

// Routes
router.post('/', (req, res) => userController.create(req, res));
router.get('/:id', (req, res) => userController.getById(req, res));
router.delete('/:id', (req, res) => userController.delete(req, res));

export { router };
