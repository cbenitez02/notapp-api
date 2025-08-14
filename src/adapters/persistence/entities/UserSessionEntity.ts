import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from './UserEntity';

@Entity('user_sessions')
export class UserSessionEntity {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column('char', { name: 'user_id', length: 36 })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'refresh_token', nullable: true, length: 500 })
  refreshToken?: string;

  @Column({ name: 'ip_address', nullable: true, length: 45 })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt?: Date;
}
