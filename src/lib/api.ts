const API_BASE = 'http://localhost:3001/api';

function getToken(): string | null {
  return localStorage.getItem('session_token');
}

function setToken(token: string): void {
  localStorage.setItem('session_token', token);
}

function clearToken(): void {
  localStorage.removeItem('session_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Request failed');
  }

  return json.data as T;
}

export interface PlayerData {
  id: string;
  nickname: string;
  token?: string;
  balance: number;
  totalLost: number;
  mysteryBoxAmount: number | null;
}

export interface LeaderboardEntry {
  nickname: string;
  balance: number;
  mystery_box_amount: number;
  total_lost: number;
  last_seen: string;
}

export const api = {
  register(nickname: string): Promise<PlayerData> {
    return apiFetch<PlayerData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    }).then((data) => {
      if (data.token) setToken(data.token);
      return data;
    });
  },

  login(nickname: string): Promise<PlayerData> {
    return apiFetch<PlayerData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    }).then((data) => {
      if (data.token) setToken(data.token);
      return data;
    });
  },

  getMe(): Promise<PlayerData> {
    return apiFetch<PlayerData>('/players/me');
  },

  setMysteryBox(amount: number): Promise<{ balance: number; mysteryBoxAmount: number }> {
    return apiFetch('/players/mystery-box', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  updateBalance(newBalance: number, lostAmount: number): Promise<{ balance: number; totalLost: number }> {
    return apiFetch('/players/balance', {
      method: 'POST',
      body: JSON.stringify({ newBalance, lostAmount }),
    });
  },

  recordBet(bet: {
    gameType: string;
    betAmount: number;
    outcome: string;
    payout: number;
    balanceAfter: number;
  }): Promise<void> {
    return apiFetch('/bets', {
      method: 'POST',
      body: JSON.stringify(bet),
    });
  },

  getLeaderboard(): Promise<LeaderboardEntry[]> {
    return apiFetch<LeaderboardEntry[]>('/leaderboard');
  },

  getToken,
  clearToken,
};
