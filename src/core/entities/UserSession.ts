export class UserSession {
  constructor(
    public id: string,
    public userId: string,
    public refreshToken?: string,
    public ipAddress?: string,
    public userAgent?: string,
    public readonly createdAt: Date = new Date(),
    public expiresAt: Date = new Date(),
    public isActive: boolean = true,
  ) {
    this.validateSession();
  }

  private validateSession(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Session ID cannot be empty');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!this.refreshToken || this.refreshToken.trim().length === 0) {
      throw new Error('Refresh token cannot be empty');
    }

    if (this.expiresAt <= new Date()) {
      throw new Error('Session expiration date must be in the future');
    }
  }

  public isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  public extendSession(newExpirationDate: Date): void {
    if (newExpirationDate <= new Date()) {
      throw new Error('New expiration date must be in the future');
    }
    this.expiresAt = newExpirationDate;
  }

  public revoke(): void {
    this.isActive = false;
  }

  public updateRefreshToken(newToken: string): void {
    if (!newToken || newToken.trim().length === 0) {
      throw new Error('New refresh token cannot be empty');
    }
    this.refreshToken = newToken;
  }

  public getRemainingTime(): number {
    return Math.max(0, this.expiresAt.getTime() - new Date().getTime());
  }

  public isValidForRefresh(): boolean {
    return this.isActive && !this.isExpired();
  }
}
