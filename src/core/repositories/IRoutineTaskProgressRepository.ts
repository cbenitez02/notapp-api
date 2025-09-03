import { RoutineTaskProgress } from '../entities/RoutineTaskProgress';
import { RoutineTaskStatus } from '../interfaces/routine.interface';

export interface IRoutineTaskProgressRepository {
  create(progress: RoutineTaskProgress): Promise<RoutineTaskProgress>;
  update(progress: RoutineTaskProgress): Promise<RoutineTaskProgress>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<RoutineTaskProgress | null>;
  findByTemplateTaskId(templateTaskId: string): Promise<RoutineTaskProgress[]>;
  findByTemplateTaskIdAndDate(templateTaskId: string, dateLocal: string): Promise<RoutineTaskProgress | null>;
  findByTemplateTaskIdsAndDate(templateTaskIds: string[], dateLocal: string): Promise<RoutineTaskProgress[]>;
  findByUserIdAndDate(userId: string, dateLocal: string): Promise<RoutineTaskProgress[]>;
  findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<RoutineTaskProgress[]>;
  findAll(): Promise<RoutineTaskProgress[]>;

  // Nuevos métodos para gestión automática de estados
  findByTaskAndDate(taskId: string, dateLocal: string): Promise<RoutineTaskProgress | null>;
  findByUserAndDateAndStatuses(userId: string, dateLocal: string, statuses: RoutineTaskStatus[]): Promise<RoutineTaskProgress[]>;
  updateStatus(id: string, status: RoutineTaskStatus): Promise<void>;
  createFromDto(dto: {
    routineTemplateTaskId: string;
    userId: string;
    dateLocal: string;
    status?: RoutineTaskStatus;
    notes?: string;
  }): Promise<RoutineTaskProgress>;
}
