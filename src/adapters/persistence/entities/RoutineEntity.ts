import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoutineTaskEntity } from './RoutineTaskEntity';

@Entity({ name: 'routines' })
export class RoutineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('char', { length: 36 })
  user_id!: string;

  @Column({ length: 120 })
  title!: string;

  @Column({ type: 'time', nullable: true })
  default_time_local?: string; // "06:00:00"

  // Ej: [1,2,3,4,5] => L-V
  @Column({ type: 'json' })
  repeat_days_json!: number[];

  @Column({ type: 'tinyint', default: 1 })
  active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => RoutineTaskEntity, (t) => t.routine)
  tasks?: RoutineTaskEntity[];
}
