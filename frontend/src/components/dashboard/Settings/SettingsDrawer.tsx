'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, Lock, ChevronRight } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useWorkspaces } from '@/contexts/WorkspacesContext';
import { useHotkeys } from '@/contexts/HotkeyContext';
import type { Workspace } from '@/types/shared';

// ============================================
// TYPES
// ============================================

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SectionId =
  | 'appearance'
  | 'workspace-layout'
  | 'feed-content'
  | 'keyboard'
  | 'accessibility'
  | 'account';

// ============================================
// ACCORDION COMPONENTS
// ============================================

interface AccordionProps {
  children: React.ReactNode;
  defaultOpen?: SectionId[];
}

interface AccordionItemProps {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({
  title,
  icon,
  children,
  isOpen,
  onToggle,
}: AccordionItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen, children]);

  return (
    <div className="border-b border-zinc-800/50">
      <button
        type="button"
        onClick={onToggle}
        className="accordion-trigger"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`accordion-chevron text-zinc-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-200"
        style={{ height: height ?? 0 }}
        data-state={isOpen ? 'open' : 'closed'}
      >
        <div className="p-4 space-y-3 bg-zinc-900/30">{children}</div>
      </div>
    </div>
  );
}

// ============================================
// FORM CONTROLS
// ============================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}

function ToggleSwitch({ checked, onChange, disabled, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`toggle-switch ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      data-state={checked ? 'checked' : 'unchecked'}
    >
      <span className="toggle-switch-thumb" />
    </button>
  );
}

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label: string;
  formatValue?: (value: number) => string;
}

function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled,
  label,
  formatValue,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-3 w-full max-w-[180px]">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        aria-label={label}
        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
      />
      <span className="text-xs text-zinc-400 min-w-[40px] text-right">
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
  );
}

interface SelectProps {
  value: string;
  options: { value: string; label: string; premium?: boolean }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
}

function Select({ value, options, onChange, disabled, label }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label}
      className="select-trigger appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.premium}>
          {opt.label} {opt.premium ? '🔒' : ''}
        </option>
      ))}
    </select>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  premium?: boolean;
  children: React.ReactNode;
}

function SettingRow({ label, description, premium, children }: SettingRowProps) {
  const { isPremiumLocked, subscriptionTier } = useSettings();
  const isLocked = premium && isPremiumLocked(label);

  return (
    <div
      className={`setting-row ${isLocked ? 'premium-locked' : ''}`}
      title={isLocked ? 'Upgrade to Pro to unlock this feature' : undefined}
    >
      <div className="setting-label">
        <div className="setting-label-text flex items-center gap-2">
          {label}
          {premium && subscriptionTier === 'free' && (
            <Lock size={12} className="premium-lock-icon" />
          )}
        </div>
        {description && (
          <div className="setting-label-description">{description}</div>
        )}
      </div>
      <div className={isLocked ? 'pointer-events-none' : ''}>{children}</div>
    </div>
  );
}

// ============================================
// SECTION COMPONENTS
// ============================================

