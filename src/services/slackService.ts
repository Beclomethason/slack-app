import axios from 'axios';
import { SlackToken, SlackChannel } from '../types';
import { TokenService } from './tokenService';

export class SlackService {
  private static readonly SLACK_API_BASE = 'https://slack.com/api';

  static async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const response = await axios.post(`${this.SLACK_API_BASE}/oauth.v2.access`, {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      return response.data;
    } catch (error) {
      throw new Error('Failed to exchange code for token');
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      const response = await axios.post(`${this.SLACK_API_BASE}/oauth.v2.access`, {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });

      return response.data;
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }

  static async getChannels(accessToken: string): Promise<SlackChannel[]> {
    try {
      const response = await axios.get(`${this.SLACK_API_BASE}/conversations.list`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { types: 'public_channel,private_channel' }
      });

      return response.data.channels || [];
    } catch (error) {
      throw new Error('Failed to fetch channels');
    }
  }

  static async sendMessage(accessToken: string, channelId: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.SLACK_API_BASE}/chat.postMessage`, {
        channel: channelId,
        text: message
      }, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.ok;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  static async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.SLACK_API_BASE}/auth.test`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data.ok;
    } catch (error) {
      return false;
    }
  }
}
