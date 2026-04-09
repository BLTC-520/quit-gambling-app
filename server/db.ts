import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'game.db');

// Ensure data directory exists
import fs from 'fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for concurrent read/write performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    nickname TEXT UNIQUE NOT NULL,
    session_token TEXT UNIQUE,
    balance INTEGER DEFAULT 0,
    mystery_box_amount INTEGER,
    total_lost INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_seen TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL REFERENCES players(id),
    game_type TEXT NOT NULL,
    bet_amount INTEGER NOT NULL,
    outcome TEXT NOT NULL,
    payout INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_players_balance ON players(balance DESC);
  CREATE INDEX IF NOT EXISTS idx_bets_player ON bets(player_id, created_at DESC);
`);

export default db;
