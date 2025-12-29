import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

function getBackendBaseUrl() {
  // When running in Docker, the frontend container must reach the backend via the service name,
  // e.g. BACKEND_URL="http://backend:3001" (set in docker-compose.dev.yml).
  // When running locally (non-docker), default to localhost.
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://localhost:3001'
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Call backend auth endpoint
        try {
          const backendBaseUrl = getBackendBaseUrl();
          const loginUrl = new URL('/api/auth/login', backendBaseUrl).toString();

          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email.trim(),
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            const body = await response.text().catch(() => '');
            console.error(
              `Auth failed: ${response.status} ${response.statusText} (${loginUrl}) body=${body}`
            );

            // Surface "email not verified" distinctly so the UI can route the user to verification.
            if (response.status === 403) {
              let parsed: { code?: string; error?: string } | null = null;
              try {
                parsed = JSON.parse(body) as { code?: string; error?: string };
              } catch {
                parsed = null;
              }

              if (parsed?.code === 'EMAIL_NOT_VERIFIED') {
                throw new Error('verify');
              }
              if (parsed?.error?.toLowerCase().includes('verify')) {
                throw new Error('verify');
              }
            }

            return null;
          }

          const user = (await response.json()) as {
            id?: string;
            email?: string;
            name?: string | null;
            token?: string;
            backendToken?: string;
          };

          if (!user?.id || !user?.email) {
            console.error(`Auth failed: invalid user payload from ${loginUrl}`, user);
            return null;
          }

          // Prefer backend httpOnly cookie auth. If the backend also returns a token for client-side calls,
          // optionally carry it through NextAuth's JWT/session.
          const backendToken = user.backendToken ?? user.token;
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            ...(backendToken ? { backendToken } : {}),
          };
        } catch (error) {
          if (error instanceof Error && error.message === 'verify') {
            // Let NextAuth surface this to the client so the UI can display the verification flow.
            throw error;
          }
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (typeof user.email === 'string') {
          token.email = user.email;
        }
        if ('backendToken' in user) {
          token.backendToken = (user as { backendToken?: string }).backendToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.id === 'string') {
          session.user.id = token.id;
        }
        if (typeof token.email === 'string') {
          session.user.email = token.email;
        }
      }
      if ('backendToken' in token) {
        session.backendToken = (token as { backendToken?: string }).backendToken;
      }
      return session;
    },
  },
};

