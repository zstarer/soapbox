'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity } from 'lucide-react';
import { GrokData } from '@/types/shared';
import { Window } from '@/components/dashboard/Window';
import { StreamingTicker } from '@/components/dashboard/StreamingTicker';
import { CalendarModule } from '@/components/dashboard/CalendarModule';
import { NavButton } from '@/components/dashboard/NavButton';
import { SettingsLauncher } from '@/components/dashboard/Settings';
import { FeedIcon, CalendarIcon } from '@/components/dashboard/icons';
import {
  WindowState,
  WindowType,
  WindowBounds,
  serializeWindowState,
  deserializeWindowState,
} from '@/components/dashboard/types';
import { useWorkspaces } from '@/contexts/WorkspacesContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useHotkeyHandler } from '@/contexts/HotkeyContext';

// ============================================
// THEME APPLICATION HOOK
// ============================================

function useApplyTheme() {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const appearance = settings.appearance;
    const accessibility = settings.accessibility;

    // Apply theme
    root.setAttribute('data-theme', appearance.theme ?? 'dark');

    // Apply font family
    root.setAttribute('data-font', appearance.fontFamily ?? 'system-sans');

    // Apply reduced motion
    root.setAttribute(
      'data-reduced-motion',
      appearance.reducedMotion ? 'true' : 'false'
    );

    // Apply CSS variables
    root.style.setProperty(
      '--glass-intensity',
      String((appearance.glassmorphismIntensity ?? 80) / 100)
    );
    root.style.setProperty(
      '--radius-scale',
      String((appearance.borderRadiusScale ?? 12) / 12)
    );
    root.style.setProperty(
      '--font-scale',
      String((appearance.fontScale ?? 100) / 100)
    );
    root.style.setProperty(
      '--shadow-intensity',
      String((appearance.windowShadowIntensity ?? 60) / 100)
    );
    root.style.setProperty(
      '--animation-scale',
      String((accessibility.animationDurationScale ?? 100) / 100)
    );
    root.style.setProperty(
      '--focus-outline-width',
      `${accessibility.focusOutlineThickness ?? 2}px`
    );
    root.style.setProperty('--theme-accent', appearance.accentColor ?? '#3b82f6');

    // Apply color vision deficiency preview
    root.setAttribute(
      'data-cvd',
      accessibility.colorVisionDeficiencyPreview ?? 'none'
    );
  }, [settings]);
}

// ============================================
// MAIN PAGE
// ============================================

