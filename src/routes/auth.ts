import { Router, Request, Response } from 'express';
import { SlackService } from '../services/slackService';
import { TokenService } from '../services/tokenService';

const router = Router();

router.get('/slack/connect', (req: Request, res: Response): void => {
  const scopes = 'channels:read,chat:write,users:read';
  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${process.env.SLACK_REDIRECT_URI}`;
  
  res.json({ authUrl: slackAuthUrl });
});

router.post('/slack/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, userId } = req.body;
    
    if (!code || !userId) {
      res.status(400).json({ error: 'Code and userId required' });
      return;
    }

    const tokenResponse = await SlackService.exchangeCodeForToken(code);
    
    if (!tokenResponse.ok) {
      res.status(400).json({ error: 'Failed to get access token' });
      return;
    }

    const tokenData = {
      userId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      teamId: tokenResponse.team.id,
      teamName: tokenResponse.team.name,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await TokenService.saveToken(tokenData);
    
    res.json({ success: true, teamName: tokenResponse.team.name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect to Slack' });
  }
});

// Add the callback route for handling OAuth redirect
router.get('/slack/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query;
  
  if (code) {
    res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage({
            type: 'slack-auth-success',
            code: '${code}'
          }, '*');
          window.close();
        } else {
          window.location.href = '/?code=${code}';
        }
      </script>
    `);
  } else {
    res.send('<script>window.close();</script>');
  }
});

export default router;
