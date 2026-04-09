import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, DollarSign } from 'lucide-react';

interface MysteryBoxProps {
  onReveal: (amount: number) => void;
}

function generateRandomAmount(): number {
  // Weighted random: more likely to get lower amounts (realistic)
  // Using exponential distribution skewed toward $1-$50
  const random = Math.random();
  const skewed = Math.pow(random, 2); // squares it to skew low
  return Math.max(1, Math.floor(skewed * 200) + 1);
}

type BoxPhase = 'intro' | 'box' | 'opening' | 'revealed';

export default function MysteryBox({ onReveal }: MysteryBoxProps) {
  const [phase, setPhase] = useState<BoxPhase>('intro');
  const [amount, setAmount] = useState(0);

  const handleOpenBox = useCallback(() => {
    setPhase('opening');
    const result = generateRandomAmount();
    setAmount(result);

    // After shake animation, reveal the amount
    setTimeout(() => {
      setPhase('revealed');
    }, 1500);
  }, []);

  const handleEnterGame = useCallback(() => {
    onReveal(amount);
  }, [amount, onReveal]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6"
    >
      <AnimatePresence mode="wait">
        {/* INTRO PHASE */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="text-center max-w-xl space-y-8"
          >
            <motion.h2
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="text-4xl md:text-5xl font-black text-white tracking-tighter"
            >
              WELCOME TO THE ROOM
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-neutral-400 leading-relaxed"
            >
              In real gambling, money doesn't come free.
              <br />
              <span className="text-white font-semibold">
                Here's your starting mystery box.
              </span>
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-neutral-500"
            >
              Everyone gets a different amount — just like life.
            </motion.p>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => setPhase('box')}
              className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
            >
              SHOW ME MY BOX
            </motion.button>
          </motion.div>
        )}

        {/* BOX PHASE - Waiting to be opened */}
        {phase === 'box' && (
          <motion.div
            key="box"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center space-y-8"
          >
            <p className="text-neutral-400 text-sm uppercase tracking-widest font-bold">
              Tap the box to open
            </p>

            <motion.button
              onClick={handleOpenBox}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-40 h-40 md:w-52 md:h-52 mx-auto block"
            >
              {/* Box glow */}
              <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-xl animate-pulse" />

              {/* Box */}
              <div className="relative w-full h-full bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl border-4 border-amber-500 flex items-center justify-center shadow-2xl">
                <Gift className="text-amber-200" size={64} />

                {/* Sparkle particles */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sparkles className="absolute -top-3 text-amber-300" size={16} />
                  <Sparkles className="absolute -bottom-3 text-amber-300" size={16} />
                  <Sparkles className="absolute -left-3 text-amber-300" size={16} />
                  <Sparkles className="absolute -right-3 text-amber-300" size={16} />
                </motion.div>
              </div>

              <p className="mt-4 text-amber-400 text-xs font-bold">
                MYSTERY BOX — $1 to $200
              </p>
            </motion.button>
          </motion.div>
        )}

        {/* OPENING PHASE - Shaking animation */}
        {phase === 'opening' && (
          <motion.div
            key="opening"
            className="text-center"
          >
            <motion.div
              animate={{
                rotate: [0, -5, 5, -5, 5, -10, 10, -10, 10, 0],
                scale: [1, 1.05, 1.05, 1.1, 1.1, 1.15, 1.15, 1.2, 1.2, 1.3],
              }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="relative w-40 h-40 md:w-52 md:h-52 mx-auto"
            >
              <div className="absolute inset-0 bg-amber-500/40 rounded-2xl blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl border-4 border-amber-400 flex items-center justify-center shadow-2xl">
                <Gift className="text-amber-200" size={64} />
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 1, 0, 1] }}
              transition={{ duration: 1.5 }}
              className="mt-6 text-amber-300 font-bold text-lg"
            >
              Opening...
            </motion.p>
          </motion.div>
        )}

        {/* REVEALED PHASE */}
        {phase === 'revealed' && (
          <motion.div
            key="revealed"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-center space-y-8"
          >
            {/* Burst effect */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute w-40 h-40 bg-amber-500/30 rounded-full blur-2xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            />

            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="relative"
            >
              <DollarSign className="mx-auto text-green-400 mb-2" size={40} />
              <p className="text-6xl md:text-8xl font-black text-white font-mono">
                ${amount}
              </p>
              <p className="text-neutral-500 text-sm mt-2 uppercase tracking-widest font-bold">
                Your starting chips
              </p>
            </motion.div>

            {amount <= 10 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-red-400 text-sm"
              >
                Tough luck. Some people start with almost nothing — that's the reality.
              </motion.p>
            )}

            {amount > 10 && amount <= 50 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-neutral-400 text-sm"
              >
                A modest start. Let's see how long it lasts.
              </motion.p>
            )}

            {amount > 50 && amount <= 150 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-blue-400 text-sm"
              >
                Not bad. But the house always has the edge.
              </motion.p>
            )}

            {amount > 150 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-amber-400 text-sm"
              >
                Lucky draw! Enjoy it — big starts don't mean big endings.
              </motion.p>
            )}

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={handleEnterGame}
              className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
            >
              ENTER THE CASINO
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
