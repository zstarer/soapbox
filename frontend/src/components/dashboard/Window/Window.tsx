import React from 'react';
import { Rnd } from 'react-rnd';
import { X, Minus } from 'lucide-react';
import { WindowState } from '../types';
import { FeedIcon, CalendarIcon } from '../icons';

interface WindowProps {
  window: WindowState;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  onDrag: (x: number, y: number) => void;
  onResize: (x: number, y: number, width: number, height: number) => void;
  children: React.ReactNode;
}

export function Window({ 
  window, 
  onClose, 
  onMinimize,
  onFocus,
  onDrag,
  onResize,
  children 
}: WindowProps) {
  return (
    <Rnd
      position={{ x: window.x, y: window.y }}
      size={{ width: window.width, height: window.height }}
      minWidth={300}
      minHeight={200}
      bounds="parent"
      style={{ zIndex: window.zIndex }}
      onDragStart={onFocus}
      onResizeStart={onFocus}
      onDrag={(e, d) => onDrag(d.x, d.y)}
      onResize={(e, direction, ref, delta, position) => {
        onResize(position.x, position.y, ref.offsetWidth, ref.offsetHeight);
      }}
      className="flex flex-col window-glass rounded-lg overflow-hidden shadow-2xl"
      dragHandleClassName="window-header"
    >
      {/* Header */}
      <div className="window-header flex items-center justify-between px-3 py-2 bg-zinc-800/50 cursor-grab active:cursor-grabbing border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          {window.type === 'streaming' ? (
            <FeedIcon />
          ) : (
            <CalendarIcon />
          )}
          <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
            {window.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Minus size={12} />
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-zinc-950/20">
        {children}
      </div>
    </Rnd>
  );
}

