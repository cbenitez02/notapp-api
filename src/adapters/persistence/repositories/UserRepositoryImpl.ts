import { IUserRepository } from '@core/repositories/IUserRepository';
import { Repository } from 'typeorm';
import { User } from '../../../core/entities/User';
import { UserEntity } from '../entities/UserEntity';

export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly repository: Repository<UserEntity>) {}

  public async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.repository.findOne({ where: { email } });
    return userEntity ? this.toDomainEntity(userEntity) : null;
  }

  public async findById(id: string): Promise<User | null> {
    const userEntity = await this.repository.findOne({ where: { id } });
    return userEntity ? this.toDomainEntity(userEntity) : null;
  }

  public async save(user: User): Promise<User> {
    const userEntity = this.repository.create({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
    });

    const savedEntity = await this.repository.save(userEntity);
    return this.toDomainEntity(savedEntity);
  }

  public async update(userId: string, updateData: Partial<User>): Promise<User> {
    const existingUser = await this.repository.findOne({ where: { id: userId } });
    if (!existingUser) {
      throw new Error(`User not found`);
    }

    // Remove undefined values
    const updateFields = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined));

    if (Object.keys(updateFields).length === 0) {
      throw new Error('No fields to update');
    }

    await this.repository.update(userId, updateFields);

    const updatedUser = await this.repository.findOne({ where: { id: userId } });
    if (!updatedUser) {
      throw new Error(`User not found`);
    }

    return this.toDomainEntity(updatedUser);
  }

  public async delete(userId: string): Promise<void> {
    await this.repository.delete(userId);
  }

  private toDomainEntity(userEntity: UserEntity): User {
    return new User(
      userEntity.id,
      userEntity.fullname,
      userEntity.email,
      userEntity.passwordHash,
      userEntity.role,
      userEntity.emailVerified,
      userEntity.isActive,
      userEntity.createdAt,
      userEntity.updatedAt,
    );
  }
}