function AppearanceSection() {
  const { settings, updateSettings, isPremiumLocked } = useSettings();
  const appearance = settings.appearance ?? {};

  return (
    <>
      <SettingRow label="Theme" description="Choose your interface theme">
        <Select
          value={appearance.theme ?? 'dark'}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light', premium: true },
            { value: 'oled-black', label: 'OLED Black', premium: true },
            { value: 'high-contrast', label: 'High Contrast', premium: true },
          ]}
          onChange={(v) =>
            updateSettings('appearance', { theme: v as typeof appearance.theme })
          }
          label="Theme selector"
        />
      </SettingRow>

      <SettingRow
        label="Glassmorphism"
        description="Window transparency intensity"
      >
        <Slider
          value={appearance.glassmorphismIntensity ?? 80}
          min={0}
          max={100}
          onChange={(v) => updateSettings('appearance', { glassmorphismIntensity: v })}
          label="Glassmorphism intensity"
          formatValue={(v) => `${v}%`}
        />
      </SettingRow>

      <SettingRow label="Border Radius" description="Corner roundness scale">
        <Slider
          value={appearance.borderRadiusScale ?? 12}
          min={0}
          max={32}
          onChange={(v) => updateSettings('appearance', { borderRadiusScale: v })}
          label="Border radius scale"
          formatValue={(v) => `${v}px`}
        />
      </SettingRow>

      <SettingRow label="Font Scale" description="Global text size multiplier">
        <Slider
          value={appearance.fontScale ?? 100}
          min={80}
          max={150}
          step={5}
          onChange={(v) => updateSettings('appearance', { fontScale: v })}
          label="Font scale"
          formatValue={(v) => `${v}%`}
        />
      </SettingRow>

      <SettingRow label="Font Family" description="Primary typeface">
        <Select
          value={appearance.fontFamily ?? 'system-sans'}
          options={[
            { value: 'system-sans', label: 'System Sans' },
            { value: 'serif', label: 'Serif' },
            { value: 'monospace', label: 'Monospace' },
          ]}
          onChange={(v) =>
            updateSettings('appearance', { fontFamily: v as typeof appearance.fontFamily })
          }
          label="Font family selector"
        />
      </SettingRow>

      <SettingRow label="Accent Color" description="Primary accent color" premium>
        <input
          type="color"
          value={appearance.accentColor ?? '#3b82f6'}
          onChange={(e) => updateSettings('appearance', { accentColor: e.target.value })}
          className="color-picker"
          disabled={isPremiumLocked('appearance.accentColor')}
          aria-label="Accent color picker"
        />
      </SettingRow>

      <SettingRow label="Shadow Intensity" description="Window shadow depth">
        <Slider
          value={appearance.windowShadowIntensity ?? 60}
          min={0}
          max={100}
          onChange={(v) => updateSettings('appearance', { windowShadowIntensity: v })}
          label="Shadow intensity"
          formatValue={(v) => `${v}%`}
        />
      </SettingRow>

      <SettingRow
        label="Reduced Motion"
        description="Minimize animations for accessibility"
      >
        <ToggleSwitch
          checked={appearance.reducedMotion ?? false}
          onChange={(v) => updateSettings('appearance', { reducedMotion: v })}
          label="Reduced motion toggle"
        />
      </SettingRow>
    </>
  );
}

