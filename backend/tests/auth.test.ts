import request from 'supertest';

// ---- Mocks to keep tests deterministic and DB-free ----
jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => ({
      end: jest.fn(),
      query: jest.fn(),
    })),
  };
});

jest.mock('@prisma/adapter-pg', () => {
  return {
    PrismaPg: jest.fn().mockImplementation(() => ({})),
  };
});

jest.mock('bcrypt', () => {
  const compare = jest.fn(async (password: string) => password === 'valid');
  const hash = jest.fn(async () => 'hashed');
  return {
    __esModule: true,
    default: { compare, hash },
    compare,
    hash,
  };
});

jest.mock('../generated/prisma', () => {
  class PrismaClient {
    user = {
      findUnique: jest.fn(async ({ where }: any) => {
        const email = (where?.email ?? '').toString();
        if (!email) return null;
        return {
          id: 'user_1',
          email,
          name: 'Test User',
          password: 'hashed-password',
          emailVerified: new Date(),
        };
      }),
    };
    verificationToken = {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    };
    $queryRaw = jest.fn();
    $disconnect = jest.fn(async () => undefined);
  }

  return { PrismaClient };
});

import app from '../src/index';

describe('Authentication Security', () => {
  test('Login sets secure httpOnly cookie for backend token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'valid' });

    expect(response.status).toBe(200);
    const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies).toBeDefined();
    if (!cookies) throw new Error('Expected set-cookie header to be present');
    const authCookie = cookies.find((c: string) => c.includes('soapbox_auth_token'));
    expect(authCookie).toMatch(/HttpOnly/);
    expect(authCookie).toMatch(/SameSite=Strict/);
    if (process.env.NODE_ENV === 'production') expect(authCookie).toMatch(/Secure/);
    expect(response.body.token).toBeUndefined(); // Token not in body
  });

  test('Rate limiting on login endpoint', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/login').send({ email: 'test', password: 'wrong' });
    }
    const response = await request(app).post('/api/auth/login').send({ email: 'test', password: 'wrong' });
    expect(response.status).toBe(429); // Or custom error code
  });

  test.skip('Session includes embedded backend token if needed', async () => {
    // Frontend-side test (separate file using @testing-library/react)
    // Mock login, useSession()
    // Assert session.backendToken exists (or not, per config)
  });
});


