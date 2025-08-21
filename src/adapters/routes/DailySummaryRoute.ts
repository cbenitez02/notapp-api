import { Router } from 'express';
import { CreateDailySummaryUseCase } from '../../core/usecases/daily_summaries/CreateDailySummaryUseCase';
import { DeleteDailySummaryUseCase } from '../../core/usecases/daily_summaries/DeleteDailySummaryUseCase';
import { GetDailySummariesByFiltersUseCase } from '../../core/usecases/daily_summaries/GetDailySummariesByFiltersUseCase';
import { GetDailySummariesByUserIdUseCase } from '../../core/usecases/daily_summaries/GetDailySummariesByUserIdUseCase';
import { GetDailySummaryByIdUseCase } from '../../core/usecases/daily_summaries/GetDailySummaryByIdUseCase';
import { GetDailySummaryByUserAndDateUseCase } from '../../core/usecases/daily_summaries/GetDailySummaryByUserAndDateUseCase';
import { UpdateDailySummaryUseCase } from '../../core/usecases/daily_summaries/UpdateDailySummaryUseCase';
import { DailySummaryController } from '../controllers/DailySummaryController';
import { AppDataSource } from '../database/ormconfig';
import { DailySummary } from '../persistence/entities/DailySummaryEntity';
import { DailySummaryRepositoryImpl } from '../persistence/repositories/DailySummaryRepositoryImpl';

const router = Router();

// Repositories
const dailySummaryRepository = new DailySummaryRepositoryImpl(AppDataSource.getRepository(DailySummary));

// Use Cases
const createDailySummaryUseCase = new CreateDailySummaryUseCase(dailySummaryRepository);
const getDailySummaryByIdUseCase = new GetDailySummaryByIdUseCase(dailySummaryRepository);
const getDailySummaryByUserAndDateUseCase = new GetDailySummaryByUserAndDateUseCase(dailySummaryRepository);
const getDailySummariesByUserIdUseCase = new GetDailySummariesByUserIdUseCase(dailySummaryRepository);
const getDailySummariesByFiltersUseCase = new GetDailySummariesByFiltersUseCase(dailySummaryRepository);
const updateDailySummaryUseCase = new UpdateDailySummaryUseCase(dailySummaryRepository);
const deleteDailySummaryUseCase = new DeleteDailySummaryUseCase(dailySummaryRepository);

// Controllers
const dailySummaryController = new DailySummaryController(
  createDailySummaryUseCase,
  getDailySummaryByIdUseCase,
  getDailySummaryByUserAndDateUseCase,
  getDailySummariesByUserIdUseCase,
  getDailySummariesByFiltersUseCase,
  updateDailySummaryUseCase,
  deleteDailySummaryUseCase,
);

// Routes
router.post('/', (req, res) => dailySummaryController.create(req, res));
router.get('/:id', (req, res) => dailySummaryController.getById(req, res));
router.get('/user/:userId/date/:date', (req, res) => dailySummaryController.getByUserAndDate(req, res));
router.get('/user/:userId', (req, res) => dailySummaryController.getByUserId(req, res));
router.get('/', (req, res) => dailySummaryController.getByFilters(req, res));
router.put('/:id', (req, res) => dailySummaryController.update(req, res));
router.delete('/:id', (req, res) => dailySummaryController.delete(req, res));

export { router };