function WorkspaceLayoutSection() {
  const { settings, updateSettings } = useSettings();
  const layout = settings.workspaceLayout ?? {};

  return (
    <>
      <SettingRow
        label="Time Horizon"
        description="Default temporal view range"
        premium={(layout.defaultTimeHorizon ?? 7) === 30}
      >
        <Select
          value={String(layout.defaultTimeHorizon ?? 7)}
          options={[
            { value: '1', label: '1 Day' },
            { value: '3', label: '3 Days' },
            { value: '7', label: '7 Days' },
            { value: '30', label: '30 Days', premium: true },
          ]}
          onChange={(v) =>
            updateSettings('workspaceLayout', { defaultTimeHorizon: Number(v) })
          }
          label="Time horizon selector"
        />
      </SettingRow>

      <SettingRow
        label="Streaming Direction"
        description="New items appear at top or bottom"
      >
        <Select
          value={layout.streamingDirection ?? 'newest-top'}
          options={[
            { value: 'newest-top', label: 'Newest Top' },
            { value: 'newest-bottom', label: 'Newest Bottom' },
          ]}
          onChange={(v) =>
            updateSettings('workspaceLayout', {
              streamingDirection: v as typeof layout.streamingDirection,
            })
          }
          label="Streaming direction"
        />
      </SettingRow>

      <SettingRow label="Summary Lines" description="Lines shown per feed item">
        <Select
          value={String(layout.summaryLinesPerItem ?? 2)}
          options={[
            { value: '1', label: '1 Line' },
            { value: '2', label: '2 Lines' },
            { value: '3', label: '3 Lines' },
          ]}
          onChange={(v) =>
            updateSettings('workspaceLayout', {
              summaryLinesPerItem: Number(v) as 1 | 2 | 3,
            })
          }
          label="Summary lines"
        />
      </SettingRow>

      <SettingRow label="Overflow Behavior" description="How long text is handled">
        <Select
          value={layout.overflowBehavior ?? 'truncate'}
          options={[
            { value: 'truncate', label: 'Truncate' },
            { value: 'expand', label: 'Expand' },
          ]}
          onChange={(v) =>
            updateSettings('workspaceLayout', {
              overflowBehavior: v as typeof layout.overflowBehavior,
            })
          }
          label="Overflow behavior"
        />
      </SettingRow>

      <SettingRow
        label="Auto-Minimize"
        description="Minimize inactive windows after"
      >
        <Select
          value={layout.autoMinimizeInactive ?? 'off'}
          options={[
            { value: 'off', label: 'Off' },
            { value: '5m', label: '5 Minutes' },
            { value: '10m', label: '10 Minutes' },
            { value: '30m', label: '30 Minutes' },
          ]}
          onChange={(v) =>
            updateSettings('workspaceLayout', {
              autoMinimizeInactive: v as typeof layout.autoMinimizeInactive,
            })
          }
          label="Auto-minimize"
        />
      </SettingRow>

      <SettingRow label="Grid Snap" description="Window snapping strength">
        <Select
          value={layout.gridSnapStrength ?? 'weak'}
          options={[
            { value: 'off', label: 'Off' },
            { value: 'weak', label: 'Weak' },
            { value: 'strong', label: 'Strong' },
          ]}
          onChange={(v) =>
            updateSettings('workspaceLayout', {
              gridSnapStrength: v as typeof layout.gridSnapStrength,
            })
          }
          label="Grid snap strength"
        />
      </SettingRow>

      <SettingRow label="Default Window Size" description="Size for new windows">
        <Select
          value={layout.defaultNewWindowSize ?? 'medium'}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
          onChange={(v) =>
            updateSettings('workspaceLayout', {
              defaultNewWindowSize: v as typeof layout.defaultNewWindowSize,
            })
          }
          label="Default window size"
        />
      </SettingRow>
    </>
  );
}

