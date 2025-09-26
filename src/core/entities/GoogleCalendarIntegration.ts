export class GoogleCalendarIntegration {
  public readonly id: string;
  public readonly userId: string;
  public googleAccountId: string;
  public googleEmail: string;
  public accessToken: string;
  public refreshToken: string;
  public tokenExpiresAt: Date;
  public calendarId?: string;
  public isActive: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(params: {
    userId: string;
    googleAccountId: string;
    googleEmail: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    id?: string;
    calendarId?: string;
  }) {
    this.id = params.id || crypto.randomUUID();
    this.userId = params.userId;
    this.googleAccountId = params.googleAccountId;
    this.googleEmail = params.googleEmail;
    this.accessToken = params.accessToken;
    this.refreshToken = params.refreshToken;
    this.tokenExpiresAt = new Date(Date.now() + params.expiresIn * 1000);
    this.calendarId = params.calendarId;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('GoogleCalendarIntegration: userId is required');
    }

    if (!this.googleAccountId || this.googleAccountId.trim().length === 0) {
      throw new Error('GoogleCalendarIntegration: googleAccountId is required');
    }

    if (!this.googleEmail || !this.isValidEmail(this.googleEmail)) {
      throw new Error('GoogleCalendarIntegration: valid googleEmail is required');
    }

    if (!this.accessToken || this.accessToken.trim().length === 0) {
      throw new Error('GoogleCalendarIntegration: accessToken is required');
    }

    if (!this.refreshToken || this.refreshToken.trim().length === 0) {
      throw new Error('GoogleCalendarIntegration: refreshToken is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public updateTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    this.updatedAt = new Date();
  }

  public isTokenExpired(): boolean {
    return new Date() >= this.tokenExpiresAt;
  }

  public isTokenExpiringSoon(minutesBefore: number = 5): boolean {
    const expirationThreshold = new Date(Date.now() + minutesBefore * 60 * 1000);
    return expirationThreshold >= this.tokenExpiresAt;
  }

  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public setCalendarId(calendarId: string): void {
    this.calendarId = calendarId;
    this.updatedAt = new Date();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      googleAccountId: this.googleAccountId,
      googleEmail: this.googleEmail,
      calendarId: this.calendarId,
      isActive: this.isActive,
      tokenExpiresAt: this.tokenExpiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Note: No incluimos tokens por seguridad en la serialización básica
    };
  }

  public toJSONWithTokens(): Record<string, unknown> {
    return {
      ...this.toJSON(),
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }
}
