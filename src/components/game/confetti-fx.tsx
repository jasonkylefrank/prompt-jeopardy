"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const CONFETTI_COUNT = 50;

const ConfettiFX = () => {
  const [pieces, setPieces] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const newPieces = Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
      const style = {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 3}s`,
      };
      const colors = ['bg-primary', 'bg-accent', 'bg-green-500', 'bg-yellow-400'];
      const colorClass = colors[Math.floor(Math.random() * colors.length)];
      
      return (
        <div
          key={i}
          className={cn("absolute top-0 h-3 w-1.5 animate-fall rounded-full", colorClass)}
          style={style}
        />
      );
    });
    setPieces(newPieces);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
        <style>{`
            @keyframes fall {
                0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
            }
            .animate-fall {
                animation-name: fall;
                animation-timing-function: linear;
            }
        `}</style>
      {pieces}
    </div>
  );
};

export default ConfettiFX;
