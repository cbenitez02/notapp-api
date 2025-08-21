import { Category } from '../entities/Category';
import { CategoryFilters } from '../interfaces/category.interface';

export interface ICategoryRepository {
  save(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findByFilters(filters: CategoryFilters): Promise<Category[]>;
  update(id: string, category: Partial<Category>): Promise<Category | null>;
  delete(id: string): Promise<boolean>;
  existsById(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}
