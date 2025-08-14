import { Request, Response } from 'express';
import { CreateUserDto } from '../../core/interfaces/user.interface';
import { CreateUserUseCase } from '../../core/usecases/users/CreateUserUseCase';
import { DeleteUserUseCase } from '../../core/usecases/users/DeleteUserUseCase';
import { GetUserByIdUseCase } from '../../core/usecases/users/GetUserByIdUseCase';

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    try {
      //Validate request body
      const validationError = this.validateCreateUserRequest(req.body);

      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const { fullname, email, password, role } = req.body;
      const userDto: CreateUserDto = {
        fullname: fullname.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
      };

      const user = await this.createUserUseCase.execute(userDto);

      const userResponse = {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
      res.status(201).json({ success: true, data: userResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      await this.deleteUserUseCase.execute(id);
      res.status(204).json({ success: true });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      const user = await this.getUserByIdUseCase.execute(id);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const userResponse = {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      res.status(200).json({ success: true, data: userResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private validateCreateUserRequest(body: CreateUserDto): string[] {
    const errors: string[] = [];

    if (!body.fullname || typeof body.fullname !== 'string' || body.fullname.trim().length < 2) {
      errors.push('Fullname is required and must be at least 2 characters');
    }

    if (!body.email || !this.isValidEmail(body.email)) {
      errors.push('Valid email is required');
    }

    if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
      errors.push('Password is required and must be at least 6 characters');
    }

    if (!body.role || !['buyer', 'seller', 'both', 'admin'].includes(body.role)) {
      errors.push('Valid role is required (buyer, seller, both, admin)');
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: 'Conflict', message: error.message });
      } else {
        res.status(400).json({ error: 'Bad Request', message: error.message });
      }
    } else {
      res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred' });
    }
  }
}
