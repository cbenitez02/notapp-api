import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RoutineTaskStatus } from '../../../core/interfaces/routine.interface';
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

  @Column({ type: 'date' })
  date_local!: string; // "2025-08-14"

  @Column({ type: 'time', nullable: true })
  time_local?: string;

  @Column({ type: 'smallint', nullable: true })
  duration_min?: number;

  @Column({ type: 'enum', enum: RoutineTaskStatus, default: RoutineTaskStatus.PENDING })
  status!: RoutineTaskStatus;

  @Column({ type: 'datetime', nullable: true })
  started_at_local?: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at_local?: Date;

  @Column({ length: 500, nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
