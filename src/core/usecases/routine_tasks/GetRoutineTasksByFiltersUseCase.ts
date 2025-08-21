import { IRoutineTaskRepository } from '@core/repositories/IRoutineTaskRepository';
import { RoutineTask } from '../../entities/RoutineTask';
import { RoutineTaskFilters } from '../../interfaces/routine.interface';

export class GetRoutineTasksByFiltersUseCase {
  constructor(private readonly routineTaskRepository: IRoutineTaskRepository) {}

  async execute(filters: RoutineTaskFilters): Promise<RoutineTask[]> {
    // Validar filtros
    this.validateFilters(filters);

    return await this.routineTaskRepository.findByFilters(filters);
  }

  private validateFilters(filters: RoutineTaskFilters): void {
    if (filters.dateFrom && !this.isValidDate(filters.dateFrom)) {
      throw new Error('Invalid dateFrom format. Use YYYY-MM-DD format');
    }

    if (filters.dateTo && !this.isValidDate(filters.dateTo)) {
      throw new Error('Invalid dateTo format. Use YYYY-MM-DD format');
    }

    if (filters.dateLocal && !this.isValidDate(filters.dateLocal)) {
      throw new Error('Invalid dateLocal format. Use YYYY-MM-DD format');
    }

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      throw new Error('dateFrom cannot be after dateTo');
    }
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }
}
