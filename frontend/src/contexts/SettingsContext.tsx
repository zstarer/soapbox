'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import type {
  UserSettings,
  AppearanceSettings,
  WorkspaceLayoutSettings,
  FeedContentSettings,
  KeyboardInputSettings,
  AccessibilitySettings,
  AccountSubscriptionSettings,
  SubscriptionTier,
} from '@/types/shared';
import { DEFAULT_SETTINGS } from '@/types/shared';

const SETTINGS_STORAGE_KEY = 'soapbox_user_settings';

// ============================================
// TYPES
// ============================================

interface SettingsContextValue {
  // Current merged settings (global + workspace overrides)
  settings: Required<UserSettings>;
  // Raw global settings from server
  globalSettings: UserSettings;
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
  // Subscription tier for premium gating
  subscriptionTier: SubscriptionTier;
  // Check if feature is premium-locked
  isPremiumLocked: (feature: string) => boolean;
  // Update global settings
  updateSettings: (
    section: keyof UserSettings,
    updates: Partial<
      | AppearanceSettings
      | WorkspaceLayoutSettings
      | FeedContentSettings
      | KeyboardInputSettings
      | AccessibilitySettings
      | AccountSubscriptionSettings
    >
  ) => Promise<void>;
  // Reset settings to defaults
  resetSettings: () => Promise<void>;
  // Refetch settings from server
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ============================================
// DEEP MERGE UTILITY
// ============================================

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target } as T;

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

// ============================================
// PROVIDER
// ============================================

interface SettingsProviderProps {
  children: ReactNode;
  // Optional workspace overrides (from WorkspacesContext)
  workspaceOverrides?: Partial<UserSettings>;
}

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
}

// Helper to get auth headers with token from session
function getAuthHeaders(backendToken?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (backendToken) {
    headers['Authorization'] = `Bearer ${backendToken}`;
  }
  return headers;
}

export function SettingsProvider({
  children,
  workspaceOverrides = {},
}: SettingsProviderProps) {
  const { data: session, status } = useSession();
  const [globalSettings, setGlobalSettings] = useState<UserSettings>({});
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const initialLoadDone = useRef(false);

  // Merge global settings + workspace overrides + defaults
  const settings = useMemo((): Required<UserSettings> => {
    const merged = deepMerge(
      deepMerge(DEFAULT_SETTINGS, globalSettings),
      workspaceOverrides
    );
    return merged as Required<UserSettings>;
  }, [globalSettings, workspaceOverrides]);

  // Load settings from localStorage
  const loadFromLocalStorage = useCallback((): UserSettings => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  // Save settings to localStorage
  const saveToLocalStorage = useCallback((settings: UserSettings) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Failed to save settings to localStorage:', err);
    }
  }, []);

  // Fetch settings from backend (with localStorage fallback)
  const fetchSettings = useCallback(async () => {
    if (status === 'loading') {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try backend first if authenticated
      if (status === 'authenticated' && session) {
        const response = await fetch(`${getBackendBaseUrl()}/api/user/settings`, {
          method: 'GET',
          credentials: 'include',
          headers: getAuthHeaders(session?.backendToken),
        });

        if (response.ok) {
          const data = await response.json();
          setGlobalSettings(data.settings || {});
          setSubscriptionTier(data.subscriptionTier || 'free');
          setUseLocalStorage(false);
          return;
        }
      }

      // Fallback to localStorage
      console.info('Using localStorage for settings (backend unavailable or not authenticated)');
      const localSettings = loadFromLocalStorage();
      setGlobalSettings(localSettings);
      setUseLocalStorage(true);
    } catch (err) {
      console.warn('Backend settings unavailable, using localStorage:', err);
      const localSettings = loadFromLocalStorage();
      setGlobalSettings(localSettings);
      setUseLocalStorage(true);
    } finally {
      setIsLoading(false);
      initialLoadDone.current = true;
    }
  }, [session, status, loadFromLocalStorage]);

  // Fetch settings on mount and session change
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update settings
  const updateSettings = useCallback(
    async (
      section: keyof UserSettings,
      updates: Partial<
        | AppearanceSettings
        | WorkspaceLayoutSettings
        | FeedContentSettings
        | KeyboardInputSettings
        | AccessibilitySettings
        | AccountSubscriptionSettings
      >
    ) => {
      // Calculate new settings
      const newGlobalSettings: UserSettings = {
        ...globalSettings,
        [section]: deepMerge(
          (globalSettings[section] || {}) as Record<string, unknown>,
          updates as Record<string, unknown>
        ),
      };

      // Update state immediately
      setGlobalSettings(newGlobalSettings);

      // If using localStorage mode, just save there
      if (useLocalStorage) {
        saveToLocalStorage(newGlobalSettings);
        return;
      }

      // Try to sync with backend
      if (status === 'authenticated' && session) {
        try {
          const response = await fetch(`${getBackendBaseUrl()}/api/user/settings`, {
            method: 'PATCH',
            credentials: 'include',
            headers: getAuthHeaders(session?.backendToken),
            body: JSON.stringify({
              settings: {
                [section]: updates,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setGlobalSettings(data.settings || newGlobalSettings);
            return;
          }
        } catch (err) {
          console.warn('Failed to sync settings with backend, using localStorage:', err);
        }
      }

      // Fallback to localStorage if backend fails
      setUseLocalStorage(true);
      saveToLocalStorage(newGlobalSettings);
    },
    [status, globalSettings, useLocalStorage, saveToLocalStorage]
  );

  // Reset to defaults
  const resetSettings = useCallback(async () => {
    // Reset local state
    setGlobalSettings({});

    // If using localStorage, clear it
    if (useLocalStorage) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
      }
      return;
    }

    // Try to reset on backend
    if (status === 'authenticated' && session) {
      try {
        const response = await fetch(`${getBackendBaseUrl()}/api/user/settings`, {
          method: 'PATCH',
          credentials: 'include',
          headers: getAuthHeaders(session?.backendToken),
          body: JSON.stringify({
            settings: {},
          }),
        });

        if (!response.ok) {
          console.warn('Failed to reset settings on backend');
        }
      } catch (err) {
        console.warn('Failed to reset settings on backend:', err);
      }
    }

    // Also clear localStorage as fallback
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  }, [status, useLocalStorage]);

  // Check if feature is premium-locked
  const isPremiumLocked = useCallback(
    (feature: string): boolean => {
      if (subscriptionTier === 'pro' || subscriptionTier === 'enterprise') {
        return false;
      }

      // Premium features list
      const premiumFeatures = [
        'appearance.theme.light',
        'appearance.theme.oled-black',
        'appearance.theme.high-contrast',
        'appearance.theme.custom',
        'appearance.accentColor',
        'workspaceLayout.defaultTimeHorizon.30',
        'accessibility.colorVisionDeficiencyPreview',
      ];

      return premiumFeatures.some((pf) => feature.startsWith(pf));
    },
    [subscriptionTier]
  );

  const value = useMemo(
    (): SettingsContextValue => ({
      settings,
      globalSettings,
      isLoading,
      error,
      subscriptionTier,
      isPremiumLocked,
      updateSettings,
      resetSettings,
      refetch: fetchSettings,
    }),
    [
      settings,
      globalSettings,
      isLoading,
      error,
      subscriptionTier,
      isPremiumLocked,
      updateSettings,
      resetSettings,
      fetchSettings,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
}

// Export context for advanced use cases
export { SettingsContext };

