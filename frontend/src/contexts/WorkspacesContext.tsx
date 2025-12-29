'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import type {
  Workspace,
  SerializedWindowState,
  UserSettings,
} from '@/types/shared';
import { DEFAULT_WORKSPACE } from '@/types/shared';

// ============================================
// TYPES
// ============================================

interface WorkspacesContextValue {
  // All workspaces
  workspaces: Workspace[];
  // Currently active workspace
  currentWorkspace: Workspace;
  // Current workspace ID
  currentWorkspaceId: string;
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
  // Switch to a workspace
  switchWorkspace: (workspaceId: string) => void;
  // Create a new workspace
  createWorkspace: (name: string, icon?: string) => Promise<Workspace>;
  // Update a workspace
  updateWorkspace: (
    workspaceId: string,
    updates: {
      name?: string;
      icon?: string;
      settingsOverrides?: Partial<UserSettings>;
    }
  ) => Promise<void>;
  // Delete a workspace
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  // Save window state to current workspace
  saveWindowState: (windowState: SerializedWindowState[]) => Promise<void>;
  // Get workspace settings overrides (for SettingsContext)
  getWorkspaceOverrides: () => Partial<UserSettings>;
  // Refetch workspaces
  refetch: () => Promise<void>;
}

const WorkspacesContext = createContext<WorkspacesContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface WorkspacesProviderProps {
  children: ReactNode;
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

const WORKSPACE_STORAGE_KEY = 'soapbox_current_workspace';

export function WorkspacesProvider({ children }: WorkspacesProviderProps) {
  const { data: session, status } = useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([DEFAULT_WORKSPACE]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current workspace object
  const currentWorkspace = useMemo(() => {
    return (
      workspaces.find((w) => w.id === currentWorkspaceId) ||
      workspaces[0] ||
      DEFAULT_WORKSPACE
    );
  }, [workspaces, currentWorkspaceId]);

  // Load saved workspace ID from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (saved) {
      setCurrentWorkspaceId(saved);
    }
  }, []);

  // Fetch workspaces from backend
  const fetchWorkspaces = useCallback(async () => {
    if (status !== 'authenticated' || !session) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${getBackendBaseUrl()}/api/user/settings`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(session?.backendToken),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }

      const data = await response.json();
      const fetchedWorkspaces = data.workspaces || [];

      // Ensure default workspace exists
      const hasDefault = fetchedWorkspaces.some(
        (w: Workspace) => w.id === 'default'
      );
      if (!hasDefault) {
        fetchedWorkspaces.unshift(DEFAULT_WORKSPACE);
      }

      setWorkspaces(fetchedWorkspaces);

      // Validate current workspace ID
      const currentExists = fetchedWorkspaces.some(
        (w: Workspace) => w.id === currentWorkspaceId
      );
      if (!currentExists) {
        setCurrentWorkspaceId('default');
        localStorage.setItem(WORKSPACE_STORAGE_KEY, 'default');
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
      setWorkspaces([DEFAULT_WORKSPACE]);
    } finally {
      setIsLoading(false);
    }
  }, [session, status, currentWorkspaceId]);

  // Fetch workspaces on mount and session change
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Switch workspace
  const switchWorkspace = useCallback((workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
  }, []);

  // Create workspace
  const createWorkspace = useCallback(
    async (name: string, icon?: string): Promise<Workspace> => {
      console.log('createWorkspace called:', { name, icon, status, hasToken: !!session?.backendToken });
      if (status !== 'authenticated') {
        throw new Error('Must be authenticated to create workspace');
      }

      try {
        console.log('Making fetch to /api/workspaces');
        const response = await fetch(`${getBackendBaseUrl()}/api/workspaces`, {
          method: 'POST',
          credentials: 'include',
          headers: getAuthHeaders(session?.backendToken),
          body: JSON.stringify({ name, icon }),
        });

        if (!response.ok) {
          throw new Error('Failed to create workspace');
        }

        const data = await response.json();
        const newWorkspace = data.workspace;

        setWorkspaces((prev) => [...prev, newWorkspace]);

        return newWorkspace;
      } catch (err) {
        console.error('Failed to create workspace:', err);
        throw err;
      }
    },
    [status, session]
  );

  // Update workspace
  const updateWorkspace = useCallback(
    async (
      workspaceId: string,
      updates: {
        name?: string;
        icon?: string;
        settingsOverrides?: Partial<UserSettings>;
      }
    ): Promise<void> => {
      if (status !== 'authenticated') {
        throw new Error('Must be authenticated to update workspace');
      }

      // Optimistic update
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspaceId
            ? {
                ...w,
                ...updates,
                settingsOverrides: updates.settingsOverrides
                  ? { ...w.settingsOverrides, ...updates.settingsOverrides }
                  : w.settingsOverrides,
              }
            : w
        )
      );

      try {
        const response = await fetch(
          `${getBackendBaseUrl()}/api/workspaces/${workspaceId}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: getAuthHeaders(session?.backendToken),
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update workspace');
        }
      } catch (err) {
        console.error('Failed to update workspace:', err);
        // Revert on error
        await fetchWorkspaces();
        throw err;
      }
    },
    [status, session, fetchWorkspaces]
  );

  // Delete workspace
  const deleteWorkspace = useCallback(
    async (workspaceId: string): Promise<void> => {
      if (status !== 'authenticated') {
        throw new Error('Must be authenticated to delete workspace');
      }

      if (workspaceId === 'default') {
        throw new Error('Cannot delete the default workspace');
      }

      try {
        const response = await fetch(
          `${getBackendBaseUrl()}/api/workspaces/${workspaceId}`,
          {
            method: 'DELETE',
            credentials: 'include',
            headers: getAuthHeaders(session?.backendToken),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete workspace');
        }

        setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));

        // Switch to default if current workspace was deleted
        if (currentWorkspaceId === workspaceId) {
          switchWorkspace('default');
        }
      } catch (err) {
        console.error('Failed to delete workspace:', err);
        throw err;
      }
    },
    [status, session, currentWorkspaceId, switchWorkspace]
  );

  // Save window state
  const saveWindowState = useCallback(
    async (windowState: SerializedWindowState[]): Promise<void> => {
      if (status !== 'authenticated') {
        return; // Silently fail for unauthenticated users
      }

      // Optimistic update
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === currentWorkspaceId ? { ...w, windowState } : w
        )
      );

      try {
        const response = await fetch(
          `${getBackendBaseUrl()}/api/workspaces/${currentWorkspaceId}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: getAuthHeaders(session?.backendToken),
            body: JSON.stringify({ windowState }),
          }
        );

        if (!response.ok) {
          console.error('Failed to save window state');
        }
      } catch (err) {
        console.error('Failed to save window state:', err);
      }
    },
    [status, session, currentWorkspaceId]
  );

  // Get workspace overrides for SettingsContext
  const getWorkspaceOverrides = useCallback((): Partial<UserSettings> => {
    return currentWorkspace.settingsOverrides || {};
  }, [currentWorkspace]);

  const value = useMemo(
    (): WorkspacesContextValue => ({
      workspaces,
      currentWorkspace,
      currentWorkspaceId,
      isLoading,
      error,
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      saveWindowState,
      getWorkspaceOverrides,
      refetch: fetchWorkspaces,
    }),
    [
      workspaces,
      currentWorkspace,
      currentWorkspaceId,
      isLoading,
      error,
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      saveWindowState,
      getWorkspaceOverrides,
      fetchWorkspaces,
    ]
  );

  return (
    <WorkspacesContext.Provider value={value}>
      {children}
    </WorkspacesContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useWorkspaces(): WorkspacesContextValue {
  const context = useContext(WorkspacesContext);

  if (!context) {
    throw new Error('useWorkspaces must be used within a WorkspacesProvider');
  }

  return context;
}

// Export context for advanced use cases
export { WorkspacesContext };

