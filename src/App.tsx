import React, { useState, useEffect } from 'react';
import PixelRoom from './components/PixelRoom';
import BaccaratTable from './components/BaccaratTable';
import BlackjackTable from './components/BlackjackTable';
import LossTracker from './components/LossTracker';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Info, AlertCircle, TrendingDown } from 'lucide-react';

export default function App() {
  const [balance, setBalance] = useState(0);
  const [totalLost, setTotalLost] = useState(0);
  const [showBaccarat, setShowBaccarat] = useState(false);
  const [showBlackjack, setShowBlackjack] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Initial random balance between 100 and 1000
    const initialBalance = Math.floor(Math.random() * 901) + 100;
    setBalance(initialBalance);
  }, []);

  const handleUpdateBalance = (newBalance: number, lostAmount: number) => {
    setBalance(newBalance);
    if (lostAmount > 0) {
      setTotalLost(prev => prev + lostAmount);
    }
  };

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
            <p className="text-neutral-400 text-xs md:text-sm mt-1">A simulation to help you understand the cost of gambling.</p>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6 w-full sm:w-auto">
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
            />
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-neutral-900/50 p-4 md:p-6 rounded-2xl border border-neutral-800">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Info size={18} />
                  <h3 className="font-bold uppercase text-sm">How to Play</h3>
                </div>
                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                  Walk your pixel character to a table to start playing. 
                  Left table is Baccarat, Right table is Blackjack.
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
        </AnimatePresence>

        <AnimatePresence>
          {showIntro && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 text-center"
            >
              <div className="max-w-xl space-y-8">
                <motion.h2 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="text-5xl font-black text-white tracking-tighter"
                >
                  WELCOME TO THE ROOM
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-neutral-400 leading-relaxed"
                >
                  You've been given a random amount of chips. 
                  Go to the tables and see what happens to your money.
                </motion.p>
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setShowIntro(false)}
                  className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
                >
                  I UNDERSTAND
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sidebar */}
      <LossTracker totalLost={totalLost} />
    </div>
  );
}
