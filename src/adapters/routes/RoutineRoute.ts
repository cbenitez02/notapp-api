import { Router } from 'express';
import { CreateRoutineWithTemplatesUseCase } from '../../core/usecases/routines/CreateRoutineWithTemplatesUseCase';
import { DeleteRoutineUseCase } from '../../core/usecases/routines/DeleteRoutineUseCase';
import { GetRoutineByIdUseCase } from '../../core/usecases/routines/GetRoutineByIdUseCase';
import { GetRoutinesByUserIdUseCase } from '../../core/usecases/routines/GetRoutinesByUserIdUseCase';
import { UpdateRoutineUseCase } from '../../core/usecases/routines/UpdateRoutineUseCase';
import { AuthMiddleware } from '../../middlewares/Auth.middleware';
import { RoutineController } from '../controllers/RoutineController';
import { RoutineStatsController } from '../controllers/RoutineStatsController';
import { AppDataSource } from '../database/ormconfig';
import { DailySummary } from '../persistence/entities/DailySummaryEntity';
import { RoutineEntity } from '../persistence/entities/RoutineEntity';
import { DailySummaryRepositoryImpl } from '../persistence/repositories/DailySummaryRepositoryImpl';
import { RoutineRepositoryImpl } from '../persistence/repositories/RoutineRepositoryImpl';
import { RoutineTaskRepositoryImpl } from '../persistence/repositories/RoutineTaskRepositoryImpl';

const router = Router();

// Repositories
const routineRepository = new RoutineRepositoryImpl(AppDataSource.getRepository(RoutineEntity));
const routineTaskRepository = new RoutineTaskRepositoryImpl(AppDataSource);
const dailySummaryRepository = new DailySummaryRepositoryImpl(AppDataSource.getRepository(DailySummary));

// Use Cases
const createRoutineUseCase = new CreateRoutineWithTemplatesUseCase(routineRepository, routineTaskRepository);
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
const routineStatsController = new RoutineStatsController();

// Routes
router.post('/', AuthMiddleware.authenticate, (req, res) => routineController.create(req, res));
router.get('/user/my-routines', AuthMiddleware.authenticate, (req, res) => routineController.getMyRoutines(req, res));
router.get('/stats', AuthMiddleware.authenticate, (req, res) => routineStatsController.getUserStats(req, res));
router.get('/:id', AuthMiddleware.authenticate, (req, res) => routineController.getById(req, res));
router.put('/:id', AuthMiddleware.authenticate, (req, res) => routineController.update(req, res));
router.delete('/:id', AuthMiddleware.authenticate, (req, res) => routineController.delete(req, res));
export { router };
