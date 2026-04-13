
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface PixelRoomProps {
  onEnterBaccarat: () => void;
  onEnterBlackjack: () => void;
  onEnterWorkStation: () => void;
  onLeaveWorkStation: () => void;
  onEnterSlotMachine: () => void;
  onEnterFunStation: () => void;
  isAtWorkStation: boolean;
}

export default function PixelRoom({ onEnterBaccarat, onEnterBlackjack, onEnterWorkStation, onLeaveWorkStation, onEnterSlotMachine, onEnterFunStation, isAtWorkStation }: PixelRoomProps) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const move = (direction: 'up' | 'down' | 'left' | 'right') => {
    setPos(prev => {
      const step = 5;
      let { x, y } = prev;
      if (direction === 'up') y = Math.max(0, y - step);
      if (direction === 'down') y = Math.min(90, y + step);
      if (direction === 'left') x = Math.max(0, x - step);
      if (direction === 'right') x = Math.min(90, x + step);
      return { x, y };
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move('up');
      if (e.key === 'ArrowDown') move('down');
      if (e.key === 'ArrowLeft') move('left');
      if (e.key === 'ArrowRight') move('right');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check collision with tables
  useEffect(() => {
    // Baccarat Table (Left)
    if (pos.x > 20 && pos.x < 40 && pos.y > 40 && pos.y < 60) {
      onEnterBaccarat();
    }
    // Blackjack Table (Right)
    if (pos.x > 60 && pos.x < 80 && pos.y > 40 && pos.y < 60) {
      onEnterBlackjack();
    }
    // Work Station (Bottom Center)
    const inWorkZone = pos.x > 35 && pos.x < 65 && pos.y > 75 && pos.y < 95;
    if (inWorkZone) {
      onEnterWorkStation();
    } else if (isAtWorkStation) {
      onLeaveWorkStation();
    }
    // Betting Slot Machine (Top Center)
    if (pos.x > 35 && pos.x < 65 && pos.y >= 0 && pos.y < 15) {
      onEnterSlotMachine();
    }
    // Fun Station (Top Left)
    if (pos.x >= 0 && pos.x < 20 && pos.y > 5 && pos.y < 25) {
      onEnterFunStation();
    }
  }, [pos, onEnterBaccarat, onEnterBlackjack, onEnterWorkStation, onLeaveWorkStation, onEnterSlotMachine, onEnterFunStation, isAtWorkStation]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[300px] md:h-[400px] bg-neutral-900 border-4 border-neutral-700 overflow-hidden rounded-xl shadow-2xl"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Floor Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      {/* Baccarat Table (Left) */}
      <div 
        className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-16 md:w-32 md:h-20 bg-emerald-800 border-2 md:border-4 border-amber-700 rounded-full flex items-center justify-center shadow-lg"
      >
        <div className="text-[8px] md:text-[10px] text-emerald-200 font-bold text-center">
          BACCARAT<br/>TABLE
        </div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-600 text-[6px] md:text-[8px] text-white rounded animate-pulse">
          ENTER
        </div>
      </div>

      {/* Blackjack Table (Right) */}
      <div 
        className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-16 md:w-32 md:h-20 bg-blue-800 border-2 md:border-4 border-amber-700 rounded-full flex items-center justify-center shadow-lg"
      >
        <div className="text-[8px] md:text-[10px] text-blue-200 font-bold text-center">
          BLACKJACK<br/>TABLE
        </div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-600 text-[6px] md:text-[8px] text-white rounded animate-pulse">
          ENTER
        </div>
      </div>

      {/* Fun Station (Top Left) */}
      <div
        className="absolute left-[3%] top-[8%] w-24 h-14 md:w-32 md:h-16 bg-gradient-to-b from-pink-700 to-pink-950 border-2 md:border-4 border-pink-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.4)]"
      >
        <div className="text-[8px] md:text-[10px] text-pink-200 font-bold text-center">
          ✨ FUN<br/>STATION
        </div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-pink-600 text-[6px] md:text-[8px] text-white rounded animate-pulse">
          ENTER
        </div>
      </div>

      {/* Betting Slot Machine (Top Center) */}
      <div
        className="absolute left-1/2 top-[4%] -translate-x-1/2 w-28 h-14 md:w-36 md:h-16 bg-gradient-to-b from-purple-800 to-purple-950 border-2 md:border-4 border-yellow-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.4)]"
      >
        <div className="text-[8px] md:text-[10px] text-yellow-200 font-bold text-center">
          🎰 SLOT<br/>MACHINE
        </div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-600 text-[6px] md:text-[8px] text-white rounded animate-pulse">
          ENTER
        </div>
      </div>

      {/* Work Station (Bottom Center) */}
      <div
        className="absolute left-1/2 bottom-[8%] -translate-x-1/2 w-28 h-14 md:w-36 md:h-16 bg-amber-900/80 border-2 md:border-4 border-amber-600 rounded-xl flex items-center justify-center shadow-lg"
      >
        <div className="text-[8px] md:text-[10px] text-amber-200 font-bold text-center">
          🎰 WORK<br/>STATION
        </div>
        {isAtWorkStation ? (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-600 text-[6px] md:text-[8px] text-white rounded font-bold">
            EARNING
          </div>
        ) : (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-600 text-[6px] md:text-[8px] text-white rounded animate-pulse">
            ENTER
          </div>
        )}
      </div>

      {/* Player Pixel */}
      <motion.div 
        animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute w-5 h-5 md:w-6 md:h-6 bg-blue-500 border-2 border-white shadow-md z-10"
      >
        <div className="absolute top-1 left-1 w-1 h-1 bg-white" />
        <div className="absolute top-1 right-1 w-1 h-1 bg-white" />
      </motion.div>

      {/* Touch Controls for Mobile */}
      <div className="absolute bottom-4 right-4 grid grid-cols-3 gap-1 md:hidden">
        <div />
        <button 
          onClick={() => move('up')}
          className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center active:bg-white/30"
        >
          <ChevronUp size={20} />
        </button>
        <div />
        <button 
          onClick={() => move('left')}
          className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center active:bg-white/30"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={() => move('down')}
          className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center active:bg-white/30"
        >
          <ChevronDown size={20} />
        </button>
        <button 
          onClick={() => move('right')}
          className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center active:bg-white/30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 text-white text-[10px] md:text-xs bg-black/50 p-2 rounded hidden md:block">
        Use Arrow Keys to move to a table
      </div>
    </div>
  );
}
