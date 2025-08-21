import { Router } from 'express';
import { CreateRoutineUseCase } from '../../core/usecases/routines/CreateRoutineUseCase';
import { DeleteRoutineUseCase } from '../../core/usecases/routines/DeleteRoutineUseCase';
import { GetRoutineByIdUseCase } from '../../core/usecases/routines/GetRoutineByIdUseCase';
import { GetRoutinesByUserIdUseCase } from '../../core/usecases/routines/GetRoutinesByUserIdUseCase';
import { UpdateRoutineUseCase } from '../../core/usecases/routines/UpdateRoutineUseCase';
import { RoutineController } from '../controllers/RoutineController';
import { AppDataSource } from '../database/ormconfig';
import { CategoryEntity } from '../persistence/entities/CategoryEntity';
import { RoutineEntity } from '../persistence/entities/RoutineEntity';
import { RoutineTaskEntity } from '../persistence/entities/RoutineTaskEntity';
import { CategoryRepositoryImpl } from '../persistence/repositories/CategoryRepositoryImpl';
import { RoutineRepositoryImpl } from '../persistence/repositories/RoutineRepositoryImpl';
import { RoutineTaskRepositoryImpl } from '../persistence/repositories/RoutineTaskRepositoryImpl';

const router = Router();

// Repositories
const routineRepository = new RoutineRepositoryImpl(AppDataSource.getRepository(RoutineEntity));
const categoryRepository = new CategoryRepositoryImpl(AppDataSource.getRepository(CategoryEntity));
const routineTaskRepository = new RoutineTaskRepositoryImpl(AppDataSource.getRepository(RoutineTaskEntity));

// Use Cases
const createRoutineUseCase = new CreateRoutineUseCase(routineRepository, categoryRepository, routineTaskRepository);
const getRoutineByIdUseCase = new GetRoutineByIdUseCase(routineRepository);
const getRoutinesByUserIdUseCase = new GetRoutinesByUserIdUseCase(routineRepository);
const updateRoutineUseCase = new UpdateRoutineUseCase(routineRepository);
const deleteRoutineUseCase = new DeleteRoutineUseCase(routineRepository);

// Controllers
const routineController = new RoutineController(
  createRoutineUseCase,
  getRoutineByIdUseCase,
  getRoutinesByUserIdUseCase,
  updateRoutineUseCase,
  deleteRoutineUseCase,
);

// Routes
router.post('/', (req, res) => routineController.create(req, res));
router.get('/:id', (req, res) => routineController.getById(req, res));
router.get('/user/:userId', (req, res) => routineController.getByUserId(req, res));
router.put('/:id', (req, res) => routineController.update(req, res));
router.delete('/:id', (req, res) => routineController.delete(req, res));

export { router };
