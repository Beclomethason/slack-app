import cron from 'node-cron';
import { MessageService } from '../services/messageService';
import { TokenService } from '../services/tokenService';
import { SlackService } from '../services/slackService';

export class MessageScheduler {
  static start() {
    // Check for pending messages every minute
    cron.schedule('* * * * *', async () => {
      try {
        const pendingMessages = await MessageService.getPendingMessages();
        
        for (const message of pendingMessages) {
          await this.sendScheduledMessage(message);
        }
      } catch (error) {
        console.error('Error in message scheduler:', error);
      }
    });
    
    console.log('Message scheduler started');
  }

  private static async sendScheduledMessage(message: any) {
    try {
      const tokenData = await TokenService.getToken(message.userId);
      
      if (!tokenData) {
        console.error(`No token found for user ${message.userId}`);
        return;
      }

      let accessToken = tokenData.accessToken;
      
      // Validate token and refresh if needed
      const isValid = await SlackService.validateToken(accessToken);
      
      if (!isValid && tokenData.refreshToken) {
        try {
          const refreshResponse = await SlackService.refreshAccessToken(tokenData.refreshToken);
          
          if (refreshResponse.ok) {
            accessToken = refreshResponse.access_token;
            await TokenService.updateToken(message.userId, accessToken);
          } else {
            console.error(`Failed to refresh token for user ${message.userId}`);
            return;
          }
        } catch (error) {
          console.error(`Token refresh failed for user ${message.userId}:`, error);
          return;
        }
      }

      const success = await SlackService.sendMessage(accessToken, message.channelId, message.message);
      
      if (success) {
        await MessageService.markMessageAsSent(message.id);
        console.log(`Scheduled message ${message.id} sent successfully`);
      } else {
        console.error(`Failed to send scheduled message ${message.id}`);
      }
    } catch (error) {
      console.error(`Error sending scheduled message ${message.id}:`, error);
    }
  }
}