function FeedContentSection() {
  const { settings, updateSettings } = useSettings();
  const feed = settings.feedContent ?? {};

  return (
    <>
      <SettingRow
        label="Default Layer"
        description="Initial temporal layer for new workspaces"
      >
        <Select
          value={feed.defaultTemporalLayer ?? 'current'}
          options={[
            { value: 'historical', label: 'Historical' },
            { value: 'current', label: 'Current' },
            { value: 'predictive', label: 'Predictive' },
          ]}
          onChange={(v) =>
            updateSettings('feedContent', {
              defaultTemporalLayer: v as typeof feed.defaultTemporalLayer,
            })
          }
          label="Default temporal layer"
        />
      </SettingRow>

      <SettingRow
        label="Sentiment Indicators"
        description="When to show sentiment scores"
      >
        <Select
          value={feed.sentimentIndicatorVisibility ?? 'always'}
          options={[
            { value: 'always', label: 'Always' },
            { value: 'hover', label: 'On Hover' },
            { value: 'never', label: 'Never' },
          ]}
          onChange={(v) =>
            updateSettings('feedContent', {
              sentimentIndicatorVisibility: v as typeof feed.sentimentIndicatorVisibility,
            })
          }
          label="Sentiment visibility"
        />
      </SettingRow>

      <SettingRow
        label="Propaganda Flags"
        description="When to show propaganda alerts"
      >
        <Select
          value={feed.propagandaFlagsVisibility ?? 'hover'}
          options={[
            { value: 'always', label: 'Always' },
            { value: 'hover', label: 'On Hover' },
            { value: 'never', label: 'Never' },
          ]}
          onChange={(v) =>
            updateSettings('feedContent', {
              propagandaFlagsVisibility: v as typeof feed.propagandaFlagsVisibility,
            })
          }
          label="Propaganda flags visibility"
        />
      </SettingRow>

      <SettingRow label="Tag Display" description="How tags are shown on items">
        <Select
          value={feed.tagDisplayMode ?? 'inline-chips'}
          options={[
            { value: 'inline-chips', label: 'Inline Chips' },
            { value: 'tooltip', label: 'Tooltip' },
            { value: 'hidden', label: 'Hidden' },
          ]}
          onChange={(v) =>
            updateSettings('feedContent', {
              tagDisplayMode: v as typeof feed.tagDisplayMode,
            })
          }
          label="Tag display mode"
        />
      </SettingRow>

      <SettingRow
        label="Credibility Dimming"
        description="Dim items below this credibility score"
      >
        <Slider
          value={feed.credibilityDimmingThreshold ?? 0.3}
          min={0}
          max={1}
          step={0.1}
          onChange={(v) =>
            updateSettings('feedContent', { credibilityDimmingThreshold: v })
          }
          label="Credibility threshold"
          formatValue={(v) => v.toFixed(1)}
        />
      </SettingRow>

      <SettingRow
        label="Auto-Expand Events"
        description="Expand calendar events by default"
      >
        <ToggleSwitch
          checked={feed.autoExpandCalendarEvents ?? true}
          onChange={(v) =>
            updateSettings('feedContent', { autoExpandCalendarEvents: v })
          }
          label="Auto-expand calendar events"
        />
      </SettingRow>

      <SettingRow label="Date Format" description="How dates are displayed">
        <Select
          value={feed.dateFormat ?? 'iso'}
          options={[
            { value: 'iso', label: 'ISO (2025-12-29)' },
            { value: 'us', label: 'US (12/29/2025)' },
            { value: 'eu', label: 'EU (29/12/2025)' },
          ]}
          onChange={(v) =>
            updateSettings('feedContent', { dateFormat: v as typeof feed.dateFormat })
          }
          label="Date format"
        />
      </SettingRow>

      <SettingRow label="Time Format" description="12 or 24 hour clock">
        <Select
          value={feed.timeFormat ?? '24h'}
          options={[
            { value: '12h', label: '12 Hour' },
            { value: '24h', label: '24 Hour' },
          ]}
          onChange={(v) =>
            updateSettings('feedContent', { timeFormat: v as typeof feed.timeFormat })
          }
          label="Time format"
        />
      </SettingRow>

      <SettingRow label="Locale Override" description="Language and region format">
        <input
          type="text"
          value={feed.localeOverride ?? ''}
          onChange={(e) =>
            updateSettings('feedContent', { localeOverride: e.target.value })
          }
          placeholder="e.g., en-US"
          className="select-trigger w-24 text-center"
          aria-label="Locale override"
        />
      </SettingRow>
    </>
  );
}

function KeyboardSection() {
  const { hotkeys, formatBinding } = useHotkeys();
  const { settings, updateSettings } = useSettings();

  return (
    <>
      <div className="text-xs text-zinc-400 mb-4">
        Press <span className="hotkey-key">?</span> or{' '}
        <span className="hotkey-key">Ctrl</span>+<span className="hotkey-key">/</span>{' '}
        to view all shortcuts
      </div>

      {hotkeys
        .filter((h) => !h.action.startsWith('switchWorkspace'))
        .map((hotkey) => (
          <SettingRow
            key={hotkey.action}
            label={hotkey.label}
            description={hotkey.description}
          >
            <div className="flex items-center gap-1">
              {formatBinding(hotkey.binding)
                .split('')
                .map((char, i) =>
                  char === '+' ? (
                    <span key={i} className="text-zinc-500">
                      +
                    </span>
                  ) : (
                    <span key={i} className="hotkey-key">
                      {char}
                    </span>
                  )
                )}
            </div>
          </SettingRow>
        ))}
    </>
  );
}

