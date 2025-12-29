'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

type ModalState = 'none' | 'signIn' | 'signUp' | 'verifyEmail' | 'checkEmail';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [modal, setModal] = useState<ModalState>('none');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const closeModal = () => {
    setModal('none');
    setError('');
    setPendingEmail('');
    setResendSuccess(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Check if it's an unverified email error
        if (result.error.includes('verify')) {
          setPendingEmail(email);
          setModal('verifyEmail');
        } else {
          setError('Invalid email or password');
        }
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Success - show check email modal
      setPendingEmail(email);
      setModal('checkEmail');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingEmail) return;
    
    setResendLoading(true);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pendingEmail }),
      });

      if (response.ok) {
        setResendSuccess(true);
      }
    } catch (err) {
      // Silently fail - we don't want to reveal if email exists
    } finally {
      setResendLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="relative h-screen w-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="text-zinc-500 text-sm uppercase tracking-wider animate-pulse">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/10 via-black to-black" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-6">
        {/* Title with Blinking Cursor */}
        <div className="flex flex-col items-center space-y-3">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-zinc-100 uppercase flex items-center">
            Soapbox
            <span className="cursor-blink">|</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-500 uppercase tracking-[0.3em] font-medium">
            Geopolitical Intelligence OS
          </p>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4 pt-8">
          <button
            onClick={() => setModal('signIn')}
            className="px-8 py-3 bg-zinc-100 text-zinc-900 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-white transition-colors shadow-lg hover:shadow-xl"
          >
            Sign In
          </button>
          <button 
            onClick={() => setModal('signUp')}
            className="px-8 py-3 bg-transparent text-zinc-300 font-bold text-sm uppercase tracking-wider rounded-lg border-2 border-zinc-700 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Sign In Modal */}
      {modal === 'signIn' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-zinc-100 mb-6 uppercase tracking-tight">Sign In</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-900 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="px-6 py-3 bg-transparent text-zinc-400 font-bold text-sm uppercase tracking-wider rounded-lg border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {modal === 'signUp' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-zinc-100 mb-6 uppercase tracking-tight">Sign Up</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
                  placeholder="your@email.com"
                />
              </div>
            
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
                  placeholder="••••••••"
                />
                <p className="text-xs text-zinc-600 mt-1">Minimum 6 characters</p>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-900 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="px-6 py-3 bg-transparent text-zinc-400 font-bold text-sm uppercase tracking-wider rounded-lg border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check Email Modal (after registration) */}
      {modal === 'checkEmail' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-100 mb-4 uppercase tracking-tight">Check Your Email</h2>
            
            <p className="text-zinc-400 mb-2">
              We&apos;ve sent a verification link to:
            </p>
            <p className="text-zinc-100 font-medium mb-6">
              {pendingEmail}
            </p>
            
            <p className="text-zinc-500 text-sm mb-6">
              Click the link in the email to verify your account. The link expires in 24 hours.
            </p>

            {/* Dev mode hint */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Dev Mode</p>
              <p className="text-sm text-zinc-400">
                View emails at{' '}
                <a 
                  href="http://localhost:8025" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  localhost:8025
                </a>
                {' '}(Mailpit)
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={closeModal}
                className="w-full px-6 py-3 bg-zinc-100 text-zinc-900 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-white transition-colors"
              >
                Got It
              </button>
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full px-6 py-2 bg-transparent text-zinc-400 font-medium text-sm rounded-lg hover:text-zinc-300 transition-colors disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : resendSuccess ? 'Email Sent!' : 'Resend Verification Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Email Modal (when trying to sign in with unverified email) */}
      {modal === 'verifyEmail' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-100 mb-4 uppercase tracking-tight">Email Not Verified</h2>
            
            <p className="text-zinc-400 mb-6">
              Please verify your email address before signing in. Check your inbox for the verification link.
            </p>

            {resendSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm">
                Verification email sent!
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full px-6 py-3 bg-zinc-100 text-zinc-900 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-white transition-colors disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <button
                onClick={closeModal}
                className="w-full px-6 py-2 bg-transparent text-zinc-400 font-medium text-sm rounded-lg hover:text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .cursor-blink {
          animation: blink 1s step-end infinite;
          display: inline-block;
          margin-left: 0.1em;
        }
      `}</style>
    </main>
  );
}
