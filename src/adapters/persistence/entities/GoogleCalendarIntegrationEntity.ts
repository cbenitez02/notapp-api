import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('google_calendar_integrations')
export class GoogleCalendarIntegrationEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { length: 36 })
  userId!: string;

  @Column('varchar', { length: 255 })
  googleAccountId!: string;

  @Column('varchar', { length: 255 })
  googleEmail!: string;

  @Column('text')
  accessToken!: string;

  @Column('text')
  refreshToken!: string;

  @Column('datetime')
  tokenExpiresAt!: Date;

  @Column('varchar', { length: 255, nullable: true })
  calendarId?: string;

  @Column('boolean', { default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
