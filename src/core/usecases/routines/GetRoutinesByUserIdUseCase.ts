import { IRoutineRepository } from '@core/repositories/IRoutineRepository';
import { Routine } from '../../entities/Routine';

export class GetRoutinesByUserIdUseCase {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(userId: string): Promise<Routine[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    return await this.routineRepository.findByUserId(userId.trim());
  }
}
