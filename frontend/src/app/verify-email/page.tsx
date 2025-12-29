'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please check your email for the correct link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
          return;
        }

        setStatus('success');
        setMessage('Your email has been verified! Redirecting to sign in...');
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  // Countdown and redirect on success
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      router.push('/');
    }
  }, [status, countdown, router]);

  return (
    <main className="relative min-h-screen w-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/10 via-black to-black" />
      
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-zinc-700 border-t-zinc-100 rounded-full animate-spin" />
              <h1 className="text-2xl font-bold text-zinc-100 mb-4 uppercase tracking-tight">
                Verifying Email
              </h1>
              <p className="text-zinc-400">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-4 uppercase tracking-tight">
                Email Verified!
              </h1>
              <p className="text-zinc-400 mb-6">{message}</p>
              <p className="text-zinc-500 text-sm">
                Redirecting in {countdown} seconds...
              </p>
              <Link 
                href="/"
                className="inline-block mt-4 px-6 py-2 bg-zinc-100 text-zinc-900 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-white transition-colors"
              >
                Sign In Now
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-4 uppercase tracking-tight">
                Verification Failed
              </h1>
              <p className="text-zinc-400 mb-6">{message}</p>
              <Link 
                href="/"
                className="inline-block px-6 py-2 bg-zinc-100 text-zinc-900 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-white transition-colors"
              >
                Back to Home
              </Link>
            </>
          )}
        </div>

        {/* SOAPBOX branding */}
        <div className="text-center mt-8">
          <p className="text-xs text-zinc-600 uppercase tracking-[0.3em]">
            SOAPBOX
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen w-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-zinc-700 border-t-zinc-100 rounded-full animate-spin" />
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

