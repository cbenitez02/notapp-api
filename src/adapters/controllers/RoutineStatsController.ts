import { Response } from 'express';
import { AuthRequest } from '../../core/interfaces/auth.interface';
import { GetUserRoutineStatsUseCase } from '../../core/usecases/routines/GetRoutineStatsUseCase';
import { TaskStatusService } from '../../core/usecases/routines/TaskStatusService';
import { AppDataSource } from '../database/ormconfig';
import { RoutineEntity } from '../persistence/entities/RoutineEntity';
import { UserEntity } from '../persistence/entities/UserEntity';
import { RoutineRepositoryImpl } from '../persistence/repositories/RoutineRepositoryImpl';
import { RoutineStatsRepositoryImpl } from '../persistence/repositories/RoutineStatsRepositoryImpl';
import { RoutineTaskProgressRepositoryImpl } from '../persistence/repositories/RoutineTaskProgressRepositoryImpl';
import { RoutineTaskRepositoryImpl } from '../persistence/repositories/RoutineTaskRepositoryImpl';
import { UserRepositoryImpl } from '../persistence/repositories/UserRepositoryImpl';

export class RoutineStatsController {
  private readonly getUserRoutineStatsUseCase: GetUserRoutineStatsUseCase;
  private readonly taskStatusService: TaskStatusService;

  constructor() {
    const routineStatsRepository = new RoutineStatsRepositoryImpl();
    this.getUserRoutineStatsUseCase = new GetUserRoutineStatsUseCase(routineStatsRepository);

    // Inicializar TaskStatusService
    const routineRepository = new RoutineRepositoryImpl(AppDataSource.getRepository(RoutineEntity));
    const routineTaskRepository = new RoutineTaskRepositoryImpl(AppDataSource);
    const routineTaskProgressRepository = new RoutineTaskProgressRepositoryImpl(AppDataSource);
    const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));

    this.taskStatusService = new TaskStatusService(routineRepository, routineTaskRepository, routineTaskProgressRepository, userRepository);
  }

  async getUserStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Actualizar las tareas del día antes de calcular las estadísticas
      await this.taskStatusService.updateDailyTaskStatuses(userId);

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
