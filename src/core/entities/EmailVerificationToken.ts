export class EmailVerificationToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly createdAt: Date = new Date(),
    public readonly expiresAt: Date,
    public isUsed: boolean = false,
  ) {
    this.validateToken();
  }

  private validateToken(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Token ID cannot be empty');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!this.token || this.token.trim().length === 0) {
      throw new Error('Token cannot be empty');
    }

    if (this.expiresAt <= new Date()) {
      throw new Error('Token expiration date must be in the future');
    }
  }

  public isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  public isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }

  public markAsUsed(): void {
    if (this.isUsed) {
      throw new Error('Token has already been used');
    }

    if (this.isExpired()) {
      throw new Error('Cannot use expired token');
    }

    this.isUsed = true;
  }

  public getRemainingTime(): number {
    return Math.max(0, this.expiresAt.getTime() - new Date().getTime());
  }

  public getRemainingTimeInMinutes(): number {
    return Math.floor(this.getRemainingTime() / (1000 * 60));
  }
}
