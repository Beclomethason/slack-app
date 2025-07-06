import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../slack_connect.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Slack tokens table
    db.run(`
      CREATE TABLE IF NOT EXISTS slack_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        accessToken TEXT NOT NULL,
        refreshToken TEXT,
        teamId TEXT NOT NULL,
        teamName TEXT NOT NULL,
        expiresAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Scheduled messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS scheduled_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        channelId TEXT NOT NULL,
        channelName TEXT NOT NULL,
        message TEXT NOT NULL,
        scheduledTime DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

export default db;
