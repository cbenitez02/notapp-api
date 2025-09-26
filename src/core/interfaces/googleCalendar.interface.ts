export interface GoogleCalendarIntegration {
  id: string;
  userId: string;
  googleAccountId: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  calendarId?: string; // ID del calendar principal de Google
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleCalendarTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleCalendarAuthUrl {
  authUrl: string;
  state: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }[];
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
}

export interface EventDateTime {
  dateTime?: string; // RFC3339 timestamp
  date?: string; // Date only (YYYY-MM-DD)
  timeZone?: string;
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

export interface CreateCalendarEventDto {
  userId: string;
  event: CalendarEvent;
}

export interface UpdateCalendarEventDto {
  userId: string;
  eventId: string;
  event: Partial<CalendarEvent>;
}

export interface DeleteCalendarEventDto {
  userId: string;
  eventId: string;
}

export interface ListCalendarEventsDto {
  userId: string;
  timeMin?: Date;
  timeMax?: Date;
  maxResults?: number;
}
