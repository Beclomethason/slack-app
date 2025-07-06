import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import { MessageScheduler } from './scheduler/messageScheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Serve frontend - REMOVE the wildcard route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start message scheduler
MessageScheduler.start();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
