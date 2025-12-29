import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { GrokData } from '../../shared/types';

dotenv.config();

export const app = express();
const port = process.env.PORT || 3001;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Email transporter configuration - uses Mailpit in development
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false, // Mailpit doesn't use TLS
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  // For Mailpit, no auth is needed
  ignoreTLS: true,
});

// Enable CORS for frontend
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// If running behind a reverse proxy (common in production), trust the proxy for correct IP detection.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'SOAPBOX Backend is running' });
});

// Health check for services
app.get('/api/health', async (req: Request, res: Response) => {
  const checks = {
    server: true,
    database: false,
    email: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (e) {
    console.error('Database health check failed:', e);
  }

  try {
    await transporter.verify();
    checks.email = true;
  } catch (e) {
    // Email not critical for health
  }

  res.json(checks);
});

// ============================================
// AUTH ROUTES
// ============================================

// Generate verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Send verification email
async function sendVerificationEmail(email: string, token: string, name?: string): Promise<boolean> {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SOAPBOX" <noreply@soapbox.local>',
      to: email,
      subject: 'Verify your SOAPBOX account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fafafa; padding: 40px 20px; }
            .container { max-width: 500px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 40px; }
            h1 { font-size: 24px; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 0.1em; }
            p { color: #a1a1aa; line-height: 1.6; margin: 0 0 20px; }
            .button { display: inline-block; background: #fafafa; color: #0a0a0a; padding: 14px 28px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 8px; }
            .footer { margin-top: 30px; font-size: 12px; color: #71717a; }
            .code { background: #27272a; padding: 12px 16px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to SOAPBOX${name ? `, ${name}` : ''}</h1>
            <p>Thanks for signing up! Please verify your email address to complete your registration.</p>
            <p><a href="${verificationUrl}" class="button">Verify Email</a></p>
            <p class="footer">Or copy and paste this link into your browser:</p>
            <div class="code">${verificationUrl}</div>
            <p class="footer">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to SOAPBOX!\n\nPlease verify your email by visiting: ${verificationUrl}\n\nThis link expires in 24 hours.`,
    });
    console.log(`📧 Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

// Register new user
app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Don't reveal if email exists - security best practice
      // But for dev, we'll be explicit
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (unverified)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        emailVerified: null, // Not verified yet
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate verification token
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, token, name);

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.',
      user,
      emailSent,
      // In dev mode, include the verification URL for easy testing
      ...(process.env.NODE_ENV !== 'production' && {
        _dev: {
          verificationUrl: `${FRONTEND_URL}/verify-email?token=${token}`,
          mailpitUrl: 'http://localhost:8025',
        }
      }),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Verify email
app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }

    // Check if expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({ where: { token } });
      return res.status(400).json({ error: 'Verification link has expired. Please register again.' });
    }

    // Update user's emailVerified
    const user = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    // Delete used token
    await prisma.verificationToken.delete({ where: { token } });

    console.log(`✅ Email verified for ${user.email}`);

    res.json({
      message: 'Email verified successfully! You can now sign in.',
      user,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If an account exists, a verification email will be sent.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() },
    });

    // Generate new token
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
      },
    });

    await sendVerificationEmail(email, token, user.name || undefined);

    res.json({ message: 'If an account exists, a verification email will be sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before signing in',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`🔐 User logged in: ${user.email}`);

    // Set secure cookie for backend token (avoid exposing JWT to JS)
    res.cookie('soapbox_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Logout (clears backend auth cookie, if present)
app.post('/api/auth/logout', async (_req: Request, res: Response) => {
  try {
    res.clearCookie('soapbox_auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed. Please try again.' });
  }
});

// ============================================
// MOCK API ROUTES
// ============================================

app.get('/api/mock/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const fileMap: Record<string, string> = {
    current: 'sampleCurrentEvents.json',
    historical: 'sampleHistoricalRecap.json',
    calendar: 'sampleCalendarEvents.json',
    predictive: 'samplePredictiveOutlook.json',
    relationships: 'sampleEntityRelationships.json',
    'current-v1': 'sampleCurrentEventsVariation1.json',
    'current-v2': 'sampleCurrentEventsVariation2.json',
    'historical-v': 'sampleHistoricalRecapVariation.json',
    'calendar-v': 'sampleCalendarEventsVariation.json',
  };

  const fileName = fileMap[type];
  if (!fileName) return res.status(404).json({ error: 'Not found' });

  try {
    const filePath = path.join(__dirname, '..', 'mocks', fileName);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData) as GrokData;
    res.json({ id: Date.now().toString(), ...data });
  } catch (error) {
    console.error(`Error reading mock file ${fileName}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ============================================
// WEBSOCKET
// ============================================

const broadcastData = (io: Server) => {
  const mockFiles = [
    'sampleCurrentEvents.json',
    'sampleCalendarEvents.json',
    'sampleHistoricalRecap.json',
    'samplePredictiveOutlook.json',
    'sampleEntityRelationships.json'
  ];

  const updates: GrokData[] = [];

  mockFiles.forEach(file => {
    try {
      const filePath = path.join(__dirname, '..', 'mocks', file);
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(rawData) as GrokData;
        updates.push({ ...data, id: `${file}-${Date.now()}` });
      }
    } catch (err) {
      console.error(`Error reading ${file} for broadcast:`, err);
    }
  });

  if (updates.length > 0) {
    console.log(`Broadcasting updates from ${updates.length} mock files`);
    io.emit('grok_update', updates);
  }
};

// ============================================
// START SERVER
// ============================================

function startServer() {
  // Verify email transporter on startup (avoids side effects when imported for tests)
  transporter.verify((error) => {
    if (error) {
      console.warn('⚠️  Email transporter not available:', error.message);
      console.warn('   Make sure Mailpit is running: docker compose up mailpit');
    } else {
      console.log('✅ Email transporter ready');
    }
  });

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL,
      methods: ["GET", "POST"]
    }
  });

  // Start broadcast interval (every 30 seconds)
  setInterval(() => broadcastData(io), 30000);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    broadcastData(io);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    SOAPBOX BACKEND                         ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Server:    http://localhost:${port}                       ║
║  📧 Mailpit:   http://localhost:8025 (email testing)       ║
║  🗄️  Database:  PostgreSQL on port 5432                     ║
╚════════════════════════════════════════════════════════════╝
  `);
  });
}

// Only start the server when this file is executed directly (not when imported by Jest)
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (require.main === module) {
  startServer();
}

export default app;
