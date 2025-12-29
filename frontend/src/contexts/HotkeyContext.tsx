'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import type { HotkeyAction, HotkeyBinding } from '@/types/shared';
import { DEFAULT_SETTINGS } from '@/types/shared';

// ============================================
// TYPES
// ============================================

export interface HotkeyDefinition {
  action: HotkeyAction;
  label: string;
  description: string;
  category: 'navigation' | 'windows' | 'settings' | 'workspaces';
  binding: HotkeyBinding;
}

interface HotkeyContextValue {
  // All hotkey definitions with current bindings
  hotkeys: HotkeyDefinition[];
  // Check if cheatsheet is open
  isCheatsheetOpen: boolean;
  // Open/close cheatsheet
  setCheatsheetOpen: (open: boolean) => void;
  // Toggle cheatsheet
  toggleCheatsheet: () => void;
  // Register a callback for an action
  registerHandler: (action: HotkeyAction, handler: () => void) => () => void;
  // Format a binding for display
  formatBinding: (binding: HotkeyBinding) => string;
  // Update a hotkey binding (for customization)
  updateBinding: (action: HotkeyAction, binding: HotkeyBinding) => void;
}

const HotkeyContext = createContext<HotkeyContextValue | null>(null);

// ============================================
// HOTKEY DEFINITIONS
// ============================================

const HOTKEY_DEFINITIONS: Omit<HotkeyDefinition, 'binding'>[] = [
  {
    action: 'openSettings',
    label: 'Settings',
    description: 'Open the settings drawer',
    category: 'settings',
  },
  {
    action: 'openHotkeyCheatsheet',
    label: 'Keyboard Shortcuts',
    description: 'Show all keyboard shortcuts',
    category: 'settings',
  },
  {
    action: 'openFeedWindow',
    label: 'New Feed Window',
    description: 'Open a new feed window',
    category: 'windows',
  },
  {
    action: 'openCalendarWindow',
    label: 'New Calendar Window',
    description: 'Open a new calendar window',
    category: 'windows',
  },
  {
    action: 'toggleFutureFilter',
    label: 'Toggle Future Filter',
    description: 'Toggle predictive content filter',
    category: 'navigation',
  },
  {
    action: 'switchWorkspace1',
    label: 'Workspace 1',
    description: 'Switch to workspace 1',
    category: 'workspaces',
  },
  {
    action: 'switchWorkspace2',
    label: 'Workspace 2',
    description: 'Switch to workspace 2',
    category: 'workspaces',
  },
  {
    action: 'switchWorkspace3',
    label: 'Workspace 3',
    description: 'Switch to workspace 3',
    category: 'workspaces',
  },
  {
    action: 'switchWorkspace4',
    label: 'Workspace 4',
    description: 'Switch to workspace 4',
    category: 'workspaces',
  },
  {
    action: 'switchWorkspace5',
    label: 'Workspace 5',
    description: 'Switch to workspace 5',
    category: 'workspaces',
  },
  {
    action: 'switchWorkspace6',
    label: 'Workspace 6',
    description: 'Switch to workspace 6',
    category: 'workspaces',
  },
  {
    action: 'switchWorkspace7',
    label: 'Workspace 7',
    description: 'Switch to workspace 7',
    category: 'workspaces',
  },
  {
    action: 'switchWorkspace8',
    label: 'Workspace 8',
    description: 'Switch to workspace 8',
    category: 'workspaces',
  },
  {
    action: 'switchWorkspace9',
    label: 'Workspace 9',
    description: 'Switch to workspace 9',
    category: 'workspaces',
  },
];

// ============================================
// UTILITIES
// ============================================

function getKeyDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    KeyA: 'A',
    KeyB: 'B',
    KeyC: 'C',
    KeyD: 'D',
    KeyE: 'E',
    KeyF: 'F',
    KeyG: 'G',
    KeyH: 'H',
    KeyI: 'I',
    KeyJ: 'J',
    KeyK: 'K',
    KeyL: 'L',
    KeyM: 'M',
    KeyN: 'N',
    KeyO: 'O',
    KeyP: 'P',
    KeyQ: 'Q',
    KeyR: 'R',
    KeyS: 'S',
    KeyT: 'T',
    KeyU: 'U',
    KeyV: 'V',
    KeyW: 'W',
    KeyX: 'X',
    KeyY: 'Y',
    KeyZ: 'Z',
    Digit0: '0',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Digit5: '5',
    Digit6: '6',
    Digit7: '7',
    Digit8: '8',
    Digit9: '9',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backslash: '\\',
    BracketLeft: '[',
    BracketRight: ']',
    Semicolon: ';',
    Quote: "'",
    Backquote: '`',
    Minus: '-',
    Equal: '=',
    Space: 'Space',
    Enter: 'Enter',
    Escape: 'Esc',
    Backspace: 'Backspace',
    Tab: 'Tab',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  };

  return keyMap[key] || key;
}

