import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RoutinePriority, RoutineTaskStatus } from '../../../core/interfaces/routine.interface';
import { CategoryEntity } from './CategoryEntity';
import { RoutineEntity } from './RoutineEntity';

@Entity({ name: 'routine_tasks' })
@Index(['user_id', 'date_local'])
@Index(['user_id', 'date_local', 'status'])
export class RoutineTaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RoutineEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_id' })
  routine!: RoutineEntity;

  @Column('char', { length: 36 })
  routine_id!: string;

  @Column('char', { length: 36 })
  user_id!: string;

  @Column({ length: 120 })
  title!: string; // Título/nombre de la tarea específica

  @Column({ type: 'date' })
  date_local!: string; // "2025-08-14"

  @Column({ type: 'time', nullable: true })
  time_local?: string;

  @Column({ type: 'smallint', nullable: true })
  duration_min?: number;

  @ManyToOne(() => CategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: CategoryEntity;

  @Column('char', { length: 36, nullable: true })
  category_id?: string; // Categoría específica de la tarea (puede diferir de la rutina)

  @Column({ type: 'enum', enum: RoutinePriority, default: RoutinePriority.MEDIA })
  priority!: RoutinePriority; // Prioridad específica de la tarea

  @Column({ type: 'enum', enum: RoutineTaskStatus, default: RoutineTaskStatus.PENDING })
  status!: RoutineTaskStatus;

  @Column({ type: 'datetime', nullable: true })
  started_at_local?: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at_local?: Date;

  @Column({ length: 500, nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
