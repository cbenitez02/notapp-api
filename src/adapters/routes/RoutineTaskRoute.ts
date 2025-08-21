import { Router } from 'express';
import { CreateRoutineTaskUseCase } from '../../core/usecases/routine_tasks/CreateRoutineTaskUseCase';
import { DeleteRoutineTaskUseCase } from '../../core/usecases/routine_tasks/DeleteRoutineTaskUseCase';
import { GetRoutineTaskByIdUseCase } from '../../core/usecases/routine_tasks/GetRoutineTaskByIdUseCase';
import { GetRoutineTasksByFiltersUseCase } from '../../core/usecases/routine_tasks/GetRoutineTasksByFiltersUseCase';
import { GetRoutineTasksByUserIdUseCase } from '../../core/usecases/routine_tasks/GetRoutineTasksByUserIdUseCase';
import { UpdateRoutineTaskUseCase } from '../../core/usecases/routine_tasks/UpdateRoutineTaskUseCase';
import { RoutineTaskController } from '../controllers/RoutineTaskController';
import { AppDataSource } from '../database/ormconfig';
import { RoutineEntity } from '../persistence/entities/RoutineEntity';
import { RoutineTaskEntity } from '../persistence/entities/RoutineTaskEntity';
import { RoutineRepositoryImpl } from '../persistence/repositories/RoutineRepositoryImpl';
import { RoutineTaskRepositoryImpl } from '../persistence/repositories/RoutineTaskRepositoryImpl';

const router = Router();

// Repositories
const routineTaskRepository = new RoutineTaskRepositoryImpl(AppDataSource.getRepository(RoutineTaskEntity));
const routineRepository = new RoutineRepositoryImpl(AppDataSource.getRepository(RoutineEntity));

// Use Cases
const createRoutineTaskUseCase = new CreateRoutineTaskUseCase(routineTaskRepository, routineRepository);
const getRoutineTaskByIdUseCase = new GetRoutineTaskByIdUseCase(routineTaskRepository);
const getRoutineTasksByUserIdUseCase = new GetRoutineTasksByUserIdUseCase(routineTaskRepository);
const getRoutineTasksByFiltersUseCase = new GetRoutineTasksByFiltersUseCase(routineTaskRepository);
const updateRoutineTaskUseCase = new UpdateRoutineTaskUseCase(routineTaskRepository);
const deleteRoutineTaskUseCase = new DeleteRoutineTaskUseCase(routineTaskRepository);

// Controllers
const routineTaskController = new RoutineTaskController(
  createRoutineTaskUseCase,
  getRoutineTaskByIdUseCase,
  getRoutineTasksByUserIdUseCase,
  getRoutineTasksByFiltersUseCase,
  updateRoutineTaskUseCase,
  deleteRoutineTaskUseCase,
);

// Routes
router.post('/', (req, res) => routineTaskController.create(req, res));
router.get('/search', (req, res) => routineTaskController.getByFilters(req, res));
router.get('/:id', (req, res) => routineTaskController.getById(req, res));
router.get('/user/:userId', (req, res) => routineTaskController.getByUserId(req, res));
router.put('/:id', (req, res) => routineTaskController.update(req, res));
router.delete('/:id', (req, res) => routineTaskController.delete(req, res));

export { router };
