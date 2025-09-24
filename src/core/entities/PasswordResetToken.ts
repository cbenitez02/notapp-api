import { v4 as uuidv4 } from 'uuid';

export class PasswordResetToken {
  public readonly id: string;
  public readonly userId: string;
  public readonly token: string;
  public readonly createdAt: Date;
  public readonly expiresAt: Date;
  public isUsed: boolean;

  constructor(userId: string, expiresInMinutes: number = 60) {
    this.id = uuidv4();
    this.userId = userId;
    this.token = uuidv4();
    this.createdAt = new Date();
    this.expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    this.isUsed = false;
  }

  public isValid(): boolean {
    return !this.isUsed && this.expiresAt > new Date();
  }

  public markAsUsed(): void {
    this.isUsed = true;
  }

  public isExpired(): boolean {
    return this.expiresAt <= new Date();
  }
}
