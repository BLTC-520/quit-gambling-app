import { useState } from 'react';
import { motion } from 'motion/react';
import { User, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { api, type PlayerData } from '../lib/api';

interface AuthScreenProps {
  onAuth: (player: PlayerData) => void;
}

type AuthMode = 'choose' | 'register' | 'login';

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('choose');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const player = mode === 'register'
        ? await api.register(nickname)
        : await api.login(nickname);
      onAuth(player);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            <span className="bg-blue-600 px-2 py-1 rounded">CASINO</span>
            <span className="text-neutral-500 ml-2">REALITY CHECK</span>
          </h1>
          <p className="text-neutral-500 text-sm mt-3">
            See what gambling really costs you.
          </p>
        </div>

        {mode === 'choose' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            <button
              onClick={() => setMode('register')}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
            >
              <UserPlus size={20} />
              NEW PLAYER
            </button>
            <button
              onClick={() => setMode('login')}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors border border-neutral-700"
            >
              <LogIn size={20} />
              RETURNING PLAYER
            </button>
          </motion.div>
        )}

        {(mode === 'register' || mode === 'login') && (
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input
                type="text"
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoFocus
                maxLength={20}
                minLength={2}
                required
                className="w-full pl-12 pr-4 py-4 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors font-mono text-lg"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 px-4 py-3 rounded-xl"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || nickname.trim().length < 2}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-bold rounded-xl transition-colors"
            >
              {loading ? 'CONNECTING...' : mode === 'register' ? 'CREATE PLAYER' : 'LOG IN'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('choose'); setError(''); setNickname(''); }}
              className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
            >
              Back
            </button>
          </motion.form>
        )}
      </motion.div>
    </motion.div>
  );
}
