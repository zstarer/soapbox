import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import ProtectedLayout from '../layout';

// Mock next-auth server session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Protected Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redirects to home when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const LayoutComponent = ProtectedLayout as any;
    await LayoutComponent({ children: <div>Protected Content</div> });
    
    expect(redirect).toHaveBeenCalledWith('/');
  });

  test('renders children when authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    
    const LayoutComponent = ProtectedLayout as any;
    const result = await LayoutComponent({ children: <div>Protected Content</div> });
    
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

