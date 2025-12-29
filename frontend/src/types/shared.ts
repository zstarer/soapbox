// shared/types.ts
export interface GrokData {
  id?: string;
  content: string;
  tags: string[];
  sentiment: number; // -1.0 to +1.0
  relationships: Record<string, { linkedEntity: string; type: 'alliance' | 'conflict' | 'economic' | 'support' | 'opposition' }>;
  temporalLayer: 'historical' | 'current' | 'predictive';
  provenance: { source: string; credibility: number };
  interactionState: 'static' | 'streaming' | 'interactive';
  generatedAt: string; // ISO timestamp
  events?: Array<{
    date: string; // YYYY-MM-DD
    title: string;
    summary: string;
    impact: 'low' | 'medium' | 'high';
    tags: string[];
  }>;
}

// ============================================
// SETTINGS TYPES (Sprint 1 - SOAPBOX-13, 20, 21, 15)
// All fields optional for backward compatibility
// ============================================

export type Theme = 'dark' | 'light' | 'oled-black' | 'high-contrast' | 'custom';
export type FontFamily = 'system-sans' | 'serif' | 'monospace';
export type StreamingDirection = 'newest-top' | 'newest-bottom';
export type OverflowBehavior = 'truncate' | 'expand';
export type AutoMinimize = 'off' | '5m' | '10m' | '30m';
export type GridSnapStrength = 'off' | 'weak' | 'strong';
export type DefaultWindowSize = 'small' | 'medium' | 'large';
export type SentimentVisibility = 'always' | 'hover' | 'never';
export type TagDisplayMode = 'inline-chips' | 'tooltip' | 'hidden';
export type DateFormat = 'iso' | 'us' | 'eu';
export type TimeFormat = '12h' | '24h';
export type ScreenReaderVerbosity = 'concise' | 'verbose';
export type DataExportFormat = 'json' | 'csv' | 'markdown';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// 1. Appearance Settings (8 settings)
export interface AppearanceSettings {
  theme?: Theme;
  glassmorphismIntensity?: number; // 0-100
  borderRadiusScale?: number; // 0-32
  fontScale?: number; // 80-150
  fontFamily?: FontFamily;
  accentColor?: string; // hex color (premium)
  windowShadowIntensity?: number; // 0-100
  reducedMotion?: boolean;
}

// 2. Workspace & Layout Settings (7 settings)
export interface WorkspaceLayoutSettings {
  defaultTimeHorizon?: number; // 1, 3, 7, 30 days (premium gated)
  streamingDirection?: StreamingDirection;
  summaryLinesPerItem?: 1 | 2 | 3;
  overflowBehavior?: OverflowBehavior;
  autoMinimizeInactive?: AutoMinimize;
  gridSnapStrength?: GridSnapStrength;
  defaultNewWindowSize?: DefaultWindowSize;
}

// 3. Feed & Content Settings (9 settings)
export interface FeedContentSettings {
  defaultTemporalLayer?: 'historical' | 'current' | 'predictive';
  sentimentIndicatorVisibility?: SentimentVisibility;
  propagandaFlagsVisibility?: SentimentVisibility;
  tagDisplayMode?: TagDisplayMode;
  credibilityDimmingThreshold?: number; // 0.0-1.0
  autoExpandCalendarEvents?: boolean;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  localeOverride?: string; // e.g., 'en-US', 'de-DE'
}

// 4. Keyboard & Input Settings (6 settings)
export interface HotkeyBinding {
  key: string; // e.g., 'KeyS', 'Digit1'
  modifiers: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
}

export type HotkeyAction =
  | 'openSettings'
  | 'switchWorkspace1'
  | 'switchWorkspace2'
  | 'switchWorkspace3'
  | 'switchWorkspace4'
  | 'switchWorkspace5'
  | 'switchWorkspace6'
  | 'switchWorkspace7'
  | 'switchWorkspace8'
  | 'switchWorkspace9'
  | 'openFeedWindow'
  | 'openCalendarWindow'
  | 'toggleFutureFilter'
  | 'openHotkeyCheatsheet';

export interface KeyboardInputSettings {
  hotkeys?: Partial<Record<HotkeyAction, HotkeyBinding>>;
}

// 5. Accessibility Settings (5 settings)
export interface AccessibilitySettings {
  highContrastModeOverride?: boolean;
  screenReaderVerbosity?: ScreenReaderVerbosity;
  focusOutlineThickness?: number; // 1-6px
  animationDurationScale?: number; // 0-200%
  colorVisionDeficiencyPreview?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'; // premium
}

// 6. Account & Subscription Settings (5 settings)
export interface AccountSubscriptionSettings {
  currentSubscriptionPlan?: SubscriptionTier;
  premiumFeaturePreview?: boolean;
  preferredDataExportFormat?: DataExportFormat;
  sessionTimeoutDuration?: number; // minutes (0 = never)
}

