import { DataSource } from 'typeorm';
import { EmailVerificationTokenEntity } from '../persistence/entities/EmailVerificationTokenEntity';
import { UserEntity } from '../persistence/entities/UserEntity';
import { UserSessionEntity } from '../persistence/entities/UserSessionEntity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: 'root',
  password: 'muycapo123',
  database: 'dev',
  synchronize: false,
  logging: false,
  entities: [UserEntity, UserSessionEntity, EmailVerificationTokenEntity],
  migrations: [],
  subscribers: [],
});