function formatBinding(binding: HotkeyBinding): string {
  const parts: string[] = [];
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  if (binding.modifiers.ctrl) {
    parts.push(isMac ? '⌃' : 'Ctrl');
  }
  if (binding.modifiers.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (binding.modifiers.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (binding.modifiers.meta) {
    parts.push(isMac ? '⌘' : 'Win');
  }

  parts.push(getKeyDisplay(binding.key));

  return parts.join(isMac ? '' : '+');
}

function matchesBinding(event: KeyboardEvent, binding: HotkeyBinding): boolean {
  const keyMatch = event.code === binding.key;
  const ctrlMatch = !!binding.modifiers.ctrl === event.ctrlKey;
  const altMatch = !!binding.modifiers.alt === event.altKey;
  const shiftMatch = !!binding.modifiers.shift === event.shiftKey;
  const metaMatch = !!binding.modifiers.meta === event.metaKey;

  return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
}

// ============================================
// PROVIDER
// ============================================

interface HotkeyProviderProps {
  children: ReactNode;
  // Custom bindings from settings
  customBindings?: Partial<Record<HotkeyAction, HotkeyBinding>>;
  // Callback when bindings are updated
  onBindingsChange?: (bindings: Partial<Record<HotkeyAction, HotkeyBinding>>) => void;
}

export function HotkeyProvider({
  children,
  customBindings = {},
  onBindingsChange,
}: HotkeyProviderProps) {
  const [isCheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [handlers] = useState(() => new Map<HotkeyAction, Set<() => void>>());
  const [localBindings, setLocalBindings] = useState<
    Partial<Record<HotkeyAction, HotkeyBinding>>
  >(customBindings);

  // Update local bindings when prop changes
  useEffect(() => {
    setLocalBindings(customBindings);
  }, [customBindings]);

  // Merge default bindings with custom bindings
  const bindings = useMemo(() => {
    const defaults = DEFAULT_SETTINGS.keyboardInput.hotkeys;
    return { ...defaults, ...localBindings } as Record<HotkeyAction, HotkeyBinding>;
  }, [localBindings]);

  // Build full hotkey definitions
  const hotkeys = useMemo((): HotkeyDefinition[] => {
    return HOTKEY_DEFINITIONS.map((def) => ({
      ...def,
      binding: bindings[def.action] || { key: '', modifiers: {} },
    }));
  }, [bindings]);

  // Register a handler
  const registerHandler = useCallback(
    (action: HotkeyAction, handler: () => void): (() => void) => {
      if (!handlers.has(action)) {
        handlers.set(action, new Set());
      }
      handlers.get(action)!.add(handler);

      // Return cleanup function
      return () => {
        handlers.get(action)?.delete(handler);
      };
    },
    [handlers]
  );

  // Update a binding
  const updateBinding = useCallback(
    (action: HotkeyAction, binding: HotkeyBinding) => {
      const newBindings = { ...localBindings, [action]: binding };
      setLocalBindings(newBindings);
      onBindingsChange?.(newBindings);
    },
    [localBindings, onBindingsChange]
  );

  // Toggle cheatsheet
  const toggleCheatsheet = useCallback(() => {
    setCheatsheetOpen((prev) => !prev);
  }, []);

  // Global keydown listener
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        // Allow Escape to work in inputs
        if (event.code !== 'Escape') {
          return;
        }
      }

      // Check each binding
      for (const [action, binding] of Object.entries(bindings) as [
        HotkeyAction,
        HotkeyBinding
      ][]) {
        if (matchesBinding(event, binding)) {
          event.preventDefault();
          event.stopPropagation();

          // Special handling for cheatsheet
          if (action === 'openHotkeyCheatsheet') {
            toggleCheatsheet();
            return;
          }

          // Call all registered handlers
          const actionHandlers = handlers.get(action);
          if (actionHandlers) {
            actionHandlers.forEach((handler) => handler());
          }

          return;
        }
      }

      // Also check for ? key (Shift+/) for cheatsheet
      if (event.key === '?' || (event.shiftKey && event.code === 'Slash')) {
        event.preventDefault();
        toggleCheatsheet();
      }

      // Escape closes cheatsheet
      if (event.code === 'Escape' && isCheatsheetOpen) {
        event.preventDefault();
        setCheatsheetOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindings, handlers, toggleCheatsheet, isCheatsheetOpen]);

  const value = useMemo(
    (): HotkeyContextValue => ({
      hotkeys,
      isCheatsheetOpen,
      setCheatsheetOpen,
      toggleCheatsheet,
      registerHandler,
      formatBinding,
      updateBinding,
    }),
    [
      hotkeys,
      isCheatsheetOpen,
      toggleCheatsheet,
      registerHandler,
      updateBinding,
    ]
  );

  return (
    <HotkeyContext.Provider value={value}>{children}</HotkeyContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useHotkeys(): HotkeyContextValue {
  const context = useContext(HotkeyContext);

  if (!context) {
    throw new Error('useHotkeys must be used within a HotkeyProvider');
  }

  return context;
}

// Hook to register a hotkey handler
export function useHotkeyHandler(action: HotkeyAction, handler: () => void) {
  const { registerHandler } = useHotkeys();

  useEffect(() => {
    return registerHandler(action, handler);
  }, [registerHandler, action, handler]);
}

// Export context for advanced use cases
export { HotkeyContext };

