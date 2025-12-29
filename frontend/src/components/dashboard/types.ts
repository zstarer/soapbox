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

