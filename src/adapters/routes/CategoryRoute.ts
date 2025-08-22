import { Router } from 'express';
import { GetAllCategoriesUseCase } from '../../core/usecases/categories/GetAllCategoriesUseCase';
import { AuthMiddleware } from '../../middlewares/Auth.middleware';
import { CategoryController } from '../controllers/CategoryController';
import { AppDataSource } from '../database/ormconfig';
import { CategoryEntity } from '../persistence/entities/CategoryEntity';
import { CategoryRepositoryImpl } from '../persistence/repositories/CategoryRepositoryImpl';

const router = Router();

// Repositories
const categoryRepository = new CategoryRepositoryImpl(AppDataSource.getRepository(CategoryEntity));

// Use Cases
const getAllCategoriesUseCase = new GetAllCategoriesUseCase(categoryRepository);

// Controllers
const categoryController = new CategoryController(getAllCategoriesUseCase);

// Routes
router.get('/', AuthMiddleware.authenticate, (req, res) => categoryController.getAll(req, res));

export { router };
