import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive: boolean;
  isMinimized?: boolean;
}

export function NavButton({ 
  icon, 
  label, 
  onClick, 
  isActive,
  isMinimized
}: NavButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
        (isActive && !isMinimized)
          ? "bg-zinc-100 text-zinc-900 shadow-lg"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800",
        isMinimized ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 bg-zinc-800 text-zinc-300" : null
      )}
    >
      {icon}
      
      {/* Tooltip */}
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-zinc-800 text-zinc-200 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border border-zinc-700 pointer-events-none">
        {label}
      </span>

      {/* Active Dot */}
      {isActive && (
        <span className={cn(
          "absolute -bottom-1 w-1 h-1 rounded-full",
          (isActive && !isMinimized) ? "bg-zinc-900" : "bg-zinc-100"
        )} />
      )}
    </button>
  );
}

