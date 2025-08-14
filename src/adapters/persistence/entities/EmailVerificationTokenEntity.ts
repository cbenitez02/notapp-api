import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from './UserEntity';

@Entity('email_verification_tokens')
export class EmailVerificationTokenEntity {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column('char', { name: 'user_id', length: 36 })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ length: 255 })
  token!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @Column({ default: false })
  isUsed!: boolean;
}
