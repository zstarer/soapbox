'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SettingsDrawer } from './SettingsDrawer';
import { HotkeyCheatsheetModal } from './HotkeyCheatsheetModal';
import { useHotkeys, useHotkeyHandler } from '@/contexts/HotkeyContext';

/**
 * SettingsLauncher
 * 
 * Provides three entry points to settings:
 * 1. Subtle vertical trigger bar on right edge (hover to reveal)
 * 2. Hotkey (Cmd+,)
 * 3. Programmatic control via useSettings/useHotkeys
 * 
 * Also manages the hotkey cheatsheet modal.
 */
export function SettingsLauncher() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { isCheatsheetOpen, setCheatsheetOpen } = useHotkeys();

  // Register hotkey handler for opening settings
  useHotkeyHandler('openSettings', useCallback(() => {
    setDrawerOpen(true);
  }, []));

  // Apply theme and settings to DOM
  useEffect(() => {
    // This would read from SettingsContext and apply CSS variables
    // For now, we use the default dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-font', 'system-sans');
    document.documentElement.setAttribute('data-reduced-motion', 'false');
  }, []);

  return (
    <>
      {/* Subtle Right Edge Trigger Bar */}
      <button
        type="button"
        aria-label="Open settings"
        onClick={() => setDrawerOpen(true)}
        className="settings-trigger"
        tabIndex={0}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Hotkey Cheatsheet Modal */}
      <HotkeyCheatsheetModal
        isOpen={isCheatsheetOpen}
        onClose={() => setCheatsheetOpen(false)}
      />
    </>
  );
}

export default SettingsLauncher;
