'use client';

import React, { ReactNode, useMemo } from 'react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { WorkspacesProvider, useWorkspaces } from '@/contexts/WorkspacesContext';
import { HotkeyProvider } from '@/contexts/HotkeyContext';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Inner provider that connects SettingsContext with WorkspacesContext
 * for workspace-specific settings overrides
 */
function SettingsWithWorkspaceOverrides({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspaces();
  const workspaceOverrides = currentWorkspace?.settingsOverrides || {};

  return (
    <SettingsProvider workspaceOverrides={workspaceOverrides}>
      {children}
    </SettingsProvider>
  );
}

/**
 * Hotkey provider that syncs with settings
 */
function HotkeyWithSettings({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettings();
  
  const customBindings = useMemo(
    () => settings.keyboardInput?.hotkeys || {},
    [settings.keyboardInput?.hotkeys]
  );

  const handleBindingsChange = (bindings: typeof customBindings) => {
    updateSettings('keyboardInput', { hotkeys: bindings });
  };

  return (
    <HotkeyProvider
      customBindings={customBindings}
      onBindingsChange={handleBindingsChange}
    >
      {children}
    </HotkeyProvider>
  );
}

/**
 * DashboardProviders
 * 
 * Wraps the dashboard with all required context providers:
 * - WorkspacesProvider: Manages workspace state
 * - SettingsProvider: Manages user settings with workspace overrides
 * - HotkeyProvider: Manages keyboard shortcuts
 */
export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <WorkspacesProvider>
      <SettingsWithWorkspaceOverrides>
        <HotkeyWithSettings>
          {children}
        </HotkeyWithSettings>
      </SettingsWithWorkspaceOverrides>
    </WorkspacesProvider>
  );
}

export default DashboardProviders;


