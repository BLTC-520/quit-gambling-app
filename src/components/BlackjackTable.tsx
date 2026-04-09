
import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { createDeck, shuffleDeck } from '../lib/baccarat';
import { calculateBlackjackScore, isBust, isBlackjack } from '../lib/blackjack';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, X, TrendingDown, Hand, ShieldCheck, Play } from 'lucide-react';
import { getAffordableItems } from '../lib/items';

interface BlackjackTableProps {
  balance: number;
  totalLost: number;
  onUpdateBalance: (newBalance: number, lostAmount: number) => void;
  onClose: () => void;
}

export default function BlackjackTable({ balance, totalLost, onUpdateBalance, onClose }: BlackjackTableProps) {
  const affordableItems = getAffordableItems(totalLost);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [dealerHidden, setDealerHidden] = useState(true);

  const startNewGame = async () => {
    if (isDealing || balance < betAmount) return;

    setIsDealing(true);
    setGameResult(null);
    setDealerHidden(true);
    
    let newDeck = shuffleDeck(createDeck());
    
    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = newDeck.pop()!;

    setPlayerHand([p1]);
    await new Promise(r => setTimeout(r, 500));
    setDealerHand([d1]);
    await new Promise(r => setTimeout(r, 500));
    setPlayerHand([p1, p2]);
    await new Promise(r => setTimeout(r, 500));
    setDealerHand([d1, d2]);
    await new Promise(r => setTimeout(r, 500));

    const pScore = calculateBlackjackScore([p1, p2]);
    const dScore = calculateBlackjackScore([d1, d2]);

    setDeck(newDeck);

    if (pScore === 21 || dScore === 21) {
      endGame([p1, p2], [d1, d2], false);
    } else {
      setIsPlayerTurn(true);
      setIsDealing(false);
    }
  };

  const hit = async () => {
    if (!isPlayerTurn) return;

    const newCard = deck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck([...deck]);

    if (isBust(calculateBlackjackScore(newHand))) {
      endGame(newHand, dealerHand, true);
    }
  };

  const stand = async () => {
    if (!isPlayerTurn) return;
    setIsPlayerTurn(false);
    setIsDealing(true);
    setDealerHidden(false);

    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];

    while (calculateBlackjackScore(currentDealerHand) < 17) {
      await new Promise(r => setTimeout(r, 800));
      const newCard = currentDeck.pop()!;
      currentDealerHand.push(newCard);
      setDealerHand([...currentDealerHand]);
      setDeck([...currentDeck]);
    }

    endGame(playerHand, currentDealerHand, false);
  };

  const endGame = (pHand: Card[], dHand: Card[], playerBusted: boolean) => {
    setDealerHidden(false);
    setIsPlayerTurn(false);
    setIsDealing(false);

    const pScore = calculateBlackjackScore(pHand);
    const dScore = calculateBlackjackScore(dHand);
    const dIsBust = isBust(dScore);

    let result = '';
    let winAmount = 0;
    let lostAmount = 0;

    if (playerBusted) {
      result = 'DEALER WINS (BUST)';
      lostAmount = betAmount;
      onUpdateBalance(balance - betAmount, lostAmount);
    } else if (dIsBust) {
      result = 'PLAYER WINS (DEALER BUST)';
      winAmount = isBlackjack(pHand) ? betAmount * 2.5 : betAmount * 2;
      onUpdateBalance(balance - betAmount + winAmount, 0);
    } else if (pScore > dScore) {
      result = 'PLAYER WINS';
      winAmount = isBlackjack(pHand) ? betAmount * 2.5 : betAmount * 2;
      onUpdateBalance(balance - betAmount + winAmount, 0);
    } else if (dScore > pScore) {
      result = 'DEALER WINS';
      lostAmount = betAmount;
      onUpdateBalance(balance - betAmount, lostAmount);
    } else {
      result = 'PUSH';
      onUpdateBalance(balance, 0);
    }

    setGameResult(result);
    setHistory(prev => [result[0], ...prev].slice(0, 20));
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
        className="relative w-full max-w-5xl bg-blue-900 border-4 md:border-8 border-amber-900 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-2xl overflow-hidden min-h-[600px] md:min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close blackjack table"
          className="absolute top-3 right-3 md:top-5 md:right-5 z-[70] bg-red-600 hover:bg-red-500 text-white p-2 rounded-full transition-colors shadow-lg border-2 border-red-300"
        >
          <X size={22} />
        </button>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="flex flex-col lg:flex-row gap-4 md:gap-8 h-full relative">
          <div className="flex-1 flex flex-col">
            <div className="flex gap-1 mb-4 md:mb-8 overflow-x-auto pb-2">
              {history.map((h, i) => (
                <div key={i} className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] md:text-[10px] font-bold ${
                  h === 'P' || h === 'W' ? 'bg-blue-600' : h === 'D' || h === 'L' ? 'bg-red-600' : 'bg-green-600'
                } text-white`}>
                  {h}
                </div>
              ))}
            </div>

            <div className="flex-1 flex flex-col justify-around py-4 md:py-8">
              {/* Dealer Area */}
              <div className="text-center space-y-2 md:space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="text-red-400" size={16} md:size={20} />
                  <h3 className="text-red-400 font-bold tracking-widest uppercase text-xs md:text-base">Dealer</h3>
                </div>
                <div className="h-28 md:h-40 flex justify-center items-center gap-1 md:gap-2">
                  <AnimatePresence>
                    {dealerHand.map((card, i) => (
                      <motion.div
                        key={`${i}-${card.rank}-${card.suit}`}
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={`w-16 h-24 md:w-24 md:h-36 rounded-md md:rounded-lg shadow-xl flex flex-col p-1 md:p-2 border border-neutral-300 ${
                          i === 1 && dealerHidden ? 'bg-blue-800' : 'bg-white'
                        }`}
                      >
                        {i === 1 && dealerHidden ? (
                          <div className="flex-1 flex items-center justify-center text-blue-400 text-2xl md:text-4xl">?</div>
                        ) : (
                          <>
                            <div className={`text-xs md:text-lg font-bold ${['hearts', 'diamonds'].includes(card.suit) ? 'text-red-600' : 'text-black'}`}>
                              {card.rank}
                            </div>
                            <div className="flex-1 flex items-center justify-center text-xl md:text-3xl">
                              {card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠'}
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {!dealerHidden && (
                  <div className="text-xl md:text-2xl font-mono text-white bg-black/30 py-1 px-4 rounded-lg inline-block">
                    {calculateBlackjackScore(dealerHand)}
                  </div>
                )}
              </div>

              {/* Player Area */}
              <div className="text-center space-y-2 md:space-y-4 mt-4 md:mt-0">
                <div className="flex items-center justify-center gap-2">
                  <Hand className="text-blue-400" size={16} md:size={20} />
                  <h3 className="text-blue-400 font-bold tracking-widest uppercase text-xs md:text-base">Player</h3>
                </div>
                <div className="h-28 md:h-40 flex justify-center items-center gap-1 md:gap-2">
                  <AnimatePresence>
                    {playerHand.map((card, i) => (
                      <motion.div
                        key={`${i}-${card.rank}-${card.suit}`}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
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
                {playerHand.length > 0 && (
                  <div className="text-xl md:text-2xl font-mono text-white bg-black/30 py-1 px-4 rounded-lg inline-block">
                    {calculateBlackjackScore(playerHand)}
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-auto space-y-4 md:space-y-6">
              <div className="flex justify-center gap-2 md:gap-4">
                {isPlayerTurn ? (
                  <>
                    <button
                      onClick={hit}
                      className="flex-1 sm:flex-none px-6 md:px-12 py-3 md:py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg md:text-2xl rounded-xl md:rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Play size={20} md:size={24} /> HIT
                    </button>
                    <button
                      onClick={stand}
                      className="flex-1 sm:flex-none px-6 md:px-12 py-3 md:py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-lg md:text-2xl rounded-xl md:rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={20} md:size={24} /> STAND
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 p-4 rounded-2xl md:rounded-3xl border border-blue-700 w-full justify-between">
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                      <Coins className="text-yellow-500" size={24} md:size={32} />
                      <div>
                        <p className="text-blue-400 text-[8px] md:text-xs uppercase font-bold">Balance</p>
                        <p className="text-xl md:text-2xl font-mono text-white">${balance.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-blue-400 text-[8px] md:text-[10px] uppercase font-bold">Bet</p>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1"
                            max={balance}
                            value={betAmount}
                            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
                            disabled={isDealing}
                            className="w-20 md:w-24 bg-black/60 border-2 border-blue-700 rounded-lg md:rounded-xl px-2 md:px-3 py-1 md:py-2 text-white font-mono text-lg md:text-xl text-center focus:outline-none focus:border-yellow-500"
                          />
                          <button
                            disabled={isDealing || balance <= 0}
                            onClick={() => setBetAmount(balance)}
                            className="px-2 md:px-3 py-1 md:py-2 bg-red-600 hover:bg-red-500 text-white text-[8px] md:text-[10px] font-black rounded-lg"
                          >
                            ALL IN
                          </button>
                        </div>
                      </div>
                      <button
                        disabled={isDealing || balance < betAmount}
                        onClick={startNewGame}
                        className="px-8 md:px-12 py-3 md:py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 text-black font-black text-lg md:text-2xl rounded-xl md:rounded-2xl transition-all shadow-lg"
                      >
                        DEAL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reality Check */}
          <div className="w-full lg:w-72 bg-black/40 rounded-2xl md:rounded-3xl border border-blue-700/50 p-4 md:p-6 flex flex-col shadow-inner">
            <h4 className="text-blue-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
              <TrendingDown size={14} />
              Reality Check
            </h4>
            <div className="space-y-3 md:space-y-4 overflow-y-auto pr-2 flex-1 max-h-[200px] lg:max-h-none">
              {affordableItems.slice(0, 5).map(item => (
                <div key={item.name} className="bg-blue-950/30 p-3 md:p-4 rounded-xl border border-blue-900/50">
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <span className="text-xl md:text-2xl">{item.icon}</span>
                    <span className="text-white font-bold text-base md:text-lg">x{item.count}</span>
                  </div>
                  <p className="text-[8px] md:text-[10px] text-blue-200/50 uppercase font-bold truncate">{item.name}</p>
                  <div className="h-1 w-full bg-blue-900 rounded-full mt-1 md:mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-blue-800">
              <p className="text-[8px] md:text-[10px] text-blue-400 uppercase font-bold mb-1">Total Lost</p>
              <p className="text-xl md:text-2xl font-mono text-white">${totalLost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {gameResult && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
            >
              <div className={`text-6xl font-black italic uppercase tracking-tighter drop-shadow-2xl text-center ${
                gameResult.includes('PLAYER') ? 'text-blue-500' : gameResult === 'PUSH' ? 'text-green-500' : 'text-red-500'
              }`}>
                {gameResult}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
