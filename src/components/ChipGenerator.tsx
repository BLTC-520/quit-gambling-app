import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Clock, DollarSign, Zap } from 'lucide-react';

interface ChipGeneratorProps {
  rate: number; // $/hr
  symbols: string[];
  isAtStation: boolean;
  onEarned: (amount: number) => void;
  onLeave: () => void;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default function ChipGenerator({ rate, symbols, isAtStation, onEarned, onLeave }: ChipGeneratorProps) {
  const [earned, setEarned] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const lastFlushRef = useRef(0);
  const earnedRef = useRef(0);

  // Accumulate earnings every second while at station
  useEffect(() => {
    if (!isAtStation) return;

    const ratePerSecond = rate / 3600;
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
      setEarned(prev => {
        const next = prev + ratePerSecond;
        earnedRef.current = next;
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAtStation, rate]);

  // Flush earned chips to balance every $1 earned
  useEffect(() => {
    const wholeDollars = Math.floor(earned);
    if (wholeDollars > lastFlushRef.current) {
      const newDollars = wholeDollars - lastFlushRef.current;
      lastFlushRef.current = wholeDollars;
      onEarned(newDollars);
    }
  }, [earned, onEarned]);

  const progressToNextDollar = (earned % 1) * 100;
  const timeToNextDollar = rate > 0 ? Math.ceil((1 - (earned % 1)) / (rate / 3600)) : 0;

  if (!isAtStation) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4"
    >
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-2 border-amber-600/50 rounded-2xl p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-400" size={18} />
            <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">Work Station</span>
          </div>
          <div className="flex gap-1 text-lg">
            {symbols.map((s, i) => <span key={i}>{s}</span>)}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-black/40 rounded-xl p-2 text-center">
            <DollarSign className="mx-auto text-green-400 mb-1" size={14} />
            <p className="text-white font-mono font-bold text-lg">${earned.toFixed(2)}</p>
            <p className="text-neutral-500 text-[8px] uppercase">Earned</p>
          </div>
          <div className="bg-black/40 rounded-xl p-2 text-center">
            <Clock className="mx-auto text-blue-400 mb-1" size={14} />
            <p className="text-white font-mono font-bold text-sm">{formatTime(timeSpent)}</p>
            <p className="text-neutral-500 text-[8px] uppercase">Time</p>
          </div>
          <div className="bg-black/40 rounded-xl p-2 text-center">
            <Zap className="mx-auto text-amber-400 mb-1" size={14} />
            <p className="text-white font-mono font-bold text-sm">${rate.toFixed(2)}</p>
            <p className="text-neutral-500 text-[8px] uppercase">Per Hour</p>
          </div>
        </div>

        {/* Progress to next dollar */}
        <div className="mb-3">
          <div className="flex justify-between text-[9px] text-neutral-500 mb-1">
            <span>Next $1 in {formatTime(timeToNextDollar)}</span>
            <span>{progressToNextDollar.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-black/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
              style={{ width: `${progressToNextDollar}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Message */}
        <p className="text-neutral-500 text-[10px] text-center italic mb-3">
          Stay at the station to keep earning. Move away to stop.
        </p>

        <button
          onClick={onLeave}
          className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs font-bold rounded-xl transition-colors"
        >
          LEAVE STATION
        </button>
      </div>
    </motion.div>
  );
}