function AccessibilitySection() {
  const { settings, updateSettings, isPremiumLocked } = useSettings();
  const accessibility = settings.accessibility ?? {};

  return (
    <>
      <SettingRow
        label="High Contrast Override"
        description="Force high contrast mode"
      >
        <ToggleSwitch
          checked={accessibility.highContrastModeOverride ?? false}
          onChange={(v) =>
            updateSettings('accessibility', { highContrastModeOverride: v })
          }
          label="High contrast mode"
        />
      </SettingRow>

      <SettingRow
        label="Screen Reader Verbosity"
        description="Amount of detail for screen readers"
      >
        <Select
          value={accessibility.screenReaderVerbosity ?? 'concise'}
          options={[
            { value: 'concise', label: 'Concise' },
            { value: 'verbose', label: 'Verbose' },
          ]}
          onChange={(v) =>
            updateSettings('accessibility', {
              screenReaderVerbosity: v as typeof accessibility.screenReaderVerbosity,
            })
          }
          label="Screen reader verbosity"
        />
      </SettingRow>

      <SettingRow
        label="Focus Outline Thickness"
        description="Visibility of keyboard focus"
      >
        <Slider
          value={accessibility.focusOutlineThickness ?? 2}
          min={1}
          max={6}
          onChange={(v) =>
            updateSettings('accessibility', { focusOutlineThickness: v })
          }
          label="Focus outline thickness"
          formatValue={(v) => `${v}px`}
        />
      </SettingRow>

      <SettingRow
        label="Animation Duration"
        description="Speed of all animations"
      >
        <Slider
          value={accessibility.animationDurationScale ?? 100}
          min={0}
          max={200}
          step={10}
          onChange={(v) =>
            updateSettings('accessibility', { animationDurationScale: v })
          }
          label="Animation duration scale"
          formatValue={(v) => `${v}%`}
        />
      </SettingRow>

      <SettingRow
        label="Color Vision Preview"
        description="Preview interface with color blindness simulation"
        premium
      >
        <Select
          value={accessibility.colorVisionDeficiencyPreview ?? 'none'}
          options={[
            { value: 'none', label: 'None' },
            { value: 'protanopia', label: 'Protanopia', premium: true },
            { value: 'deuteranopia', label: 'Deuteranopia', premium: true },
            { value: 'tritanopia', label: 'Tritanopia', premium: true },
          ]}
          onChange={(v) =>
            updateSettings('accessibility', {
              colorVisionDeficiencyPreview:
                v as typeof accessibility.colorVisionDeficiencyPreview,
            })
          }
          disabled={isPremiumLocked('accessibility.colorVisionDeficiencyPreview')}
          label="Color vision deficiency preview"
        />
      </SettingRow>
    </>
  );
}

