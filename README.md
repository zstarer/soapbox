# Soapbox - Geopolitical Intelligence OS

A real-time geopolitical intelligence platform featuring an OS-inspired desktop interface with secure authentication and user management.

## Architecture Overview

### Structure
- **Public Landing Page** (`/`) - Minimalist entry point with authentication
- **Protected Dashboard** (`/dashboard`) - Interactive desktop interface with real-time data
- **Backend API** - Express.js server with Socket.IO for real-time updates
- **Database** - PostgreSQL with Prisma ORM

### Tech Stack
- **Frontend**: Next.js 16, React 19, TailwindCSS, NextAuth.js
- **Backend**: Node.js, Express, Socket.IO, JWT, bcrypt
- **Database**: PostgreSQL 16, Prisma
- **Infrastructure**: Docker Compose

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose
- Git

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd SOAPBOX

# Install all dependencies
npm install

# Or install manually
cd frontend && npm install
cd ../backend && npm install
```

### 2. Set Up Environment Variables

```bash
# Quick setup - copies example files
npm run setup:env

# Then edit the generated files with your settings
```

**Or manually create:**

#### Root `.env` (for Docker Compose)
```env
POSTGRES_PASSWORD=secret
```

#### Backend `.env`
```env
DATABASE_URL="postgresql://postgres:secret@localhost:5432/soapbox?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secure-jwt-secret-here
FRONTEND_URL=http://localhost:3000
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@soapbox.local
```

#### Frontend `.env.local`
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-nextauth-secret-here
BACKEND_URL=http://localhost:3001
DATABASE_URL="postgresql://postgres:secret@localhost:5432/soapbox?schema=public"
```

> **Security Note**: Replace the default secrets with secure random strings in production.

### 3. Start Development Services

```bash
# Start PostgreSQL and Mailpit for development
npm run dev:docker

# Verify services are running
docker ps
```

**Development services:**
- PostgreSQL on port `5432`
- Mailpit (email testing) - Web UI: http://localhost:8025, SMTP: `localhost:1025`

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Create Admin User

```bash
cd backend
npx ts-node scripts/create-admin.ts admin@soapbox.com SecurePassword123 "Admin User"
```

### 6. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 7. Access the Application

- **Landing Page**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard (after authentication)
- **Backend API**: http://localhost:3001
- **Mailpit UI** (email testing): http://localhost:8025

## Project Structure

```
SOAPBOX/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (protected)/          # Protected routes
│   │   │   │   ├── dashboard/        # Main dashboard
│   │   │   │   └── layout.tsx        # Protected layout with auth check
│   │   │   ├── api/
│   │   │   │   └── auth/             # NextAuth routes
│   │   │   ├── page.tsx              # Public landing page
│   │   │   └── layout.tsx            # Root layout with SessionProvider
│   │   └── components/
│   │       └── SessionProvider.tsx   # NextAuth session provider
│   ├── .env.example                  # Frontend environment template
│   └── package.json
├── backend/
│   ├── src/
│   │   └── index.ts                  # Express server with Socket.IO
│   ├── scripts/
│   │   └── create-admin.ts           # Admin user creation utility
│   ├── prisma/
│   │   └── schema.prisma             # Database schema
│   ├── .env.example                  # Backend environment template
│   └── package.json
├── shared/
│   └── types.ts                      # Shared TypeScript types
├── docker-compose.dev.yml            # Development services (PostgreSQL + Mailpit)
├── docker-compose.yml                # Production services (PostgreSQL only)
├── .env.example                      # Docker Compose environment template
├── package.json                      # Root scripts for Docker & setup
└── README.md
```

## Authentication Flow

### Registration
1. User fills out sign-up form on landing page
2. Frontend calls `/api/auth/register`
3. Backend validates data, hashes password with bcrypt
4. User created in database
5. Auto sign-in with NextAuth

### Sign In
1. User fills out sign-in form
2. NextAuth credentials provider validates against backend
3. Backend verifies password, returns JWT
4. Session established, redirect to `/dashboard`

### Protected Routes
- All routes under `(protected)/` require authentication
- Server-side check with `getServerSession`
- Unauthenticated users redirected to `/`

## Database Management

### Run Migrations
```bash
cd backend
npx prisma migrate dev --name <migration-name>
```

### Access Prisma Studio
```bash
cd backend
npm run prisma:studio
```

### Reset Database
```bash
cd backend
npx prisma migrate reset
```

## Development Commands

### Root (Docker & Setup)
```bash
npm run dev:docker       # Start development services (PostgreSQL + Mailpit)
npm run dev:docker:down  # Stop development services
npm run dev:docker:logs  # View Docker logs
npm run setup:env        # Copy .env.example files
```

### Frontend
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Backend
```bash
cd backend
npm run dev               # Start with ts-node (hot reload)
npm run build             # Compile TypeScript
npm run start             # Start compiled server
npm run prisma:generate   # Generate Prisma client
npm run prisma:studio     # Open Prisma Studio
```

## Features

### Implemented
- ✅ Public landing page with blinking cursor animation
- ✅ User registration and authentication
- ✅ Protected dashboard route
- ✅ Real-time data streaming via Socket.IO
- ✅ Draggable/resizable desktop windows
- ✅ Mobile-responsive layout
- ✅ PostgreSQL database with Prisma
- ✅ Docker Compose setup
- ✅ Admin user creation script

### Planned
- 🔄 OAuth providers (Google, GitHub)
- 🔄 User roles and permissions
- 🔄 Notes and file management
- 🔄 Multi-user collaboration
- 🔄 Advanced analytics dashboard

## Environment Variables Reference

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Backend server port | `3001` |
| `JWT_SECRET` | Secret for JWT signing | Required |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | Required |

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep soapbox-db

# View database logs
docker logs soapbox-db

# Restart database (development)
docker compose -f docker-compose.dev.yml restart db
```

### Port Already in Use
```bash
# Find process using port 3000 or 3001
lsof -i :3000
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Prisma Client Issues
```bash
# Regenerate Prisma client
cd backend
npx prisma generate

# Reset if needed
npx prisma migrate reset
```

## Security Notes

- 🔒 Change default JWT and NextAuth secrets before deploying
- 🔒 Use strong passwords for admin accounts
- 🔒 Keep database credentials secure
- 🔒 Enable HTTPS in production
- 🔒 Implement rate limiting for auth endpoints
- 🔒 Regular security audits recommended

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

---

**Built with ❤️ for geopolitical intelligence analysis**

