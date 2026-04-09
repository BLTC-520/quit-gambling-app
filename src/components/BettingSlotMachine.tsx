import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coins, TrendingDown, Info } from 'lucide-react';
import {
  spinGrid,
  evaluateSpin,
  PAYLINES,
  PAYOUT_TABLE,
  REEL_COUNT,
  ROW_COUNT,
  TARGET_RTP_PERCENT,
} from '../lib/slotEngine';
import { pickWeightedSymbol, SLOT_SYMBOLS } from '../lib/slotSymbols';
import type { SlotSpinResult } from '../types';

interface BettingSlotMachineProps {
  balance: number;
  totalLost: number;
  onUpdateBalance: (newBalance: number, lostAmount: number) => void;
  onClose: () => void;
}

const MIN_BET_PER_LINE = 1;
const MAX_BET_PER_LINE = 10;
const DEFAULT_BET_PER_LINE = 1;
const TOTAL_LINES = PAYLINES.length;

function makeBlankGrid(): string[][] {
  return Array.from({ length: ROW_COUNT }, () =>
    Array.from({ length: REEL_COUNT }, () => '❓')
  );
}

export default function BettingSlotMachine({
  balance,
  totalLost,
  onUpdateBalance,
  onClose,
}: BettingSlotMachineProps) {
  const [betPerLine, setBetPerLine] = useState<number>(DEFAULT_BET_PER_LINE);
  const [displayGrid, setDisplayGrid] = useState<string[][]>(makeBlankGrid);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SlotSpinResult | null>(null);
  const [showPayouts, setShowPayouts] = useState(false);
  const [highlightCycleIdx, setHighlightCycleIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalBet = betPerLine * TOTAL_LINES;
  const canSpin = !spinning && balance >= totalBet && totalBet > 0;

  // Cycle through winning lines one-at-a-time so users can read each one
  useEffect(() => {
    if (!lastResult || lastResult.winningLines.length <= 1) return;
    const id = setInterval(() => {
      setHighlightCycleIdx(i => (i + 1) % lastResult.winningLines.length);
    }, 1400);
    return () => clearInterval(id);
  }, [lastResult]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const adjustBet = useCallback((delta: number) => {
    if (spinning) return;
    setBetPerLine(prev => {
      const next = prev + delta;
      if (next < MIN_BET_PER_LINE) return MIN_BET_PER_LINE;
      if (next > MAX_BET_PER_LINE) return MAX_BET_PER_LINE;
      return next;
    });
  }, [spinning]);

  const handleMaxBet = useCallback(() => {
    if (spinning) return;
    const maxAffordable = Math.floor(balance / TOTAL_LINES);
    const capped = Math.min(MAX_BET_PER_LINE, Math.max(MIN_BET_PER_LINE, maxAffordable));
    setBetPerLine(capped);
  }, [spinning, balance]);

  const handleSpin = useCallback(() => {
    if (!canSpin) return;

    setSpinning(true);
    setLastResult(null);
    setHighlightCycleIdx(0);

    const finalGrid = spinGrid();
    const result = evaluateSpin(finalGrid, betPerLine, PAYLINES);

    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      setDisplayGrid(prev => {
        const next = prev.map(row => [...row]);
        for (let c = 0; c < REEL_COUNT; c++) {
          const stopTick = 8 + c * 4;
          if (tick >= stopTick) {
            for (let r = 0; r < ROW_COUNT; r++) {
              next[r][c] = finalGrid[r][c];
            }
          } else {
            for (let r = 0; r < ROW_COUNT; r++) {
              next[r][c] = pickWeightedSymbol();
            }
          }
        }
        return next;
      });

      if (tick >= 8 + (REEL_COUNT - 1) * 4 + 2) {
        clearInterval(interval);
        intervalRef.current = null;
        setDisplayGrid(finalGrid.map(row => [...row]));
        setLastResult(result);
        setSpinning(false);

        // Bookkeep balance atomically: deduct bet, add winnings.
        const newBalance = balance - totalBet + result.totalWin;
        const lostAmount = Math.max(0, totalBet - result.totalWin);
        onUpdateBalance(newBalance, lostAmount);
      }
    }, 70);
    intervalRef.current = interval;
  }, [canSpin, betPerLine, balance, totalBet, onUpdateBalance]);

  // Convert a payline's row indices into SVG polyline points using
  // percentage coordinates (viewBox 0 0 100 100) so the overlay scales
  // with the grid at any size.
  const paylineToPoints = useCallback((rows: readonly number[]): string => {
    const cellW = 100 / REEL_COUNT;
    const cellH = 100 / ROW_COUNT;
    return rows
      .map((row, col) => {
        const x = col * cellW + cellW / 2;
        const y = row * cellH + cellH / 2;
        return `${x},${y}`;
      })
      .join(' ');
  }, []);

  // Set of winning payline IDs — used to light up ALL winning lines
  // simultaneously (not cycle).
  const winningPaylineIds = useMemo(() => {
    if (!lastResult) return new Set<number>();
    return new Set(lastResult.winningLines.map(w => w.paylineId));
  }, [lastResult]);

  // Set of winning cells across ALL winning paylines. Used to pulse the
  // affected cells at once.
  const winningCells = useMemo(() => {
    const cells = new Set<string>(); // key = `${row}-${col}`
    if (!lastResult) return cells;
    for (const win of lastResult.winningLines) {
      const payline = PAYLINES.find(p => p.id === win.paylineId);
      if (!payline) continue;
      // Only the first `count` reels contributed to this win.
      for (let col = 0; col < win.count; col++) {
        cells.add(`${payline.rows[col]}-${col}`);
      }
    }
    return cells;
  }, [lastResult]);

  // The line currently featured in the detail text (cycled every 1.4s).
  const activeHighlight = useMemo(() => {
    if (!lastResult || lastResult.winningLines.length === 0) return null;
    return lastResult.winningLines[highlightCycleIdx] ?? lastResult.winningLines[0];
  }, [lastResult, highlightCycleIdx]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 md:p-4 overflow-y-auto"
      onClick={onClose}
      role="button"
      tabIndex={-1}
      aria-label="Close slot machine"
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-gradient-to-b from-purple-900 via-purple-950 to-indigo-950 border-4 border-yellow-500 rounded-3xl p-4 md:p-6 shadow-[0_0_60px_rgba(234,179,8,0.4)]"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close slot machine"
          className="absolute top-3 right-3 md:top-4 md:right-4 z-[70] w-9 h-9 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white border-2 border-red-300 shadow-lg transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 pr-10">
          <div className="flex items-center gap-3 bg-gradient-to-b from-yellow-400 to-yellow-600 px-5 py-2 rounded-full border-2 border-yellow-300 shadow-lg">
            <span className="text-2xl">🎰</span>
            <h2 className="text-base md:text-xl font-black text-purple-950 tracking-wider drop-shadow">
              SLOT MACHINE
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/40 border border-yellow-600/50 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Coins size={16} className="text-yellow-400" />
              <div>
                <p className="text-[8px] text-yellow-400 uppercase font-bold leading-none">Balance</p>
                <p className="text-sm md:text-base text-white font-mono font-bold">${balance.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-red-950/40 border border-red-700/50 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-400" />
              <div>
                <p className="text-[8px] text-red-400 uppercase font-bold leading-none">Lost</p>
                <p className="text-sm md:text-base text-white font-mono font-bold">${totalLost.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RTP notice */}
        <div className="mb-3 flex items-start gap-2 bg-amber-950/40 border border-amber-700/40 rounded-lg px-3 py-2">
          <Info size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] md:text-xs text-amber-200 leading-snug">
            <span className="font-bold">RTP ~{TARGET_RTP_PERCENT}%:</span> for every $100 you
            bet across many spins, the machine pays back about ${TARGET_RTP_PERCENT} on average.
            The missing ${100 - TARGET_RTP_PERCENT} is the house edge — and the whole reason
            casinos always win in the long run.
          </p>
        </div>

        {/* Reels frame */}
        <div className="relative bg-gradient-to-b from-indigo-950 to-purple-950 rounded-2xl border-4 border-yellow-600 p-2 md:p-3 shadow-inner">
          <div className="relative grid grid-cols-5 gap-1 md:gap-2">
            {Array.from({ length: REEL_COUNT }).map((_, col) => {
              const stopTickForReel = 8 + col * 4;
              const isReelSpinning = spinning;
              return (
                <div
                  key={col}
                  className="bg-gradient-to-b from-purple-800/40 via-indigo-900/40 to-purple-800/40 rounded-lg border border-purple-700/60 overflow-hidden"
                >
                  {Array.from({ length: ROW_COUNT }).map((_, row) => {
                    const symbol = displayGrid[row]?.[col] ?? '❓';
                    const isWinningCell = winningCells.has(`${row}-${col}`);
                    return (
                      <motion.div
                        key={row}
                        animate={isReelSpinning ? { y: [0, -6, 6, 0] } : { y: 0 }}
                        transition={
                          isReelSpinning
                            ? { duration: 0.12, repeat: Infinity }
                            : { type: 'spring', stiffness: 300 }
                        }
                        className={`aspect-square flex items-center justify-center relative ${
                          row < ROW_COUNT - 1 ? 'border-b border-purple-700/40' : ''
                        }`}
                      >
                        {/* Winning cell pulse border */}
                        {isWinningCell && !spinning && (
                          <motion.div
                            animate={{
                              boxShadow: [
                                '0 0 0px 0px rgba(250,204,21,0.8)',
                                '0 0 20px 4px rgba(250,204,21,0.9)',
                                '0 0 0px 0px rgba(250,204,21,0.8)',
                              ],
                            }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="absolute inset-0.5 rounded-md border-2 border-yellow-300 pointer-events-none"
                          />
                        )}
                        <span className="text-2xl md:text-4xl drop-shadow-lg select-none relative z-10">
                          {symbol}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}

            {/* Payline overlay — faint guides for all 10 lines always,
                bright gold for winning lines after a spin. */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {/* Faint guide lines for every non-winning payline,
                  always visible so players see the patterns available. */}
              {!spinning && PAYLINES.map((payline, i) => {
                if (winningPaylineIds.has(payline.id)) return null;
                return (
                  <polyline
                    key={`guide-${payline.id}`}
                    points={paylineToPoints(payline.rows)}
                    fill="none"
                    stroke={`hsla(${(i * 36) % 360}, 75%, 65%, 0.22)`}
                    strokeWidth={0.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {/* Winning lines — bright animated polylines */}
              {!spinning && lastResult && lastResult.winningLines.map((win) => {
                const payline = PAYLINES.find(p => p.id === win.paylineId);
                if (!payline) return null;
                // Only draw the portion of the payline that actually won
                // (first `count` reels).
                const winningRows = payline.rows.slice(0, win.count);
                return (
                  <motion.polyline
                    key={`win-${win.paylineId}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    points={paylineToPoints(winningRows)}
                    fill="none"
                    stroke="rgba(250, 204, 21, 0.95)"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      filter: 'drop-shadow(0 0 2px rgba(250,204,21,0.9))',
                    }}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Result banner */}
        <div className="h-10 mt-3 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {lastResult && lastResult.totalWin > 0 ? (
              <motion.div
                key="win"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="px-6 py-2 rounded-xl font-black text-base md:text-lg bg-green-500/20 text-green-300 border-2 border-green-400/60 shadow-lg"
              >
                +${lastResult.totalWin.toLocaleString()} WIN
                {lastResult.winningLines.length > 1 && (
                  <span className="ml-2 text-xs text-green-200">
                    ({lastResult.winningLines.length} lines)
                  </span>
                )}
              </motion.div>
            ) : lastResult ? (
              <motion.div
                key="lose"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="px-6 py-2 rounded-xl font-bold text-sm bg-red-500/10 text-red-300 border border-red-500/40"
              >
                −${totalBet.toLocaleString()} — No match
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Winning line detail */}
        {activeHighlight && !spinning && (
          <div className="text-center text-xs md:text-sm text-yellow-200 mb-2">
            <span className="font-bold">
              {PAYLINES.find(p => p.id === activeHighlight.paylineId)?.name}
            </span>
            {' — '}
            <span>
              {activeHighlight.count}× {activeHighlight.symbol}
            </span>
            {' = '}
            <span className="font-mono font-bold text-yellow-300">
              ${activeHighlight.payout}
            </span>
            {lastResult && lastResult.winningLines.length > 1 && (
              <span className="text-purple-300 ml-1">
                ({highlightCycleIdx + 1}/{lastResult.winningLines.length})
              </span>
            )}
          </div>
        )}

        {/* Controls bar */}
        <div className="flex items-stretch gap-3 md:gap-4">
          {/* Bet controls */}
          <div className="flex-1 bg-purple-950/80 border-2 border-yellow-600/60 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-around gap-3">
            <div className="text-center">
              <p className="text-[9px] md:text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                Bet / Line
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => adjustBet(-1)}
                  disabled={spinning || betPerLine <= MIN_BET_PER_LINE}
                  className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 text-white font-black shadow-md flex items-center justify-center"
                  aria-label="Decrease bet"
                >
                  −
                </button>
                <span className="text-white font-mono font-bold text-lg md:text-xl min-w-[2ch] text-center">
                  ${betPerLine}
                </span>
                <button
                  type="button"
                  onClick={() => adjustBet(1)}
                  disabled={spinning || betPerLine >= MAX_BET_PER_LINE}
                  className="w-7 h-7 rounded-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-black shadow-md flex items-center justify-center"
                  aria-label="Increase bet"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[9px] md:text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                Lines
              </p>
              <p className="text-white font-mono font-bold text-lg md:text-xl mt-1">
                {TOTAL_LINES}
              </p>
            </div>

            <div className="text-center">
              <p className="text-[9px] md:text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                Total Bet
              </p>
              <p className="text-white font-mono font-bold text-lg md:text-xl mt-1">
                ${totalBet}
              </p>
            </div>

            <button
              type="button"
              onClick={handleMaxBet}
              disabled={spinning}
              className="px-3 py-2 bg-gradient-to-b from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 disabled:from-neutral-700 disabled:to-neutral-800 text-white font-black text-xs md:text-sm rounded-xl border-2 border-orange-300 shadow-md"
            >
              MAX BET
            </button>
          </div>

          {/* SPIN button */}
          <motion.button
            type="button"
            onClick={handleSpin}
            disabled={!canSpin}
            whileTap={{ scale: 0.92 }}
            className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full font-black text-white text-base md:text-lg shadow-[0_6px_0_rgba(0,0,0,0.4),0_0_30px_rgba(239,68,68,0.5)] border-4 transition-colors flex-shrink-0 ${
              !canSpin
                ? 'bg-neutral-700 border-neutral-600 cursor-not-allowed'
                : 'bg-gradient-to-b from-red-500 to-red-700 border-red-300 hover:from-red-400 hover:to-red-600'
            }`}
            aria-label="Spin reels"
          >
            <span className="absolute inset-0 rounded-full bg-white/10 blur-sm" />
            <span className="relative drop-shadow-md">
              {spinning ? '...' : 'SPIN'}
            </span>
          </motion.button>
        </div>

        {/* Payout table accordion */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPayouts(s => !s)}
            className="w-full text-left text-[10px] md:text-xs text-purple-300 hover:text-yellow-300 font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <span>{showPayouts ? '▼' : '▶'}</span>
            Payout table
          </button>
          <AnimatePresence>
            {showPayouts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-black/40 rounded-xl p-3 border border-purple-700/40">
                  <div className="grid grid-cols-4 gap-2 text-[10px] md:text-xs">
                    <div className="text-purple-400 font-bold">Symbol</div>
                    <div className="text-purple-400 font-bold text-right">×3</div>
                    <div className="text-purple-400 font-bold text-right">×4</div>
                    <div className="text-purple-400 font-bold text-right">×5</div>
                    {SLOT_SYMBOLS.map(sym => (
                      <div key={sym} className="contents">
                        <div className="text-lg md:text-xl">{sym}</div>
                        <div className="text-right text-purple-200 font-mono">
                          {PAYOUT_TABLE[sym][3]}×
                        </div>
                        <div className="text-right text-purple-200 font-mono">
                          {PAYOUT_TABLE[sym][4]}×
                        </div>
                        <div className="text-right text-yellow-300 font-mono font-bold">
                          {PAYOUT_TABLE[sym][5]}×
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-purple-400 mt-2">
                    Multipliers apply to bet-per-line. Matches must start from the leftmost reel.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
