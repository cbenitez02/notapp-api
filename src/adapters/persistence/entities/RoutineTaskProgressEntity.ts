import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RoutineTaskStatus } from '../../../core/interfaces/routine.interface';
import { RoutineTemplateTaskEntity } from './RoutineTemplateTaskEntity';

@Entity({ name: 'routine_task_progress' })
@Index(['routine_template_task_id', 'date_local'], { unique: true })
@Index(['user_id', 'date_local'])
@Index(['user_id', 'date_local', 'status'])
export class RoutineTaskProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RoutineTemplateTaskEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_template_task_id' })
  routineTemplateTask!: RoutineTemplateTaskEntity;

  @Column('char', { length: 36 })
  routine_template_task_id!: string;

  @Column('char', { length: 36 })
  user_id!: string;

  @Column({ type: 'date' })
  date_local!: string; // "2025-08-14"

  @Column({ type: 'enum', enum: RoutineTaskStatus, default: RoutineTaskStatus.PENDING })
  status!: RoutineTaskStatus;

  @Column({ type: 'datetime', nullable: true })
  started_at_local?: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at_local?: Date;

  @Column({ length: 1000, nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
