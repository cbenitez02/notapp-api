export class User {
  constructor(
    public id: string,
    public fullname: string,
    public email: string,
    public passwordHash: string,
    public role: 'buyer' | 'seller' | 'both' | 'admin',
    public emailVerified: boolean = false,
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validateUser();
  }

  private validateUser(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!this.fullname || this.fullname.trim().length < 2) {
      throw new Error('Fullname must be at least 2 characters');
    }

    if (!this.isValidEmail(this.email)) {
      throw new Error('Invalid email format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public updateProfile(fullname: string): void {
    if (!fullname || fullname.trim().length < 2) {
      throw new Error('Fullname must be at least 2 characters');
    }
    this.fullname = fullname.trim();
    this.updatedAt = new Date();
  }

  public verifyEmail(): void {
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public changeRole(newRole: 'buyer' | 'seller' | 'both' | 'admin'): void {
    this.role = newRole;
    this.updatedAt = new Date();
  }

  public canSell(): boolean {
    return this.role === 'seller' || this.role === 'both' || this.role === 'admin';
  }

  public canBuy(): boolean {
    return this.role === 'buyer' || this.role === 'both' || this.role === 'admin';
  }
}
