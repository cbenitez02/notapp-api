export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface SendEmailDto {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailDto {
  to: string;
  username: string;
  verificationUrl: string;
}

export interface PasswordResetEmailDto {
  to: string;
  username: string;
  resetUrl: string;
}

export interface IEmailService {
  sendVerificationEmail(data: VerificationEmailDto, userId?: string): Promise<void>;
  sendPasswordResetEmail(data: PasswordResetEmailDto, userId?: string): Promise<void>;
  sendEmail(data: SendEmailDto, userId?: string): Promise<void>;
}
