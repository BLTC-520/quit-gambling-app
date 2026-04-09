import { useState, useCallback, useEffect } from 'react';
import PixelRoom from './components/PixelRoom';
import BaccaratTable from './components/BaccaratTable';
import BlackjackTable from './components/BlackjackTable';
import LossTracker from './components/LossTracker';
import MysteryBox from './components/MysteryBox';
import AuthScreen from './components/AuthScreen';
import SlotMachine from './components/SlotMachine';
import BettingSlotMachine from './components/BettingSlotMachine';
import ChipGenerator from './components/ChipGenerator';
import { AnimatePresence } from 'motion/react';
import { Wallet, Info, AlertCircle, TrendingDown, LogOut, Zap } from 'lucide-react';
import { api, type PlayerData } from './lib/api';

type AppPhase = 'auth' | 'mystery-box' | 'casino';

interface EarningState {
  readonly rate: number;
  readonly symbols: string[];
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('auth');
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalLost, setTotalLost] = useState(0);
  const [showBaccarat, setShowBaccarat] = useState(false);
  const [showBlackjack, setShowBlackjack] = useState(false);
  const [showBettingSlot, setShowBettingSlot] = useState(false);

  // Work station state
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [earningState, setEarningState] = useState<EarningState | null>(null);
  const [isAtStation, setIsAtStation] = useState(false);

  // Try to restore session on mount
  useEffect(() => {
    const token = api.getToken();
    if (!token) return;

    api.getMe()
      .then((data) => {
        setPlayer(data);
        setBalance(data.balance);
        setTotalLost(data.totalLost);
        if (data.mysteryBoxAmount !== null) {
          setPhase('casino');
        } else {
          setPhase('mystery-box');
        }
      })
      .catch(() => {
        api.clearToken();
      });
  }, []);

  const handleAuth = useCallback((playerData: PlayerData) => {
    setPlayer(playerData);
    setBalance(playerData.balance);
    setTotalLost(playerData.totalLost);

    if (playerData.mysteryBoxAmount !== null) {
      setPhase('casino');
    } else {
      setPhase('mystery-box');
    }
  }, []);

  const handleMysteryBoxReveal = useCallback((amount: number) => {
    setBalance(amount);
    setPhase('casino');

    api.setMysteryBox(amount).catch(() => {});
  }, []);

  const handleUpdateBalance = useCallback((newBalance: number, lostAmount: number) => {
    setBalance(newBalance);
    if (lostAmount > 0) {
      setTotalLost(prev => prev + lostAmount);
    }

    api.updateBalance(newBalance, lostAmount).catch(() => {});
  }, []);

  const handleLogout = useCallback(() => {
    api.clearToken();
    setPlayer(null);
    setBalance(0);
    setTotalLost(0);
    setEarningState(null);
    setIsAtStation(false);
    setPhase('auth');
  }, []);

  const handleEnterSlotMachine = useCallback(() => {
    if (showBaccarat || showBlackjack || showBettingSlot) return;
    setShowBettingSlot(true);
  }, [showBaccarat, showBlackjack, showBettingSlot]);

  // Work station handlers
  const handleEnterWorkStation = useCallback(() => {
    if (showBaccarat || showBlackjack) return; // Don't trigger while at a table

    if (!earningState) {
      // First time — show slot machine to determine rate
      setShowSlotMachine(true);
    } else {
      // Already have a rate — start earning
      setIsAtStation(true);
    }
  }, [earningState, showBaccarat, showBlackjack]);

  const handleRateDecided = useCallback((rate: number, symbols: string[]) => {
    setEarningState({ rate, symbols });
    setShowSlotMachine(false);
    setIsAtStation(true);
  }, []);

  const handleChipEarned = useCallback((amount: number) => {
    setBalance(prev => {
      const newBalance = prev + amount;
      api.updateBalance(newBalance, 0).catch(() => {});
      return newBalance;
    });
  }, []);

  const handleLeaveStation = useCallback(() => {
    setIsAtStation(false);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col lg:flex-row font-sans selection:bg-blue-500/30">
      {/* Main Game Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 relative overflow-hidden">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white flex items-center gap-3">
              <span className="bg-blue-600 px-2 py-1 rounded">CASINO</span>
              <span className="text-neutral-500">REALITY CHECK</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-neutral-400 text-xs md:text-sm">A simulation to help you understand the cost of gambling.</p>
              {player && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-neutral-600 hover:text-neutral-400 text-xs transition-colors"
                  title="Log out"
                >
                  <LogOut size={12} />
                  {player.nickname}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6 w-full sm:w-auto">
            {/* Earning rate badge */}
            {earningState && (
              <div className="hidden sm:flex items-center gap-1 bg-amber-900/20 px-3 py-1 rounded-full border border-amber-800/30">
                <Zap className="text-amber-400" size={12} />
                <span className="text-amber-400 text-[10px] font-mono font-bold">${earningState.rate.toFixed(2)}/hr</span>
              </div>
            )}

            <div className="flex-1 sm:flex-none bg-red-900/20 px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-red-900/30 flex items-center gap-2 md:gap-3 shadow-xl">
              <TrendingDown className="text-red-500" size={16} />
              <div>
                <p className="text-[8px] md:text-[10px] text-red-400 uppercase font-bold">Total Lost</p>
                <p className="text-lg md:text-2xl font-mono font-bold text-white">${totalLost.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex-1 sm:flex-none bg-neutral-900 px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-neutral-800 flex items-center gap-2 md:gap-3 shadow-xl">
              <Wallet className="text-blue-500" size={16} />
              <div>
                <p className="text-[8px] md:text-[10px] text-neutral-500 uppercase font-bold">Current Chips</p>
                <p className="text-lg md:text-2xl font-mono font-bold text-white">${balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-3xl">
            <PixelRoom
              onEnterBaccarat={() => setShowBaccarat(true)}
              onEnterBlackjack={() => setShowBlackjack(true)}
              onEnterWorkStation={handleEnterWorkStation}
              onLeaveWorkStation={handleLeaveStation}
              onEnterSlotMachine={handleEnterSlotMachine}
              isAtWorkStation={isAtStation}
            />

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-neutral-900/50 p-4 md:p-6 rounded-2xl border border-neutral-800">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Info size={18} />
                  <h3 className="font-bold uppercase text-sm">How to Play</h3>
                </div>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                  Walk your pixel character to a table to start playing.
                  Left = Baccarat, Right = Blackjack.
                </p>
              </div>

              <div className="bg-amber-900/10 p-4 md:p-6 rounded-2xl border border-amber-900/20">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Zap size={18} />
                  <h3 className="font-bold uppercase text-sm">Work Station</h3>
                </div>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                  Walk to the bottom station to earn chips.
                  Spin the slot to decide your earning rate!
                </p>
              </div>

              <div className="bg-red-900/10 p-4 md:p-6 rounded-2xl border border-red-900/20">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle size={18} />
                  <h3 className="font-bold uppercase text-sm">The Goal</h3>
                </div>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                  Every dollar you lose is tracked and converted into
                  real-world items you could have purchased instead.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Tables */}
        <AnimatePresence>
          {showBaccarat && (
            <BaccaratTable
              balance={balance}
              totalLost={totalLost}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setShowBaccarat(false)}
            />
          )}
          {showBlackjack && (
            <BlackjackTable
              balance={balance}
              totalLost={totalLost}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setShowBlackjack(false)}
            />
          )}
          {showBettingSlot && (
            <BettingSlotMachine
              balance={balance}
              totalLost={totalLost}
              onUpdateBalance={handleUpdateBalance}
              onClose={() => setShowBettingSlot(false)}
            />
          )}
        </AnimatePresence>

        {/* Slot Machine for earning rate */}
        <AnimatePresence>
          {showSlotMachine && (
            <SlotMachine
              onRateDecided={handleRateDecided}
              onClose={() => setShowSlotMachine(false)}
            />
          )}
        </AnimatePresence>

        {/* Chip Generator overlay */}
        <AnimatePresence>
          {earningState && isAtStation && (
            <ChipGenerator
              rate={earningState.rate}
              symbols={earningState.symbols}
              isAtStation={isAtStation}
              onEarned={handleChipEarned}
              onLeave={handleLeaveStation}
            />
          )}
        </AnimatePresence>

        {/* Auth Screen */}
        <AnimatePresence>
          {phase === 'auth' && (
            <AuthScreen onAuth={handleAuth} />
          )}
        </AnimatePresence>

        {/* Mystery Box */}
        <AnimatePresence>
          {phase === 'mystery-box' && (
            <MysteryBox onReveal={handleMysteryBoxReveal} />
          )}
        </AnimatePresence>
      </main>

      {/* Sidebar */}
      <LossTracker totalLost={totalLost} />
    </div>
  );
}
