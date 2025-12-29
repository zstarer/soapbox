import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { signOut } from 'next-auth/react';

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
}

export function SettingsLauncher() {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // Best-effort: clear backend cookie (if you end up using it).
      const logoutUrl = new URL('/api/auth/logout', getBackendBaseUrl()).toString();
      await fetch(logoutUrl, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => null);
    } finally {
      // Always clear NextAuth session and return to sign-in page.
      setOpen(false);
      await signOut({ callbackUrl: '/' });
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open settings"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[10000] flex items-center justify-center w-11 h-11 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors shadow-2xl"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close settings"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="relative w-[min(640px,calc(100vw-2rem))] rounded-2xl window-glass border border-zinc-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
              <div className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                Settings
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 text-sm text-zinc-300">
              <div className="space-y-4">
                <section className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                    Account
                  </div>
                  <div className="text-zinc-500 text-xs">
                    Logout and account preferences will live here.
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="mt-2 inline-flex items-center justify-center px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors disabled:text-zinc-500 disabled:hover:border-zinc-800 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? 'Logging out…' : 'Log out'}
                  </button>
                </section>

                <section className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                    Appearance
                  </div>
                  <div className="text-zinc-500 text-xs">
                    Theme + layout tweaks can go here later.
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


