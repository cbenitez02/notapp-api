import { TaskSchedulerService } from '../../core/usecases/routines/TaskSchedulerService';
import { TaskStatusService } from '../../core/usecases/routines/TaskStatusService';
import { AppDataSource } from '../database/ormconfig';
import { DailySummary } from '../persistence/entities/DailySummaryEntity';
import { RoutineEntity } from '../persistence/entities/RoutineEntity';
import { UserEntity } from '../persistence/entities/UserEntity';
import { DailySummaryRepositoryImpl } from '../persistence/repositories/DailySummaryRepositoryImpl';
import { RoutineRepositoryImpl } from '../persistence/repositories/RoutineRepositoryImpl';
import { RoutineTaskProgressRepositoryImpl } from '../persistence/repositories/RoutineTaskProgressRepositoryImpl';
import { RoutineTaskRepositoryImpl } from '../persistence/repositories/RoutineTaskRepositoryImpl';
import { UserRepositoryImpl } from '../persistence/repositories/UserRepositoryImpl';

let taskSchedulerService: TaskSchedulerService | null = null;

export function initializeTaskScheduler(): TaskSchedulerService {
  if (!taskSchedulerService) {
    // Initialize repositories
    const routineRepository = new RoutineRepositoryImpl(AppDataSource.getRepository(RoutineEntity));
    const routineTaskRepository = new RoutineTaskRepositoryImpl(AppDataSource);
    const routineTaskProgressRepository = new RoutineTaskProgressRepositoryImpl(AppDataSource);
    const userRepository = new UserRepositoryImpl(AppDataSource.getRepository(UserEntity));
    const dailySummaryRepository = new DailySummaryRepositoryImpl(AppDataSource.getRepository(DailySummary));

    // Initialize task status service
    const taskStatusService = new TaskStatusService(
      routineRepository,
      routineTaskRepository,
      routineTaskProgressRepository,
      userRepository,
      dailySummaryRepository,
    );

    // Initialize scheduler service
    taskSchedulerService = new TaskSchedulerService(taskStatusService);

    // Start scheduled tasks
    taskSchedulerService.startScheduledTasks();

    console.log('Task scheduler initialized and started');
  }

  return taskSchedulerService;
}

export function getTaskSchedulerService(): TaskSchedulerService | null {
  return taskSchedulerService;
}
