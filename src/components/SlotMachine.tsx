import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SLOT_SYMBOLS, pickWeightedSymbol } from '../lib/slotSymbols';

interface SlotMachineProps {
  onRateDecided: (rate: number, symbols: string[]) => void;
  onClose: () => void;
}

const SYMBOLS = SLOT_SYMBOLS;
const REEL_COUNT = 5;
const ROW_COUNT = 3;

interface SlotResult {
  readonly grid: string[][]; // [row][col]
  readonly payline: string[]; // middle row
  readonly rate: number;
  readonly label: string;
}

function pickSymbol(): string {
  return pickWeightedSymbol();
}

function spinReels(): SlotResult {
  const grid: string[][] = [];
  for (let r = 0; r < ROW_COUNT; r++) {
    const row: string[] = [];
    for (let c = 0; c < REEL_COUNT; c++) {
      row.push(pickSymbol());
    }
    grid.push(row);
  }

  const payline = grid[1]; // middle row

  // Count consecutive matches from left on payline
  let consecutive = 1;
  for (let i = 1; i < payline.length; i++) {
    if (payline[i] === payline[0]) {
      consecutive++;
    } else {
      break;
    }
  }

  const symbolBase: Record<string, number> = {
    '🍋': 0.5,
    '🪙': 0.8,
    '❤️': 1.2,
    '💎': 1.8,
    '💣': 2.4,
    '💠': 3.2,
    '🎩': 4.0,
    '💰': 5.5,
    '7️⃣': 8.0,
  };

  const base = symbolBase[payline[0]] ?? 0.5;

  if (consecutive === 5) {
    return {
      grid,
      payline,
      rate: Math.round(base * 2.5 * 100) / 100,
      label: `MEGA JACKPOT — $${(base * 2.5).toFixed(2)}/hr`,
    };
  }
  if (consecutive === 4) {
    return {
      grid,
      payline,
      rate: Math.round(base * 1.5 * 100) / 100,
      label: `BIG WIN — $${(base * 1.5).toFixed(2)}/hr`,
    };
  }
  if (consecutive === 3) {
    return {
      grid,
      payline,
      rate: Math.round(base * 100) / 100,
      label: `TRIPLE — $${base.toFixed(2)}/hr`,
    };
  }
  if (consecutive === 2) {
    return {
      grid,
      payline,
      rate: 0.25,
      label: 'PAIR — $0.25/hr',
    };
  }

  return {
    grid,
    payline,
    rate: 0.1,
    label: 'NO MATCH — $0.10/hr',
  };
}

function makeBlankGrid(): string[][] {
  return Array.from({ length: ROW_COUNT }, () =>
    Array.from({ length: REEL_COUNT }, () => '❓')
  );
}

