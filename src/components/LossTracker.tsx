import { getAffordableItems, getBiggestAffordable } from '../lib/items';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, TrendingDown, Lock, Trophy } from 'lucide-react';

interface LossTrackerProps {
  totalLost: number;
}

export default function LossTracker({ totalLost }: LossTrackerProps) {
  const items = getAffordableItems(totalLost);
  const biggest = getBiggestAffordable(totalLost);

  return (
    <div className="w-full lg:w-80 flex-shrink-0 bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-800 p-4 md:p-6 flex flex-col h-auto lg:h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <TrendingDown className="text-red-500" />
        <h2 className="text-lg md:text-xl font-bold text-white">Reality Check</h2>
      </div>

      <div className="mb-4 p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
        <p className="text-red-400 text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1">Total Money Lost</p>
        <p className="text-2xl md:text-3xl font-mono text-white">${totalLost.toLocaleString()}</p>
      </div>

      {/* Biggest unlocked — the headline reality check */}
      <AnimatePresence mode="wait">
        {biggest && (
          <motion.div
            key={biggest.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-4 bg-gradient-to-br from-amber-900/30 to-amber-950/30 border border-amber-700/40 rounded-xl"
          >
            <div className="flex items-center gap-2 text-amber-400 text-[9px] md:text-[10px] uppercase tracking-wider font-bold mb-2">
              <Trophy size={12} />
              You could have bought
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl">{biggest.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm md:text-base truncate">{biggest.name}</p>
                <p className="text-amber-300/80 text-[10px] md:text-xs font-mono">
                  ${biggest.price.toLocaleString()} {biggest.count > 1 && `× ${biggest.count}`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 md:space-y-5">
        <h3 className="text-xs md:text-sm font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
          <ShoppingBag size={14} />
          {biggest ? 'Or instead:' : 'What you could buy:'}
        </h3>

        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`text-xl md:text-2xl transition-all ${
                      item.affordable ? '' : 'grayscale opacity-40'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`font-medium text-xs md:text-sm truncate ${
                        item.affordable ? 'text-white' : 'text-neutral-500'
                      }`}
                    >
                      {item.name}
                    </p>
                    <p className="text-neutral-500 text-[10px] md:text-xs font-mono">
                      ${item.price.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  {item.affordable ? (
                    <span className="text-white font-bold text-base md:text-lg">×{item.count}</span>
                  ) : (
                    <Lock className="text-neutral-600" size={14} />
                  )}
                </div>
              </div>

              <div className="h-1 md:h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  className={`h-full ${item.affordable ? 'bg-blue-500' : 'bg-neutral-600'}`}
                />
              </div>
              <p className="text-[8px] md:text-[10px] text-neutral-500 text-right">
                {item.affordable
                  ? `${item.progress.toFixed(1)}% towards next one`
                  : `${item.progress.toFixed(1)}% towards unlock`}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-8 lg:mt-auto pt-8 text-center border-t border-neutral-800 lg:border-t-0">
        <p className="text-neutral-600 text-[10px] italic">
          "The only way to win is not to play."
        </p>
      </div>
    </div>
  );
}
