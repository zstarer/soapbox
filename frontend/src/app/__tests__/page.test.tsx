import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LandingPage from '../page';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Landing Page', () => {
  const mockPush = jest.fn();
  const mockSignIn = require('next-auth/react').signIn;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    test('renders landing page with title and tagline', () => {
      render(<LandingPage />);
      
      expect(screen.getByText('Soapbox')).toBeInTheDocument();
      expect(screen.getByText('Geopolitical Intelligence OS')).toBeInTheDocument();
    });

    test('shows Sign In and Sign Up buttons', () => {
      render(<LandingPage />);
      
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    test('opens Sign In modal when Sign In button is clicked', () => {
      render(<LandingPage />);
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(signInButton);
      
      // Modal should be open with form fields
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('opens Sign Up modal when Sign Up button is clicked', () => {
      render(<LandingPage />);
      
      const signUpButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signUpButton);
      
      // Modal should be open with form fields
      expect(screen.getByPlaceholderText('Your Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      expect(screen.getByText('Minimum 6 characters')).toBeInTheDocument();
    });

    test('closes modal when Cancel button is clicked', () => {
      render(<LandingPage />);
      
      // Open Sign In modal
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      
      // Close modal
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByPlaceholderText('your@email.com')).not.toBeInTheDocument();
    });

    test('displays error message on failed sign in', async () => {
      mockSignIn.mockResolvedValueOnce({ error: 'Invalid credentials', ok: false });
      
      render(<LandingPage />);
      
      // Open Sign In modal
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Fill in form
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      
      // Submit form
      const form = emailInput.closest('form');
      fireEvent.submit(form!);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    test('handles successful sign in', async () => {
      mockSignIn.mockResolvedValueOnce({ ok: true });
      
      render(<LandingPage />);
      
      // Open Sign In modal
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Fill in form
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      
      // Submit form
      const form = emailInput.closest('form');
      fireEvent.submit(form!);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('handles sign up flow', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          message: 'Account created',
          user: { email: 'newuser@example.com' },
        }),
      });
      
      render(<LandingPage />);
      
      // Open Sign Up modal
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // Fill in form
      const nameInput = screen.getByPlaceholderText('Your Name');
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      
      fireEvent.change(nameInput, { target: { value: 'New User' } });
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Submit form
      const form = emailInput.closest('form');
      fireEvent.submit(form!);
      
      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    test('displays error on sign up failure', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
      });
      
      render(<LandingPage />);
      
      // Open Sign Up modal
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // Fill in form and submit
      const emailInput = screen.getByPlaceholderText('your@email.com');
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      
      const passwordInput = screen.getByPlaceholderText('••••••••');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const form = emailInput.closest('form');
      fireEvent.submit(form!);
      
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    test('shows unverified email modal when signing in with unverified account', async () => {
      mockSignIn.mockResolvedValueOnce({ 
        error: 'Please verify your email before signing in', 
        ok: false 
      });
      
      render(<LandingPage />);
      
      // Open Sign In modal
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Fill in and submit form
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      
      fireEvent.change(emailInput, { target: { value: 'unverified@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      
      const form = emailInput.closest('form');
      fireEvent.submit(form!);
      
      await waitFor(() => {
        expect(screen.getByText(/email not verified/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User', () => {
    test('redirects to dashboard when already authenticated', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { email: 'test@example.com' } },
        status: 'authenticated',
      });
      
      render(<LandingPage />);
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    test('shows loading state while checking session', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });
      
      render(<LandingPage />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});

