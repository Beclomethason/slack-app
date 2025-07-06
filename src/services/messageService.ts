import { ScheduledMessage } from '../types';
import db from '../database/database';

export class MessageService {
  static async scheduleMessage(message: ScheduledMessage): Promise<number> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO scheduled_messages 
        (userId, channelId, channelName, message, scheduledTime)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(query, [
        message.userId,
        message.channelId,
        message.channelName,
        message.message,
        message.scheduledTime
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  static async getScheduledMessages(userId: string): Promise<ScheduledMessage[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM scheduled_messages 
        WHERE userId = ? AND status = 'pending'
        ORDER BY scheduledTime ASC
      `;
      
      db.all(query, [userId], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static async cancelMessage(messageId: number, userId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE scheduled_messages 
        SET status = 'cancelled'
        WHERE id = ? AND userId = ? AND status = 'pending'
      `;
      
      db.run(query, [messageId, userId], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  static async getPendingMessages(): Promise<ScheduledMessage[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM scheduled_messages 
        WHERE status = 'pending' AND scheduledTime <= CURRENT_TIMESTAMP
      `;
      
      db.all(query, [], (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static async markMessageAsSent(messageId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE scheduled_messages 
        SET status = 'sent'
        WHERE id = ?
      `;
      
      db.run(query, [messageId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
