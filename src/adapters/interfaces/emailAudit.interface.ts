export interface EmailActivity {
  timestamp: string;
  userId: string;
  ip?: string;
  userAgent?: string;
  method: string;
  path: string;
  to?: string;
  subject?: string;
  statusCode: number;
  suspicious: boolean;
  reasons?: string[];
}

export interface EmailSecurityReport {
  totalEmails: number;
  suspiciousEmails: number;
  blockedEmails: number;
  topSuspiciousIPs: string[];
  topSuspiciousUsers: string[];
  dailyStats: {
    date: string;
    count: number;
    suspicious: number;
  }[];
}

export interface DailyEmailQuota {
  userId: string;
  count: number;
  date: string;
  limit: number;
}
