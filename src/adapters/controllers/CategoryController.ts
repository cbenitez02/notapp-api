import { Request, Response } from 'express';
import { CategoryResponseDto } from '../../core/interfaces/category.interface';
import { GetAllCategoriesUseCase } from '../../core/usecases/categories/GetAllCategoriesUseCase';

export class CategoryController {
  constructor(private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase) {}

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.getAllCategoriesUseCase.execute();

      const categoriesResponse: CategoryResponseDto[] = categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        active: category.active,
        sortOrder: category.sortOrder,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }));

      res.status(200).json({ success: true, data: categoriesResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      console.error('CategoryController Error:', error.message);
      res.status(400).json({ success: false, message: error.message });
    } else {
      console.error('CategoryController Unknown Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
