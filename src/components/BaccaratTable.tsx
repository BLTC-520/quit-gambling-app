
import React, { useState, useEffect } from 'react';
import { Card, BetType } from '../types';
import { createDeck, shuffleDeck, calculateScore, shouldPlayerDraw, shouldBankerDraw } from '../lib/baccarat';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, RotateCcw, X, TrendingDown } from 'lucide-react';
import { getAffordableItems } from '../lib/items';

interface BaccaratTableProps {
  balance: number;
  totalLost: number;
  onUpdateBalance: (newBalance: number, lostAmount: number) => void;
  onClose: () => void;
}

export default function BaccaratTable({ balance, totalLost, onUpdateBalance, onClose }: BaccaratTableProps) {
  const affordableItems = getAffordableItems(totalLost);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const deal = async () => {
    if (!selectedBet || isDealing || balance < betAmount) return;

    setIsDealing(true);
    setGameResult(null);
    setPlayerHand([]);
    setBankerHand([]);

    let deck = shuffleDeck(createDeck());
    
    const p1 = deck.pop()!;
    const b1 = deck.pop()!;
    const p2 = deck.pop()!;
    const b2 = deck.pop()!;

    setPlayerHand([p1]);
    await new Promise(r => setTimeout(r, 500));
    setBankerHand([b1]);
    await new Promise(r => setTimeout(r, 500));
    setPlayerHand([p1, p2]);
    await new Promise(r => setTimeout(r, 500));
    setBankerHand([b1, b2]);
    await new Promise(r => setTimeout(r, 500));

    let pHand = [p1, p2];
    let bHand = [b1, b2];
    let pScore = calculateScore(pHand);
    let bScore = calculateScore(bHand);

    if (pScore < 8 && bScore < 8) {
      let p3: Card | null = null;
      if (shouldPlayerDraw(pScore)) {
        p3 = deck.pop()!;
        pHand.push(p3);
        setPlayerHand([...pHand]);
        await new Promise(r => setTimeout(r, 500));
        pScore = calculateScore(pHand);
      }

      if (shouldBankerDraw(bScore, p3 ? p3.value : null)) {
        const b3 = deck.pop()!;
        bHand.push(b3);
        setBankerHand([...bHand]);
        await new Promise(r => setTimeout(r, 500));
        bScore = calculateScore(bHand);
      }
    }

    let result: BetType;
    if (pScore > bScore) result = 'player';
    else if (bScore > pScore) result = 'banker';
    else result = 'tie';

    setGameResult(result);
    setHistory(prev => [result[0].toUpperCase(), ...prev].slice(0, 20));

    let winAmount = 0;
    let lostAmount = 0;
    if (selectedBet === result) {
      if (result === 'player') winAmount = betAmount * 2;
      else if (result === 'banker') winAmount = betAmount * 1.95;
      else winAmount = betAmount * 9;
      onUpdateBalance(balance - betAmount + winAmount, 0);
    } else {
      lostAmount = betAmount;
      onUpdateBalance(balance - betAmount, lostAmount);
    }

    setIsDealing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 md:p-4 overflow-y-auto"
      onClick={onClose}
      role="button"
      tabIndex={-1}
      aria-label="Close table"
    >
      <div
        className="relative w-full max-w-5xl bg-emerald-900 border-4 md:border-8 border-amber-900 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-2xl overflow-hidden min-h-[600px] md:min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close baccarat table"
          className="absolute top-3 right-3 md:top-5 md:right-5 z-[70] bg-red-600 hover:bg-red-500 text-white p-2 rounded-full transition-colors shadow-lg border-2 border-red-300"
        >
          <X size={22} />
        </button>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="flex flex-col lg:flex-row gap-4 md:gap-8 h-full relative">
          {/* Main Table Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex gap-1 mb-4 md:mb-8 overflow-x-auto pb-2">
              {history.map((h, i) => (
                <div key={i} className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] md:text-[10px] font-bold ${
                  h === 'P' ? 'bg-blue-600' : h === 'B' ? 'bg-red-600' : 'bg-green-600'
                } text-white`}>
                  {h}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-12 mb-8 md:mb-12">
              <div className="text-center space-y-2 md:space-y-4">
                <h3 className="text-blue-400 font-bold tracking-widest uppercase text-xs md:text-base">Player</h3>
                <div className="h-28 md:h-40 flex justify-center items-center gap-1 md:gap-2">
                  <AnimatePresence>
                    {playerHand.map((card, i) => (
                      <motion.div
                        key={`${i}-${card.rank}-${card.suit}`}
                        initial={{ y: -50, opacity: 0, rotate: -10 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        className="w-16 h-24 md:w-24 md:h-36 bg-white rounded-md md:rounded-lg shadow-xl flex flex-col p-1 md:p-2 border border-neutral-300"
                      >
                        <div className={`text-xs md:text-lg font-bold ${['hearts', 'diamonds'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>
                          {card.rank}
                        </div>
                        <div className="flex-1 flex items-center justify-center text-xl md:text-3xl">
                          {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="text-2xl md:text-4xl font-mono text-white bg-black/30 py-1 md:py-2 rounded-lg">
                  {calculateScore(playerHand)}
                </div>
              </div>

              <div className="text-center space-y-2 md:space-y-4">
                <h3 className="text-red-400 font-bold tracking-widest uppercase text-xs md:text-base">Banker</h3>
                <div className="h-28 md:h-40 flex justify-center items-center gap-1 md:gap-2">
                  <AnimatePresence>
                    {bankerHand.map((card, i) => (
                      <motion.div
                        key={`${i}-${card.rank}-${card.suit}`}
                        initial={{ y: -50, opacity: 0, rotate: 10 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        className="w-16 h-24 md:w-24 md:h-36 bg-white rounded-md md:rounded-lg shadow-xl flex flex-col p-1 md:p-2 border border-neutral-300"
                      >
                        <div className={`text-xs md:text-lg font-bold ${['hearts', 'diamonds'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>
                          {card.rank}
                        </div>
                        <div className="flex-1 flex items-center justify-center text-xl md:text-3xl">
                          {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="text-2xl md:text-4xl font-mono text-white bg-black/30 py-1 md:py-2 rounded-lg">
                  {calculateScore(bankerHand)}
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-4 md:space-y-8">
              <div className="flex justify-center gap-2 md:gap-4">
                {['player', 'tie', 'banker'].map((type) => (
                  <button
                    key={type}
                    disabled={isDealing}
                    onClick={() => setSelectedBet(type as BetType)}
                    className={`px-4 md:px-8 py-3 md:py-6 rounded-xl md:rounded-2xl border-2 md:border-4 transition-all transform active:scale-95 ${
                      selectedBet === type ? 'border-yellow-400 scale-105 shadow-yellow-400/50 shadow-lg' : 'border-emerald-700'
                    } ${type === 'player' ? 'bg-blue-700' : type === 'banker' ? 'bg-red-700' : 'bg-green-700'} text-white font-bold`}
                  >
                    <div className="text-sm md:text-xl uppercase">{type}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between bg-black/40 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-emerald-700 gap-4">
                <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                  <Coins className="text-yellow-500" size={24} md:size={32} />
                  <div>
                    <p className="text-emerald-400 text-[8px] md:text-xs uppercase font-bold">Balance</p>
                    <p className="text-xl md:text-3xl font-mono text-white">${balance.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 w-full sm:w-auto">
                  <p className="text-emerald-400 text-[8px] md:text-[10px] uppercase font-bold">Bet Amount</p>
                  <div className="flex items-center gap-2 w-full justify-center">
                    <input 
                      type="number" 
                      min="1"
                      max={balance}
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                      disabled={isDealing}
                      className="w-20 md:w-24 bg-black/60 border-2 border-emerald-700 rounded-lg md:rounded-xl px-2 md:px-3 py-1 md:py-2 text-white font-mono text-lg md:text-xl text-center focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                    <button
                      disabled={isDealing || balance <= 0}
                      onClick={() => setBetAmount(balance)}
                      className="px-2 md:px-3 py-1 md:py-2 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 text-white text-[8px] md:text-[10px] font-black rounded-lg transition-all shadow-lg active:scale-95"
                    >
                      ALL IN
                    </button>
                  </div>
                </div>

                <button
                  disabled={isDealing || !selectedBet || balance < betAmount}
                  onClick={deal}
                  className="w-full sm:w-auto px-8 md:px-12 py-3 md:py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 text-black font-black text-lg md:text-2xl rounded-xl md:rounded-2xl transition-all shadow-lg"
                >
                  {isDealing ? 'DEALING...' : 'DEAL'}
                </button>
              </div>
            </div>
          </div>

          {/* Reality Check Sidebar inside Table */}
          <div className="w-full lg:w-72 bg-black/40 rounded-2xl md:rounded-3xl border border-emerald-700/50 p-4 md:p-6 flex flex-col shadow-inner">
            <h4 className="text-emerald-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
              <TrendingDown size={14} />
              Reality Check
            </h4>
            <div className="space-y-3 md:space-y-4 overflow-y-auto pr-2 flex-1 max-h-[200px] lg:max-h-none">
              {affordableItems.slice(0, 5).map(item => (
                <div key={item.name} className="bg-emerald-950/30 p-3 md:p-4 rounded-xl border border-emerald-900/50">
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <span className="text-xl md:text-2xl">{item.icon}</span>
                    <span className="text-white font-bold text-base md:text-lg">x{item.count}</span>
                  </div>
                  <p className="text-[8px] md:text-[10px] text-emerald-200/50 uppercase font-bold truncate">{item.name}</p>
                  <div className="h-1 w-full bg-emerald-900 rounded-full mt-1 md:mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-emerald-800">
              <p className="text-[8px] md:text-[10px] text-emerald-400 uppercase font-bold mb-1">Total Lost</p>
              <p className="text-xl md:text-2xl font-mono text-white">${totalLost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Result Overlay */}
        <AnimatePresence>
          {gameResult && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
            >
              <div className={`text-8xl font-black italic uppercase tracking-tighter drop-shadow-2xl ${
                gameResult === 'player' ? 'text-blue-500' : gameResult === 'banker' ? 'text-red-500' : 'text-green-500'
              }`}>
                {gameResult} WINS
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
