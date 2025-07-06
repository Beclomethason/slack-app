import { SlackToken } from '../types';
import db from '../database/database';

export class TokenService {
  static async saveToken(token: SlackToken): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO slack_tokens 
        (userId, accessToken, refreshToken, teamId, teamName, expiresAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [
        token.userId,
        token.accessToken,
        token.refreshToken,
        token.teamId,
        token.teamName,
        token.expiresAt
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static async getToken(userId: string): Promise<SlackToken | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM slack_tokens WHERE userId = ?';
      
      db.get(query, [userId], (err, row: any) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  static async updateToken(userId: string, accessToken: string, expiresAt?: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE slack_tokens 
        SET accessToken = ?, expiresAt = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ?
      `;
      
      db.run(query, [accessToken, expiresAt, userId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
