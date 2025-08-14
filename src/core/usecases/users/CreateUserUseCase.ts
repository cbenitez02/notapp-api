import { IUserRepository } from '@core/repositories/IUserRepository';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../entities/User';
import { CreateUserDto } from '../../interfaces/user.interface';
export class CreateUserUseCase {
  private readonly SALT_ROUNDS = 12;

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(createUserDto: CreateUserDto): Promise<User> {
    // Validar DTO
    this.validateCreateUserDto(createUserDto);

    const { fullname, email, password, role } = createUserDto;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Validate password
    this.validatePassword(password);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    //Create a new user
    const newUser = new User(uuidv4(), fullname, email, hashedPassword, role, false, true, new Date(), new Date());

    //Save the new user to the repository
    return await this.userRepository.save(newUser);
  }

  private validateCreateUserDto(dto: CreateUserDto): void {
    if (!dto.fullname || dto.fullname.trim().length < 2) {
      throw new Error('Fullname is required and must be at least 2 characters');
    }

    if (!dto.email || !this.isValidEmail(dto.email)) {
      throw new Error('Valid email is required');
    }

    if (!dto.role || !['buyer', 'seller', 'both', 'admin'].includes(dto.role)) {
      throw new Error('Valid role is required');
    }
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
