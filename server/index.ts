import express from 'express';
import crypto from 'crypto';
import db from './db.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

// CORS for dev — allow any localhost port
app.use((_req, res, next) => {
  const origin = _req.headers.origin;
  if (origin && origin.startsWith('http://localhost')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// --- Auth middleware ---
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  const player = db.prepare('SELECT * FROM players WHERE session_token = ?').get(token) as Record<string, unknown> | undefined;
  if (!player) {
    res.status(401).json({ success: false, error: 'Invalid token' });
    return;
  }

  // Update last_seen
  db.prepare("UPDATE players SET last_seen = datetime('now') WHERE id = ?").run(player.id);

  (req as unknown as Record<string, unknown>).player = player;
  next();
}

// --- Auth Routes ---

// Register with nickname
app.post('/api/auth/register', (req, res) => {
  const { nickname } = req.body;

  if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 20) {
    res.status(400).json({ success: false, error: 'Nickname must be 2-20 characters' });
    return;
  }

  const cleanNickname = nickname.trim();
  const existing = db.prepare('SELECT id FROM players WHERE nickname = ?').get(cleanNickname);
  if (existing) {
    res.status(409).json({ success: false, error: 'Nickname already taken' });
    return;
  }

  const id = crypto.randomUUID();
  const sessionToken = crypto.randomUUID();

  db.prepare(
    'INSERT INTO players (id, nickname, session_token) VALUES (?, ?, ?)'
  ).run(id, cleanNickname, sessionToken);

  res.json({
    success: true,
    data: { id, nickname: cleanNickname, token: sessionToken, balance: 0, totalLost: 0 },
  });
});

// Login with nickname (returns existing session)
app.post('/api/auth/login', (req, res) => {
  const { nickname } = req.body;

  if (!nickname || typeof nickname !== 'string') {
    res.status(400).json({ success: false, error: 'Nickname required' });
    return;
  }

  const player = db.prepare('SELECT * FROM players WHERE nickname = ?').get(nickname.trim()) as Record<string, unknown> | undefined;
  if (!player) {
    res.status(404).json({ success: false, error: 'Player not found. Register first!' });
    return;
  }

  // Refresh session token
  const newToken = crypto.randomUUID();
  db.prepare('UPDATE players SET session_token = ? WHERE id = ?').run(newToken, player.id);

  res.json({
    success: true,
    data: {
      id: player.id,
      nickname: player.nickname,
      token: newToken,
      balance: player.balance,
      totalLost: player.total_lost,
      mysteryBoxAmount: player.mystery_box_amount,
    },
  });
});

// Get current player
app.get('/api/players/me', authenticate, (req, res) => {
  const player = (req as unknown as Record<string, unknown>).player as Record<string, unknown>;
  res.json({
    success: true,
    data: {
      id: player.id,
      nickname: player.nickname,
      balance: player.balance,
      totalLost: player.total_lost,
      mysteryBoxAmount: player.mystery_box_amount,
    },
  });
});

// --- Game Routes ---

// Set mystery box result (called once after opening)
app.post('/api/players/mystery-box', authenticate, (req, res) => {
  const player = (req as unknown as Record<string, unknown>).player as Record<string, unknown>;
  const { amount } = req.body;

  if (typeof amount !== 'number' || amount < 1 || amount > 200) {
    res.status(400).json({ success: false, error: 'Invalid amount (1-200)' });
    return;
  }

  db.prepare('UPDATE players SET mystery_box_amount = ?, balance = ? WHERE id = ?')
    .run(amount, amount, player.id);

  res.json({ success: true, data: { balance: amount, mysteryBoxAmount: amount } });
});

// Update balance (after a bet)
app.post('/api/players/balance', authenticate, (req, res) => {
  const player = (req as unknown as Record<string, unknown>).player as Record<string, unknown>;
  const { newBalance, lostAmount } = req.body;

  if (typeof newBalance !== 'number' || newBalance < 0) {
    res.status(400).json({ success: false, error: 'Invalid balance' });
    return;
  }

  const currentTotalLost = (player.total_lost as number) ?? 0;
  const updatedTotalLost = currentTotalLost + (typeof lostAmount === 'number' && lostAmount > 0 ? lostAmount : 0);

  db.prepare('UPDATE players SET balance = ?, total_lost = ? WHERE id = ?')
    .run(newBalance, updatedTotalLost, player.id);

  res.json({ success: true, data: { balance: newBalance, totalLost: updatedTotalLost } });
});

// Record a bet
app.post('/api/bets', authenticate, (req, res) => {
  const player = (req as unknown as Record<string, unknown>).player as Record<string, unknown>;
  const { gameType, betAmount, outcome, payout, balanceAfter } = req.body;

  if (!gameType || !betAmount || !outcome || payout === undefined || balanceAfter === undefined) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  db.prepare(
    'INSERT INTO bets (player_id, game_type, bet_amount, outcome, payout, balance_after) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(player.id, gameType, betAmount, outcome, payout, balanceAfter);

  res.json({ success: true });
});

// Leaderboard — all active players
app.get('/api/leaderboard', (_req, res) => {
  const players = db.prepare(`
    SELECT nickname, balance, mystery_box_amount, total_lost, last_seen
    FROM players
    WHERE mystery_box_amount IS NOT NULL
    ORDER BY balance DESC
    LIMIT 50
  `).all();

  res.json({ success: true, data: players });
});

app.listen(PORT, () => {
  console.log(`Game server running on http://localhost:${PORT}`);
});
