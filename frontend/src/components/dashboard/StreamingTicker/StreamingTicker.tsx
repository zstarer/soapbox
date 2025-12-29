import React, { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GrokData } from '../../../../../shared/types';
import { SortOption } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StreamingTickerProps {
  data: GrokData[];
}

export function StreamingTicker({ data }: StreamingTickerProps) {
  const [sortBy, setSortBy] = useState<SortOption>('time-desc');
  
  const streamingData = data.filter(d => d.interactionState === 'streaming' || d.temporalLayer === 'current');
  
  // Sort data
  const sortedData = [...streamingData].sort((a, b) => {
    if (sortBy === 'time-desc') {
      return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
    } else if (sortBy === 'time-asc') {
      return new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
    } else if (sortBy === 'sentiment') {
      return b.sentiment - a.sentiment;
    }
    return 0;
  });
  
  return (
    <div className="flex flex-col h-full">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowUpDown size={12} className="text-zinc-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-[10px] bg-zinc-800/50 text-zinc-300 border border-zinc-700 rounded px-1.5 py-0.5 uppercase tracking-wider focus:outline-none focus:border-zinc-600"
          >
            <option value="time-desc">Latest First</option>
            <option value="time-asc">Oldest First</option>
            <option value="sentiment">By Sentiment</option>
          </select>
        </div>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-auto p-4 font-mono space-y-6">
        {sortedData.map((item, i) => (
          <div key={item.id || i} className="border-l-2 border-zinc-800 pl-4 py-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase">
                {item.temporalLayer}
              </span>
              <span className="text-[10px] text-zinc-500">
                {new Date(item.generatedAt).toLocaleTimeString()}
              </span>
              {item.sentiment !== 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  item.sentiment > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {item.sentiment > 0 ? '+' : ''}{item.sentiment.toFixed(1)}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed uppercase tracking-tight">
              {item.content}
            </p>
          </div>
        ))}
        {sortedData.length === 0 && (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
            No feed items available.
          </div>
        )}
      </div>
    </div>
  );
}

