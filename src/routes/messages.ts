import { Router, Response } from 'express';
import { SlackService } from '../services/slackService';
import { MessageService } from '../services/messageService';
import { authenticateSlack, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/channels', authenticateSlack, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const channels = await SlackService.getChannels(req.accessToken!);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

router.post('/send', authenticateSlack, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { channelId, message } = req.body;
    
    if (!channelId || !message) {
      res.status(400).json({ error: 'Channel ID and message required' });
      return;
    }

    const success = await SlackService.sendMessage(req.accessToken!, channelId, message);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/schedule', authenticateSlack, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { channelId, channelName, message, scheduledTime } = req.body;
    
    if (!channelId || !message || !scheduledTime) {
      res.status(400).json({ error: 'Channel ID, message, and scheduled time required' });
      return;
    }

    const scheduleDate = new Date(scheduledTime);
    
    if (scheduleDate <= new Date()) {
      res.status(400).json({ error: 'Scheduled time must be in the future' });
      return;
    }

    const messageId = await MessageService.scheduleMessage({
      userId: req.userId!,
      channelId,
      channelName,
      message,
      scheduledTime: scheduleDate,
      status: 'pending',
      createdAt: new Date()
    });

    res.json({ success: true, messageId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule message' });
  }
});

router.get('/scheduled', authenticateSlack, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messages = await MessageService.getScheduledMessages(req.userId!);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled messages' });
  }
});

router.delete('/scheduled/:id', authenticateSlack, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messageId = parseInt(req.params.id);
    const success = await MessageService.cancelMessage(messageId, req.userId!);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Message not found or already sent' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel message' });
  }
});

export default router;
