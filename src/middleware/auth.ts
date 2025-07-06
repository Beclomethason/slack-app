import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/tokenService';
import { SlackService } from '../services/slackService';

export interface AuthRequest extends Request {
  userId?: string;
  accessToken?: string;
}

export async function authenticateSlack(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.headers['user-id'] as string;
    
    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const tokenData = await TokenService.getToken(userId);
    
    if (!tokenData) {
      res.status(401).json({ error: 'No Slack connection found' });
      return;
    }

    // Check if token is valid
    const isValid = await SlackService.validateToken(tokenData.accessToken);
    
    if (!isValid && tokenData.refreshToken) {
      // Try to refresh token
      try {
        const refreshResponse = await SlackService.refreshAccessToken(tokenData.refreshToken);
        
        if (refreshResponse.ok) {
          await TokenService.updateToken(userId, refreshResponse.access_token);
          req.accessToken = refreshResponse.access_token;
        } else {
          res.status(401).json({ error: 'Token refresh failed' });
          return;
        }
      } catch (error) {
        res.status(401).json({ error: 'Token refresh failed' });
        return;
      }
    } else if (!isValid) {
      res.status(401).json({ error: 'Invalid token, please reconnect' });
      return;
    } else {
      req.accessToken = tokenData.accessToken;
    }

    req.userId = userId;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}
