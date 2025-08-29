import { Response } from 'express';
import { AuthRequest } from '../../core/interfaces/auth.interface';
import { GetUserRoutineStatsUseCase } from '../../core/usecases/routines/GetRoutineStatsUseCase';
import { RoutineStatsRepositoryImpl } from '../persistence/repositories/RoutineStatsRepositoryImpl';

export class RoutineStatsController {
  private readonly getUserRoutineStatsUseCase: GetUserRoutineStatsUseCase;

  constructor() {
    const routineStatsRepository = new RoutineStatsRepositoryImpl();
    this.getUserRoutineStatsUseCase = new GetUserRoutineStatsUseCase(routineStatsRepository);
  }

  async getUserStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const stats = await this.getUserRoutineStatsUseCase.execute(userId);

      res.status(200).json(stats);
    } catch (error) {
      console.error('Error getting user routine stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