function AccountSection() {
  const { settings, updateSettings, subscriptionTier } = useSettings();
  const account = settings.accountSubscription ?? {};

  const handleLogout = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <SettingRow
        label="Subscription Plan"
        description="Your current subscription tier"
      >
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${
              subscriptionTier === 'free'
                ? 'bg-zinc-800 text-zinc-300'
                : subscriptionTier === 'pro'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            }`}
          >
            {subscriptionTier}
          </span>
        </div>
      </SettingRow>

      {subscriptionTier === 'free' && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-amber-400">
                Upgrade to Pro
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Unlock all themes, advanced features, and priority support
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors flex items-center gap-1"
            >
              Upgrade <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      <SettingRow
        label="Premium Feature Preview"
        description="Try premium features before upgrading"
      >
        <ToggleSwitch
          checked={account.premiumFeaturePreview ?? false}
          onChange={(v) =>
            updateSettings('accountSubscription', { premiumFeaturePreview: v })
          }
          label="Premium feature preview"
        />
      </SettingRow>

      <SettingRow
        label="Export Format"
        description="Preferred format for data exports"
      >
        <Select
          value={account.preferredDataExportFormat ?? 'json'}
          options={[
            { value: 'json', label: 'JSON' },
            { value: 'csv', label: 'CSV' },
            { value: 'markdown', label: 'Markdown' },
          ]}
          onChange={(v) =>
            updateSettings('accountSubscription', {
              preferredDataExportFormat:
                v as typeof account.preferredDataExportFormat,
            })
          }
          label="Export format"
        />
      </SettingRow>

      <SettingRow
        label="Session Timeout"
        description="Auto-logout after inactivity (0 = never)"
      >
        <Slider
          value={account.sessionTimeoutDuration ?? 0}
          min={0}
          max={120}
          step={15}
          onChange={(v) =>
            updateSettings('accountSubscription', { sessionTimeoutDuration: v })
          }
          label="Session timeout"
          formatValue={(v) => (v === 0 ? 'Never' : `${v}m`)}
        />
      </SettingRow>

      <div className="pt-3 border-t border-zinc-800">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2 px-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </>
  );
}

// ============================================
// WORKSPACE SELECTOR
// ============================================

function WorkspaceSelector() {
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace } =
    useWorkspaces();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📁');

  const handleCreate = async () => {
    if (newName.trim()) {
      await createWorkspace(newName.trim(), newIcon);
      setNewName('');
      setNewIcon('📁');
      setShowCreate(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="workspace-selector w-full"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="workspace-icon">{currentWorkspace.icon}</span>
        <span className="workspace-name flex-1 text-left truncate">
          {currentWorkspace.name}
        </span>
        <ChevronDown
          size={14}
          className={`text-zinc-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-10">
          <div
            role="listbox"
            aria-label="Select workspace"
            className="max-h-48 overflow-y-auto"
          >
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                role="option"
                aria-selected={ws.id === currentWorkspace.id}
                onClick={() => {
                  switchWorkspace(ws.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800 transition-colors ${
                  ws.id === currentWorkspace.id ? 'bg-zinc-800' : ''
                }`}
              >
                <span>{ws.icon}</span>
                <span className="text-sm text-zinc-200 truncate">{ws.name}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-700 p-2">
            {showCreate ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value.slice(0, 2))}
                    className="w-10 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-center text-sm"
                    placeholder="📁"
                  />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Workspace name"
                    className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="flex-1 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              >
                + New Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN DRAWER
// ============================================

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    new Set(['appearance'])
  );
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus and manage focus trap
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus first focusable element
      setTimeout(() => {
        const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 100);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Toggle section
  const toggleSection = useCallback((id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (!isOpen) return null;

  const sections: Array<{
    id: SectionId;
    title: string;
    icon: React.ReactNode;
    component: React.ReactNode;
  }> = [
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <span className="text-sm">🎨</span>,
      component: <AppearanceSection />,
    },
    {
      id: 'workspace-layout',
      title: 'Workspace & Layout',
      icon: <span className="text-sm">📐</span>,
      component: <WorkspaceLayoutSection />,
    },
    {
      id: 'feed-content',
      title: 'Feed & Content',
      icon: <span className="text-sm">📰</span>,
      component: <FeedContentSection />,
    },
    {
      id: 'keyboard',
      title: 'Keyboard & Input',
      icon: <span className="text-sm">⌨️</span>,
      component: <KeyboardSection />,
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      icon: <span className="text-sm">♿</span>,
      component: <AccessibilitySection />,
    },
    {
      id: 'account',
      title: 'Account & Subscription',
      icon: <span className="text-sm">👤</span>,
      component: <AccountSection />,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="settings-drawer animate-slide-in-right"
        data-state="open"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h2
              id="settings-title"
              className="text-xs font-medium text-zinc-300 uppercase tracking-wider"
            >
              Settings
            </h2>
            <div className="flex-1 min-w-0">
              <WorkspaceSelector />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors ml-2"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <AccordionItem
              key={section.id}
              id={section.id}
              title={section.title}
              icon={section.icon}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            >
              {section.component}
            </AccordionItem>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-800/30 border-t border-zinc-700/50">
          <div className="text-[10px] text-zinc-500 text-center">
            Press{' '}
            <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">
              ?
            </kbd>{' '}
            for keyboard shortcuts
          </div>
        </div>
      </div>
    </>
  );
}

