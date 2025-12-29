export type WindowType = 'streaming' | 'calendar';
export type SortOption = 'time-desc' | 'time-asc' | 'sentiment';

export interface WindowState {
  id: string;
  type: WindowType;
  title: string;
  isOpen: boolean;
  isMinimized?: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Serialized window state for persistence (Sprint 1 - SOAPBOX-12)
export interface SerializedWindowState {
  id: string;
  type: WindowType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized?: boolean;
}

// Convert WindowState to SerializedWindowState for persistence
export function serializeWindowState(window: WindowState): SerializedWindowState {
  return {
    id: window.id,
    type: window.type,
    title: window.title,
    x: window.x,
    y: window.y,
    width: window.width,
    height: window.height,
    isMinimized: window.isMinimized,
  };
}

// Convert SerializedWindowState back to WindowState
export function deserializeWindowState(
  serialized: SerializedWindowState,
  zIndex: number
): WindowState {
  return {
    ...serialized,
    isOpen: true,
    zIndex,
  };
}

