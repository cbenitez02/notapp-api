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
  tasks?: CreateRoutineTaskDto[]; // Renombrado de templateTasks a tasks
}

// Interfaz para el body del request (sin userId que viene del token)
export interface CreateRoutineRequestDto {
  title: string;
  defaultTimeLocal?: string; // "06:00:00"
  repeatDaysJson: number[]; // [1,2,3,4,5] => L-V (1=Monday, 7=Sunday)
  active?: boolean;
  tasks?: CreateRoutineTaskDto[]; // Renombrado de templateTasks a tasks
  createTasks?: CreateRoutineTaskDto[]; // Alias para tasks (retrocompatibilidad)
  templateTasks?: CreateRoutineTaskDto[]; // Alias para tasks (retrocompatibilidad)
}

// Nueva interfaz para crear tareas de rutina (renombrado de CreateRoutineTemplateTaskDto)
export interface CreateRoutineTaskDto {
  title: string;
  timeLocal?: string; // Si no se especifica, usa defaultTimeLocal de la rutina
  durationMin?: number;
  categoryId?: string;
  priority?: RoutinePriority;
  description?: string;
  sortOrder?: number;
}

// Mantener la interfaz anterior para retrocompatibilidad durante migración
export interface CreateRoutineTaskForRoutineDto {
  title: string;
  dateLocal?: string;
  timeLocal?: string;
  durationMin?: number;
  categoryId?: string;
  priority?: RoutinePriority;
  status?: RoutineTaskStatus;
  startedAtLocal?: Date;
  completedAtLocal?: Date;
  description?: string;
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
  tasks?: RoutineTaskResponseDto[]; // Renombrado de templateTasks a tasks
}

// Interfaz para respuesta de tareas de rutina (renombrado de RoutineTemplateTaskResponseDto)
export interface RoutineTaskResponseDto {
  id: string;
  routineId: string;
  title: string;
  timeLocal?: string;
  durationMin?: number;
  category?: CategoryResponseDto;
  priority: RoutinePriority;
  description?: string;
  sortOrder: number;
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

// Interfaces para progreso de tareas
export interface CreateRoutineTaskProgressDto {
  routineTemplateTaskId: string;
  userId: string;
  dateLocal: string; // "2025-08-14"
  status?: RoutineTaskStatus;
  notes?: string;
}

export interface UpdateRoutineTaskProgressDto {
  status?: RoutineTaskStatus;
  startedAtLocal?: Date;
  completedAtLocal?: Date;
  notes?: string;
}

export interface RoutineTaskProgressResponseDto {
  id: string;
  routineTemplateTaskId: string;
  userId: string;
  dateLocal: string;
  status: RoutineTaskStatus;
  startedAtLocal?: Date;
  completedAtLocal?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface combinada para mostrar tareas con progreso
export interface RoutineTaskWithProgressDto {
  task: RoutineTaskResponseDto;
  progress?: RoutineTaskProgressResponseDto;
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

export interface RoutineStats {
  // Estadísticas del día actual
  dailyStats: {
    completedTasks: number;
    totalTasks: number;
    completionPercentage: number;
  };

  // Estadísticas semanales
  weeklyStats: {
    currentWeekCompletion: number;
    previousWeekCompletion: number;
    improvementPercentage: number;
  };

  // Estadísticas generales
  generalStats: {
    activeRoutines: number;
    totalCompletedTasks: number;
    tasksInProgress: number;
    pendingTasks: number;
    missedTasks: number;
  };
}
