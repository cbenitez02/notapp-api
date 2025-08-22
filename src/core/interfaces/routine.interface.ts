import { CategoryResponseDto } from './category.interface';

export enum RoutinePriority {
  ALTA = 'Alta',
  MEDIA = 'Media',
  BAJA = 'Baja',
}

export interface CreateRoutineDto {
  userId: string;
  title: string;
  defaultTimeLocal?: string; // "06:00:00"
  repeatDaysJson: number[]; // [1,2,3,4,5] => L-V (1=Monday, 7=Sunday)
  active?: boolean;
  createTasks?: CreateRoutineTaskForRoutineDto[]; // Tareas opcionales a crear junto con la rutina
}

// Interfaz para el body del request (sin userId que viene del token)
export interface CreateRoutineRequestDto {
  title: string;
  defaultTimeLocal?: string; // "06:00:00"
  repeatDaysJson: number[]; // [1,2,3,4,5] => L-V (1=Monday, 7=Sunday)
  active?: boolean;
  createTasks?: CreateRoutineTaskForRoutineDto[]; // Tareas opcionales a crear junto con la rutina
}

// Nueva interfaz para crear tareas junto con la rutina
export interface CreateRoutineTaskForRoutineDto {
  title: string; // Título/nombre específico de la tarea
  dateLocal?: string; // "2025-08-14" - Si no se especifica, se genera automáticamente basado en repeatDaysJson
  timeLocal?: string; // Si no se especifica, usa defaultTimeLocal de la rutina
  durationMin?: number; // Duración específica para esta tarea
  categoryId?: string; // Categoría específica de la tarea (puede diferir de la rutina)
  priority?: RoutinePriority; // Prioridad específica de la tarea (si no se especifica, usa la de la rutina)
  status?: RoutineTaskStatus;
  startedAtLocal?: Date; // Fecha y hora de inicio
  completedAtLocal?: Date; // Fecha y hora de completado
  description?: string; // Descripción adicional sobre la tarea
}

export interface UpdateRoutineDto {
  title?: string;
  defaultTimeLocal?: string;
  repeatDaysJson?: number[];
  active?: boolean;
}

export interface RoutineResponseDto {
  id: string;
  userId: string;
  title: string;
  defaultTimeLocal?: string;
  repeatDaysJson: number[];
  active: boolean;
  createdAt: Date;
  tasks?: RoutineTaskResponseDto[];
}

export interface RoutineTaskResponseDto {
  id: string;
  routineId: string;
  userId: string;
  title: string;
  dateLocal: string;
  timeLocal?: string;
  durationMin?: number;
  category?: CategoryResponseDto;
  priority: RoutinePriority;
  status: RoutineTaskStatus;
  startedAtLocal?: Date;
  completedAtLocal?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineFilters {
  userId?: string;
  active?: boolean;
  title?: string;
}

export enum RoutineTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export interface CreateRoutineTaskDto {
  routineId: string;
  userId: string;
  dateLocal: string; // "2025-08-14"
  timeLocal?: string;
  durationMin?: number;
}

export interface UpdateRoutineTaskDto {
  timeLocal?: string;
  durationMin?: number;
  status?: RoutineTaskStatus;
  startedAtLocal?: Date;
  completedAtLocal?: Date;
  description?: string;
}

export interface RoutineTaskResponseDto {
  id: string;
  routineId: string;
  userId: string;
  dateLocal: string;
  timeLocal?: string;
  durationMin?: number;
  status: RoutineTaskStatus;
  startedAtLocal?: Date;
  completedAtLocal?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineTaskFilters {
  userId?: string;
  routineId?: string;
  dateLocal?: string;
  status?: RoutineTaskStatus;
  dateFrom?: string; // "2025-08-01"
  dateTo?: string; // "2025-08-31"
}

export interface CreateDailySummaryDto {
  userId: string;
  dateLocal: string; // "2025-08-14"
  totalCompleted?: number;
  totalMissed?: number;
  totalInProgress?: number;
  totalPending?: number;
  totalSkipped?: number;
  progressPercent?: number;
}

export interface UpdateDailySummaryDto {
  totalCompleted?: number;
  totalMissed?: number;
  totalInProgress?: number;
  totalPending?: number;
  totalSkipped?: number;
  progressPercent?: number;
}

export interface DailySummaryResponseDto {
  id: string;
  userId: string;
  dateLocal: string;
  totalCompleted: number;
  totalMissed: number;
  totalInProgress: number;
  totalPending: number;
  totalSkipped: number;
  progressPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailySummaryFilters {
  userId?: string;
  dateLocal?: string;
  dateFrom?: string; // "2025-08-01"
  dateTo?: string; // "2025-08-31"
  progressPercentMin?: number;
  progressPercentMax?: number;
}
