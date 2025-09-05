import { Router } from 'express';
import { CreateRoutineWithTemplatesUseCase } from '../../core/usecases/routines/CreateRoutineWithTemplatesUseCase';
import { CreateTaskInRoutineUseCase } from '../../core/usecases/routines/CreateTaskInRoutineUseCase';
import { DeleteRoutineUseCase } from '../../core/usecases/routines/DeleteRoutineUseCase';
import { GetRoutineByIdUseCase } from '../../core/usecases/routines/GetRoutineByIdUseCase';
import { GetRoutinesByUserIdUseCase } from '../../core/usecases/routines/GetRoutinesByUserIdUseCase';
import { TaskStatusService } from '../../core/usecases/routines/TaskStatusService';
import { UpdateRoutineUseCase } from '../../core/usecases/routines/UpdateRoutineUseCase';
import { AuthMiddleware } from '../../middlewares/Auth.middleware';
import { RoutineController } from '../controllers/RoutineController';
import { RoutineStatsController } from '../controllers/RoutineStatsController';
import { AppDataSource } from '../database/ormconfig';
import { RoutineEntity } from '../persistence/entities/RoutineEntity';
import { UserEntity } from '../persistence/entities/UserEntity';
import { RoutineRepositoryImpl } from '../persistence/repositories/RoutineRepositoryImpl';
import { RoutineTaskProgressRepositoryImpl } from '../persistence/repositories/RoutineTaskProgressRepositoryImpl';
import { RoutineTaskRepositoryImpl } from '../persistence/repositories/RoutineTaskRepositoryImpl';
import { UserRepositoryImpl } from '../persistence/repositories/UserRepositoryImpl';

const router = Router();

// Repositories
const routineRepository = new RoutineRepositoryImpl(AppDataSource.getRepository(RoutineEntity));
const routineTaskRepository = new RoutineTaskRepositoryImpl(AppDataSource);
const routineTaskProgressRepository = new RoutineTaskProgressRepositoryImpl(AppDataSource);
const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));

// Services
const taskStatusService = new TaskStatusService(routineRepository, routineTaskRepository, routineTaskProgressRepository, userRepository);

// Use Cases
const createRoutineUseCase = new CreateRoutineWithTemplatesUseCase(routineRepository, routineTaskRepository);
const createTaskInRoutineUseCase = new CreateTaskInRoutineUseCase(routineRepository, routineTaskRepository);
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
  routineTaskProgressRepository,
  routineTaskRepository,
  taskStatusService,
  createTaskInRoutineUseCase,
);
const routineStatsController = new RoutineStatsController();

// Routes
router.post('/', AuthMiddleware.authenticate, (req, res) => routineController.create(req, res));
router.get('/user/my-routines', AuthMiddleware.authenticate, (req, res) => routineController.getMyRoutines(req, res));
router.get('/user/selector', AuthMiddleware.authenticate, (req, res) => routineController.getRoutinesForSelector(req, res));
router.get('/tasks-for-day', AuthMiddleware.authenticate, (req, res) => routineController.getTasksForDay(req, res));
router.get('/tasks-for-date', AuthMiddleware.authenticate, (req, res) => routineController.getTasksForDate(req, res));
router.put('/tasks/:id/status', AuthMiddleware.authenticate, (req, res) => routineController.updateTaskStatus(req, res));
router.post('/tasks/update-expired', AuthMiddleware.authenticate, (req, res) => routineController.updateExpiredTasks(req, res));
router.get('/stats', AuthMiddleware.authenticate, (req, res) => routineStatsController.getUserStats(req, res));
router.get('/:id', AuthMiddleware.authenticate, (req, res) => routineController.getById(req, res));
router.put('/:id', AuthMiddleware.authenticate, (req, res) => routineController.update(req, res));
router.delete('/:id', AuthMiddleware.authenticate, (req, res) => routineController.delete(req, res));
router.post('/:id/tasks', AuthMiddleware.authenticate, (req, res) => routineController.createTaskInRoutine(req, res));
export { router };