export default function SoapboxDesktop() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [grokUpdates, setGrokUpdates] = useState<GrokData[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const windowRefs = useRef<Map<string, WindowBounds>>(new Map());

  // Contexts
  const { currentWorkspace, saveWindowState } = useWorkspaces();
  const { settings } = useSettings();

  // Apply theme
  useApplyTheme();

  // Initialize mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Restore window state from workspace
  useEffect(() => {
    if (isInitialized) return;

    const savedState = currentWorkspace.windowState || [];
    if (savedState.length > 0) {
      const restoredWindows = savedState.map((serialized, index) =>
        deserializeWindowState(serialized, 10 + index)
      );
      setWindows(restoredWindows);
      setMaxZIndex(10 + savedState.length);

      // Update refs
      restoredWindows.forEach((w) => {
        windowRefs.current.set(w.id, {
          x: w.x,
          y: w.y,
          width: w.width,
          height: w.height,
        });
      });
    }

    setIsInitialized(true);
  }, [currentWorkspace.id, currentWorkspace.windowState, isInitialized]);

  // Save window state when it changes (debounced)
  useEffect(() => {
    if (!isInitialized || windows.length === 0) return;

    const timeoutId = setTimeout(() => {
      const serialized = windows.map(serializeWindowState);
      saveWindowState(serialized);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [windows, isInitialized, saveWindowState]);

  // Check if two windows overlap
  const windowsOverlap = (a: WindowBounds, b: WindowBounds): boolean => {
    return !(
      a.x + a.width <= b.x ||
      b.x + b.width <= a.x ||
      a.y + a.height <= b.y ||
      b.y + b.height <= a.y
    );
  };

  // Clamp windows to viewport on resize and prevent overlaps
  const clampWindows = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 100;
    const spacing = 20;

    setWindows((prevWindows) => {
      const updatedWindows = prevWindows.map((win) => {
        const ref = windowRefs.current.get(win.id);
        if (ref) {
          const newX = Math.max(0, Math.min(ref.x, viewportWidth - ref.width));
          const newY = Math.max(0, Math.min(ref.y, viewportHeight - ref.height));
          const newWidth = Math.min(ref.width, viewportWidth - 40);
          const newHeight = Math.min(ref.height, viewportHeight - 40);

          const clamped = { x: newX, y: newY, width: newWidth, height: newHeight };
          windowRefs.current.set(win.id, clamped);

          return { ...win, ...clamped };
        }
        return win;
      });

      // Check for overlaps and adjust positions
      const finalWindows = updatedWindows.map((win, idx) => {
        const winBounds = windowRefs.current.get(win.id);
        if (!winBounds) return win;

        let adjusted = { ...winBounds };
        let hasOverlap = false;

        for (let i = 0; i < updatedWindows.length; i++) {
          if (i === idx) continue;

          const otherWin = updatedWindows[i];
          const otherBounds = windowRefs.current.get(otherWin.id);
          if (!otherBounds) continue;

          if (windowsOverlap(adjusted, otherBounds)) {
            hasOverlap = true;
            adjusted.x = Math.min(
              otherBounds.x + otherBounds.width + spacing,
              viewportWidth - adjusted.width
            );
            adjusted.y = Math.min(
              otherBounds.y + spacing,
              viewportHeight - adjusted.height
            );
          }
        }

        if (hasOverlap) {
          windowRefs.current.set(win.id, adjusted);
          return { ...win, ...adjusted };
        }

        return win;
      });

      return finalWindows;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', clampWindows);
    return () => window.removeEventListener('resize', clampWindows);
  }, [clampWindows]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Soapbox backend');
    });

    newSocket.on('grok_update', (data: GrokData[]) => {
      console.log('Received update:', data);
      setGrokUpdates(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Calculate optimal layout for all windows
  const calculateOptimalLayout = (windowCount: number): WindowBounds[] => {
    const viewportWidth = window.innerWidth - 40;
    const viewportHeight = window.innerHeight - 140;
    const padding = 20;
    const minWidth = 400;
    const minHeight = 300;

    // Get default size from settings
    const sizeMap: Record<string, number> = { small: 0.5, medium: 0.7, large: 0.9 };
    const sizeFactor = sizeMap[settings.workspaceLayout.defaultNewWindowSize ?? 'medium'] ?? 0.7;

    const layouts: WindowBounds[] = [];

    if (windowCount === 1) {
      layouts.push({
        x: padding,
        y: padding,
        width: Math.min(800 * sizeFactor, viewportWidth - padding * 2),
        height: Math.min(600 * sizeFactor, viewportHeight - padding * 2),
      });
    } else if (windowCount === 2) {
      const windowWidth = Math.max(minWidth, (viewportWidth - padding * 3) / 2);
      const windowHeight = Math.min(600, viewportHeight - padding * 2);

      layouts.push({
        x: padding,
        y: padding,
        width: windowWidth,
        height: windowHeight,
      });

      layouts.push({
        x: padding * 2 + windowWidth,
        y: padding,
        width: windowWidth,
        height: windowHeight,
      });
    } else if (windowCount === 3) {
      const leftWidth = Math.max(minWidth, (viewportWidth - padding * 3) * 0.6);
      const rightWidth = Math.max(minWidth, (viewportWidth - padding * 3) * 0.4);
      const rightHeight = Math.max(minHeight, (viewportHeight - padding * 3) / 2);

      layouts.push({
        x: padding,
        y: padding,
        width: leftWidth,
        height: viewportHeight - padding * 2,
      });

      layouts.push({
        x: padding * 2 + leftWidth,
        y: padding,
        width: rightWidth,
        height: rightHeight,
      });

      layouts.push({
        x: padding * 2 + leftWidth,
        y: padding * 2 + rightHeight,
        width: rightWidth,
        height: rightHeight,
      });
    } else {
      const cols = 2;
      const rows = Math.ceil(windowCount / cols);
      const windowWidth = Math.max(
        minWidth,
        (viewportWidth - padding * (cols + 1)) / cols
      );
      const windowHeight = Math.max(
        minHeight,
        (viewportHeight - padding * (rows + 1)) / rows
      );

      for (let i = 0; i < windowCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        layouts.push({
          x: padding + col * (windowWidth + padding),
          y: padding + row * (windowHeight + padding),
          width: windowWidth,
          height: windowHeight,
        });
      }
    }

    return layouts;
  };

  const openWindow = useCallback(
    (type: WindowType, title: string) => {
      const existing = windows.find((w) => w.type === type);
      if (existing) {
        if (existing.isMinimized) {
          restoreWindow(existing.id);
        } else {
          focusWindow(existing.id);
        }
        return;
      }

      const newId = Math.random().toString(36).substr(2, 9);
      const newWindowCount = windows.length + 1;
      const layouts = calculateOptimalLayout(newWindowCount);

      const updatedWindows = windows.map((win, idx) => {
        const layout = layouts[idx];
        windowRefs.current.set(win.id, layout);
        return { ...win, ...layout };
      });

      const newBounds = layouts[newWindowCount - 1];
      windowRefs.current.set(newId, newBounds);

      const newWindow: WindowState = {
        id: newId,
        type,
        title,
        isOpen: true,
        isMinimized: false,
        zIndex: maxZIndex + 1,
        ...newBounds,
      };

      setWindows([...updatedWindows, newWindow]);
      setMaxZIndex(maxZIndex + 1);
    },
    [windows, maxZIndex, settings.workspaceLayout.defaultNewWindowSize]
  );

  const closeWindow = useCallback(
    (id: string) => {
      windowRefs.current.delete(id);
      const remainingWindows = windows.filter((w) => w.id !== id);

      if (remainingWindows.length > 0) {
        const layouts = calculateOptimalLayout(remainingWindows.length);
        const updatedWindows = remainingWindows.map((win, idx) => {
          const layout = layouts[idx];
          windowRefs.current.set(win.id, layout);
          return { ...win, ...layout };
        });
        setWindows(updatedWindows);
      } else {
        setWindows([]);
      }
    },
    [windows, settings.workspaceLayout.defaultNewWindowSize]
  );

  const focusWindow = useCallback(
    (id: string) => {
      const nextZ = maxZIndex + 1;
      setWindows(windows.map((w) => (w.id === id ? { ...w, zIndex: nextZ } : w)));
      setMaxZIndex(nextZ);
    },
    [windows, maxZIndex]
  );

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const restoreWindow = useCallback(
    (id: string) => {
      const nextZ = maxZIndex + 1;
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, isMinimized: false, zIndex: nextZ } : w
        )
      );
      setMaxZIndex(nextZ);
    },
    [maxZIndex]
  );

  const handleDrag = useCallback((id: string, x: number, y: number) => {
    const ref = windowRefs.current.get(id);
    if (ref) {
      const updated = { ...ref, x, y };
      windowRefs.current.set(id, updated);
      setWindows((prevWindows) =>
        prevWindows.map((w) => (w.id === id ? { ...w, x, y } : w))
      );
    }
  }, []);

  const handleResize = useCallback(
    (id: string, x: number, y: number, width: number, height: number) => {
      const updated = { x, y, width, height };
      windowRefs.current.set(id, updated);
      setWindows((prevWindows) =>
        prevWindows.map((w) =>
          w.id === id ? { ...w, x, y, width, height } : w
        )
      );
    },
    []
  );

  // Register hotkey handlers
  useHotkeyHandler(
    'openFeedWindow',
    useCallback(() => openWindow('streaming', 'Feed'), [openWindow])
  );

  useHotkeyHandler(
    'openCalendarWindow',
    useCallback(() => openWindow('calendar', 'Events'), [openWindow])
  );

  // Mobile stacked layout
  if (isMobile) {
    return (
      <main className="relative h-screen w-screen bg-black overflow-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Activity size={24} className="text-zinc-500" />
            <h1 className="text-2xl font-black tracking-tighter text-zinc-500 uppercase">
              Soapbox
            </h1>
          </div>

          {/* Stacked modules */}
          <div className="space-y-4">
            <div className="window-glass rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border-b border-zinc-700/50">
                <FeedIcon />
                <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Feed
                </span>
              </div>
              <div className="max-h-96 overflow-auto">
                <StreamingTicker data={grokUpdates} />
              </div>
            </div>

            <div className="window-glass rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border-b border-zinc-700/50">
                <CalendarIcon />
                <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Events
                </span>
              </div>
              <div className="max-h-96 overflow-auto">
                <CalendarModule data={grokUpdates} />
              </div>
            </div>
          </div>
        </div>

        <SettingsLauncher />
      </main>
    );
  }

  // Desktop draggable layout
  return (
    <main className="relative h-screen w-screen bg-black overflow-hidden selection:bg-zinc-700 selection:text-white">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none" />
      <div className="absolute top-8 left-8 flex items-center gap-3 pointer-events-none opacity-20">
        <Activity size={24} className="text-zinc-500" />
        <h1 className="text-2xl font-black tracking-tighter text-zinc-500 uppercase">
          Soapbox
        </h1>
      </div>

      {/* Windows Area */}
      <div id="main-content" className="relative h-full w-full p-4" role="main">
        {windows
          .filter((w) => !w.isMinimized)
          .map((window) => (
            <Window
              key={window.id}
              window={window}
              onClose={() => closeWindow(window.id)}
              onMinimize={() => minimizeWindow(window.id)}
              onFocus={() => focusWindow(window.id)}
              onDrag={(x, y) => handleDrag(window.id, x, y)}
              onResize={(x, y, w, h) => handleResize(window.id, x, y, w, h)}
            >
              {window.type === 'streaming' ? (
                <StreamingTicker data={grokUpdates} />
              ) : (
                <CalendarModule data={grokUpdates} />
              )}
            </Window>
          ))}
      </div>

      <SettingsLauncher />

      {/* Bottom Navbar */}
      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl z-[9999]"
        role="navigation"
        aria-label="Main navigation"
      >
        {(() => {
          const w = windows.find((win) => win.type === 'streaming');
          const isActive = Boolean(w);
          const isMinimized = Boolean(w?.isMinimized);
          return (
            <NavButton
              icon={<FeedIcon />}
              label="Feed"
              onClick={() => {
                if (!w) return openWindow('streaming', 'Feed');
                if (w.isMinimized) return restoreWindow(w.id);
                return focusWindow(w.id);
              }}
              isActive={isActive}
              isMinimized={isMinimized}
            />
          );
        })()}
        <div className="w-px h-6 bg-zinc-800 mx-1" aria-hidden="true" />
        <NavButton
          icon={<CalendarIcon />}
          label="Events"
          onClick={() => {
            const w = windows.find((win) => win.type === 'calendar');
            if (!w) return openWindow('calendar', 'Events');
            if (w.isMinimized) return restoreWindow(w.id);
            return focusWindow(w.id);
          }}
          isActive={windows.some((w) => w.type === 'calendar')}
          isMinimized={windows.find((w) => w.type === 'calendar')?.isMinimized}
        />
      </nav>
    </main>
  );
}
