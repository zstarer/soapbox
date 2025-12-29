import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GrokData } from '@/types/shared';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CalendarModuleProps {
  data: GrokData[];
}

export function CalendarModule({ data }: CalendarModuleProps) {
  const calendarData = data.find(d => d.events && d.events.length > 0);
  const events = calendarData?.events || [];

  return (
    <div className="p-0">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800">
          <tr>
            <th className="px-4 py-2.5 font-medium text-zinc-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-2.5 font-medium text-zinc-500 uppercase tracking-wider">Event</th>
            <th className="px-4 py-2.5 font-medium text-zinc-500 uppercase tracking-wider">Impact</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900">
          {events.map((event: NonNullable<GrokData['events']>[number], i: number) => (
            <tr key={i} className="hover:bg-zinc-800/30 transition-colors group">
              <td className="px-4 py-3 text-zinc-400 font-mono whitespace-nowrap">
                {event.date}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-zinc-200 mb-0.5">{event.title}</div>
                <div className="text-zinc-500 line-clamp-1 text-[11px]">{event.summary}</div>
              </td>
              <td className="px-4 py-3">
                <span className={cn(
                  "px-1.5 py-0.5 rounded-[2px] text-[9px] uppercase font-bold",
                  event.impact === 'high' && "bg-red-500/10 text-red-500 border border-red-500/20",
                  event.impact === 'medium' && "bg-orange-500/10 text-orange-500 border border-orange-500/20",
                  event.impact === 'low' && "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
                )}>
                  {event.impact}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length === 0 && (
        <div className="p-8 text-center text-zinc-600 text-xs italic">
          No scheduled events found in feed.
        </div>
      )}
    </div>
  );
}

