export interface SlackToken {
    id?: number;
    userId: string;
    accessToken: string;
    refreshToken?: string;
    teamId: string;
    teamName: string;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ScheduledMessage {
    id?: number;
    userId: string;
    channelId: string;
    channelName: string;
    message: string;
    scheduledTime: Date;
    status: 'pending' | 'sent' | 'cancelled';
    createdAt: Date;
  }
  
  export interface SlackChannel {
    id: string;
    name: string;
    is_member: boolean;
  }
  