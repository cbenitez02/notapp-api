import { User } from '@core/entities/User';

export interface IUserRepository {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  delete(id: string): Promise<void>;
  update(id: string, updateData: Partial<User>): Promise<User>;
  findAll(): Promise<User[]>;
}
