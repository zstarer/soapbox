'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { useHotkeys, HotkeyDefinition } from '@/contexts/HotkeyContext';

interface HotkeyCheatsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Category = 'navigation' | 'windows' | 'settings' | 'workspaces';

const CATEGORY_LABELS: Record<Category, string> = {
  navigation: 'Navigation',
  windows: 'Windows',
  settings: 'Settings',
  workspaces: 'Workspaces',
};

const CATEGORY_ORDER: Category[] = ['settings', 'windows', 'navigation', 'workspaces'];

export function HotkeyCheatsheetModal({
  isOpen,
  onClose,
}: HotkeyCheatsheetModalProps) {
  const { hotkeys, formatBinding } = useHotkeys();
  const [searchQuery, setSearchQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Filter hotkeys by search
  const filteredHotkeys = useMemo(() => {
    if (!searchQuery.trim()) return hotkeys;

    const query = searchQuery.toLowerCase();
    return hotkeys.filter(
      (h) =>
        h.label.toLowerCase().includes(query) ||
        h.description.toLowerCase().includes(query) ||
        formatBinding(h.binding).toLowerCase().includes(query)
    );
  }, [hotkeys, searchQuery, formatBinding]);

  // Group by category
  const groupedHotkeys = useMemo(() => {
    const groups: Record<Category, HotkeyDefinition[]> = {
      navigation: [],
      windows: [],
      settings: [],
      workspaces: [],
    };

    filteredHotkeys.forEach((h) => {
      groups[h.category].push(h);
    });

    return groups;
  }, [filteredHotkeys]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      previousFocusRef.current?.focus();
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cheatsheet-modal animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="cheatsheet-title">
      {/* Backdrop */}
      <button
        type="button"
        className="cheatsheet-backdrop"
        onClick={onClose}
        aria-label="Close keyboard shortcuts"
      />

      {/* Content */}
      <div
        ref={modalRef}
        className="cheatsheet-content animate-scale-in"
      >
        {/* Header */}
        <div className="cheatsheet-header">
          <h2 id="cheatsheet-title" className="cheatsheet-title">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mx-5 mt-4">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shortcuts..."
            className="cheatsheet-search pl-9 !m-0 !w-full"
            aria-label="Search keyboard shortcuts"
          />
        </div>

        {/* List */}
        <div className="cheatsheet-list">
          {CATEGORY_ORDER.map((category) => {
            const items = groupedHotkeys[category];
            if (items.length === 0) return null;

            return (
              <div key={category} className="cheatsheet-category">
                <h3 className="cheatsheet-category-title">
                  {CATEGORY_LABELS[category]}
                </h3>
                <div className="space-y-1">
                  {items.map((hotkey) => (
                    <div key={hotkey.action} className="cheatsheet-item">
                      <div className="cheatsheet-item-label">
                        <span className="text-zinc-200">{hotkey.label}</span>
                        <span className="text-zinc-500 text-xs ml-2">
                          {hotkey.description}
                        </span>
                      </div>
                      <div className="cheatsheet-item-binding">
                        {renderBinding(formatBinding(hotkey.binding))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredHotkeys.length === 0 && (
            <div className="text-center text-zinc-500 py-8">
              No shortcuts found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-800/30 border-t border-zinc-700/50">
          <div className="text-[10px] text-zinc-500 text-center">
            Customize shortcuts in Settings → Keyboard & Input
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to render binding with styled keys
function renderBinding(binding: string): React.ReactNode {
  // Split by common separators
  const parts = binding.split(/([+])/);
  
  return parts.map((part, i) => {
    if (part === '+') {
      return (
        <span key={i} className="text-zinc-600 mx-0.5">
          +
        </span>
      );
    }
    
    // Handle multi-character keys (like Ctrl, Shift)
    const chars = part.match(/[⌘⌃⌥⇧]|[A-Za-z0-9,./;'\[\]\\`\-=]|[↑↓←→]|Space|Enter|Esc|Tab|Backspace/g) || [part];
    
    return chars.map((char, j) => (
      <span key={`${i}-${j}`} className="hotkey-key">
        {char}
      </span>
    ));
  });
}

export default HotkeyCheatsheetModal;