// Combined User Settings
export interface UserSettings {
  appearance?: AppearanceSettings;
  workspaceLayout?: WorkspaceLayoutSettings;
  feedContent?: FeedContentSettings;
  keyboardInput?: KeyboardInputSettings;
  accessibility?: AccessibilitySettings;
  accountSubscription?: AccountSubscriptionSettings;
}

// Default settings with sensible values
export const DEFAULT_SETTINGS: Required<UserSettings> = {
  appearance: {
    theme: 'dark',
    glassmorphismIntensity: 80,
    borderRadiusScale: 12,
    fontScale: 100,
    fontFamily: 'system-sans',
    accentColor: '#3b82f6',
    windowShadowIntensity: 60,
    reducedMotion: false,
  },
  workspaceLayout: {
    defaultTimeHorizon: 7,
    streamingDirection: 'newest-top',
    summaryLinesPerItem: 2,
    overflowBehavior: 'truncate',
    autoMinimizeInactive: 'off',
    gridSnapStrength: 'weak',
    defaultNewWindowSize: 'medium',
  },
  feedContent: {
    defaultTemporalLayer: 'current',
    sentimentIndicatorVisibility: 'always',
    propagandaFlagsVisibility: 'hover',
    tagDisplayMode: 'inline-chips',
    credibilityDimmingThreshold: 0.3,
    autoExpandCalendarEvents: true,
    dateFormat: 'iso',
    timeFormat: '24h',
    localeOverride: '',
  },
  keyboardInput: {
    hotkeys: {
      openSettings: { key: 'Comma', modifiers: { meta: true } },
      openHotkeyCheatsheet: { key: 'Slash', modifiers: { shift: true } },
      openFeedWindow: { key: 'KeyF', modifiers: { meta: true, shift: true } },
      openCalendarWindow: { key: 'KeyE', modifiers: { meta: true, shift: true } },
      toggleFutureFilter: { key: 'KeyP', modifiers: { meta: true } },
      switchWorkspace1: { key: 'Digit1', modifiers: { meta: true } },
      switchWorkspace2: { key: 'Digit2', modifiers: { meta: true } },
      switchWorkspace3: { key: 'Digit3', modifiers: { meta: true } },
      switchWorkspace4: { key: 'Digit4', modifiers: { meta: true } },
      switchWorkspace5: { key: 'Digit5', modifiers: { meta: true } },
      switchWorkspace6: { key: 'Digit6', modifiers: { meta: true } },
      switchWorkspace7: { key: 'Digit7', modifiers: { meta: true } },
      switchWorkspace8: { key: 'Digit8', modifiers: { meta: true } },
      switchWorkspace9: { key: 'Digit9', modifiers: { meta: true } },
    },
  },
  accessibility: {
    highContrastModeOverride: false,
    screenReaderVerbosity: 'concise',
    focusOutlineThickness: 2,
    animationDurationScale: 100,
    colorVisionDeficiencyPreview: 'none',
  },
  accountSubscription: {
    currentSubscriptionPlan: 'free',
    premiumFeaturePreview: false,
    preferredDataExportFormat: 'json',
    sessionTimeoutDuration: 0,
  },
};

// ============================================
// WORKSPACE TYPES (Sprint 1 - SOAPBOX-10, 12)
// ============================================

export interface SerializedWindowState {
  id: string;
  type: 'streaming' | 'calendar';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string; // emoji
  settingsOverrides: Partial<UserSettings>; // workspace-specific settings
  windowState: SerializedWindowState[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_WORKSPACE: Workspace = {
  id: 'default',
  name: 'Default',
  icon: '🌐',
  settingsOverrides: {},
  windowState: [],
};

// ============================================
// API TYPES
// ============================================

export interface SettingsUpdatePayload {
  settings: Partial<UserSettings>;
}

export interface WorkspaceCreatePayload {
  name: string;
  icon?: string;
  settingsOverrides?: Partial<UserSettings>;
}

export interface WorkspaceUpdatePayload {
  name?: string;
  icon?: string;
  settingsOverrides?: Partial<UserSettings>;
  windowState?: SerializedWindowState[];
}

// Premium feature gating helper
export const PREMIUM_FEATURES: (keyof UserSettings | string)[] = [
  'appearance.theme.light',
  'appearance.theme.oled-black',
  'appearance.theme.high-contrast',
  'appearance.theme.custom',
  'appearance.accentColor',
  'workspaceLayout.defaultTimeHorizon.30',
  'accessibility.colorVisionDeficiencyPreview',
];

export function isPremiumFeature(path: string): boolean {
  return PREMIUM_FEATURES.some((feature) => path.startsWith(feature));
}