export default function SlotMachine({ onRateDecided, onClose }: SlotMachineProps) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SlotResult | null>(null);
  const [displayGrid, setDisplayGrid] = useState<string[][]>(makeBlankGrid);
  const [stoppedReels, setStoppedReels] = useState<number>(0);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setStoppedReels(0);

    const finalResult = spinReels();

    let tick = 0;
    const interval = setInterval(() => {
      tick++;

      setDisplayGrid(prev => {
        const next = prev.map(row => [...row]);
        for (let c = 0; c < REEL_COUNT; c++) {
          const stopTick = 8 + c * 4; // each reel stops 4 ticks after the previous
          if (tick >= stopTick) {
            for (let r = 0; r < ROW_COUNT; r++) {
              next[r][c] = finalResult.grid[r][c];
            }
          } else {
            for (let r = 0; r < ROW_COUNT; r++) {
              next[r][c] = pickSymbol();
            }
          }
        }
        return next;
      });

      const reelsStopped = Math.min(
        REEL_COUNT,
        Math.max(0, Math.floor((tick - 8) / 4) + 1)
      );
      setStoppedReels(reelsStopped);

      if (tick >= 8 + (REEL_COUNT - 1) * 4 + 2) {
        clearInterval(interval);
        setDisplayGrid(finalResult.grid);
        setResult(finalResult);
        setSpinning(false);
        setStoppedReels(REEL_COUNT);
      }
    }, 70);
  }, [spinning]);

  const handleConfirm = useCallback(() => {
    if (!result) return;
    onRateDecided(result.rate, result.payline);
  }, [result, onRateDecided]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 md:p-4"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-3xl bg-gradient-to-b from-purple-900 via-purple-950 to-indigo-950 border-4 border-yellow-500 rounded-3xl p-4 md:p-6 shadow-[0_0_60px_rgba(234,179,8,0.4)]"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-purple-800/60 hover:bg-purple-700 text-purple-200 hover:text-white text-sm font-bold z-10 border border-purple-600"
          aria-label="Close slot machine"
        >
          ✕
        </button>

        {/* Header — BUY COINS style */}
        <div className="flex justify-center mb-4">
          <div className="relative flex items-center gap-3 bg-gradient-to-b from-yellow-400 to-yellow-600 px-6 py-2 rounded-full border-2 border-yellow-300 shadow-lg">
            <span className="text-2xl">🪙</span>
            <h2 className="text-lg md:text-2xl font-black text-purple-950 tracking-wider drop-shadow">
              EARNING RATE
            </h2>
            <div className="bg-purple-900 text-yellow-300 font-mono font-bold text-xs md:text-sm px-3 py-1 rounded-full border border-yellow-400">
              {result ? `$${result.rate.toFixed(2)}/hr` : '— —'}
            </div>
          </div>
        </div>

        {/* Reels frame */}
        <div className="bg-gradient-to-b from-indigo-950 to-purple-950 rounded-2xl border-4 border-yellow-600 p-2 md:p-3 shadow-inner">
          <div className="grid grid-cols-5 gap-1 md:gap-2 relative">
            {Array.from({ length: REEL_COUNT }).map((_, col) => {
              const isReelSpinning = spinning && stoppedReels <= col;
              return (
                <div
                  key={col}
                  className="bg-gradient-to-b from-purple-800/40 via-indigo-900/40 to-purple-800/40 rounded-lg border border-purple-700/60 overflow-hidden"
                >
                  {Array.from({ length: ROW_COUNT }).map((_, row) => {
                    const symbol = displayGrid[row]?.[col] ?? '❓';
                    const isPayline = row === 1;
                    return (
                      <motion.div
                        key={row}
                        animate={isReelSpinning ? { y: [0, -6, 6, 0] } : { y: 0 }}
                        transition={
                          isReelSpinning
                            ? { duration: 0.12, repeat: Infinity }
                            : { type: 'spring', stiffness: 300 }
                        }
                        className={`aspect-square flex items-center justify-center ${
                          isPayline ? 'bg-yellow-500/10' : ''
                        } ${row < ROW_COUNT - 1 ? 'border-b border-purple-700/40' : ''}`}
                      >
                        <span className="text-2xl md:text-4xl drop-shadow-lg select-none">
                          {symbol}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}

            {/* Payline indicator */}
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-yellow-400/30" />
          </div>
        </div>

        {/* Result label */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`mt-3 py-2 px-4 rounded-xl font-black text-sm md:text-base text-center ${
                result.rate >= 8
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                  : result.rate >= 3
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                  : result.rate >= 0.5
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}
            >
              {result.label}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls bar */}
        <div className="mt-4 flex items-center gap-3 md:gap-4">
          {/* Payout info (left) */}
          <div className="flex-1 bg-purple-950/80 border-2 border-yellow-600/60 rounded-2xl px-3 md:px-4 py-2 md:py-3">
            <p className="text-[9px] md:text-[10px] text-yellow-400 font-bold uppercase tracking-wider text-center">
              Payline (middle row)
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {(result?.payline ?? ['?', '?', '?', '?', '?']).map((s, i) => (
                <span key={i} className="text-lg md:text-xl">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* SPIN button (right) — big circular */}
          <div className="relative">
            <motion.button
              onClick={result ? handleConfirm : handleSpin}
              disabled={spinning}
              whileTap={{ scale: 0.92 }}
              className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full font-black text-white text-base md:text-lg shadow-[0_6px_0_rgba(0,0,0,0.4),0_0_30px_rgba(239,68,68,0.5)] border-4 transition-colors ${
                spinning
                  ? 'bg-neutral-700 border-neutral-600 cursor-not-allowed'
                  : result
                  ? 'bg-gradient-to-b from-green-400 to-green-600 border-green-300 hover:from-green-300 hover:to-green-500'
                  : 'bg-gradient-to-b from-red-500 to-red-700 border-red-300 hover:from-red-400 hover:to-red-600'
              }`}
              aria-label={result ? 'Confirm rate' : 'Spin reels'}
            >
              <span className="absolute inset-0 rounded-full bg-white/10 blur-sm" />
              <span className="relative drop-shadow-md">
                {spinning ? '...' : result ? 'START' : 'SPIN'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Secondary action — spin again */}
        {result && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={handleSpin}
              className="text-xs md:text-sm text-purple-300 hover:text-yellow-300 underline underline-offset-2 font-semibold"
            >
              Spin again
            </button>
          </div>
        )}

        <p className="text-center text-[10px] md:text-xs text-purple-400 mt-3">
          Spin to decide how fast you earn chips at the work station.
        </p>
      </motion.div>
    </motion.div>
  );
}
