
import React from 'react';
import { getAffordableItems } from '../lib/items';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, TrendingDown } from 'lucide-react';

interface LossTrackerProps {
  totalLost: number;
}

export default function LossTracker({ totalLost }: LossTrackerProps) {
  const items = getAffordableItems(totalLost);

  return (
    <div className="w-full lg:w-80 flex-shrink-0 bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-800 p-4 md:p-6 flex flex-col h-auto lg:h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <TrendingDown className="text-red-500" />
        <h2 className="text-lg md:text-xl font-bold text-white">Reality Check</h2>
      </div>

      <div className="mb-6 md:mb-8 p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
        <p className="text-red-400 text-[10px] md:text-xs uppercase tracking-wider font-bold mb-1">Total Money Lost</p>
        <p className="text-2xl md:text-3xl font-mono text-white">${totalLost.toLocaleString()}</p>
      </div>

      <div className="space-y-4 md:space-y-6">
        <h3 className="text-xs md:text-sm font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
          <ShoppingBag size={14} />
          What you could have bought:
        </h3>
        
        <AnimatePresence>
          {items.map((item) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <span className="text-xl md:text-2xl grayscale hover:grayscale-0 transition-all cursor-default">{item.icon}</span>
                  <div>
                    <p className="text-white font-medium text-xs md:text-sm">{item.name}</p>
                    <p className="text-neutral-500 text-[10px] md:text-xs">${item.price}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold text-base md:text-lg">x{item.count}</span>
                </div>
              </div>
              
              <div className="h-1 md:h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  className="h-full bg-blue-500"
                />
              </div>
              <p className="text-[8px] md:text-[10px] text-neutral-500 text-right">
                {item.progress.toFixed(1)}% towards next one
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
