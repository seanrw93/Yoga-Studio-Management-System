# Yoga Studio Management System

A full-stack web application for managing yoga studio operations, including session scheduling, teacher management, and user registrations.

## Tech Stack

### Backend
- Node.js 22 LTS
- Express.js 4.x
- TypeScript 5.4+ (Strict Mode)
- Prisma ORM
- PostgreSQL 16
- Zod (validation)
- JWT (authentication)
- bcrypt (password hashing)

### Frontend
- React 19 (Hooks only)
- TypeScript 5.9+ (Strict Mode)
- Vite 7.x
- TailwindCSS 4.x
- React Router 6.x
- Axios

### Infrastructure
- Docker + Docker Compose
- PostgreSQL container

## Features

### Authentication
- User registration
- User login with JWT tokens

### Sessions Management
- List all yoga sessions
- View session details
- Create new sessions (admin only)
- Update sessions (admin only)
- Delete sessions (admin only)
- Join/leave sessions (regular users)

### Teachers
- View list of teachers
- View teacher details

### User Profile
- View user profile
- Delete user account

## Prerequisites

- Node.js 22 LTS or higher
- Docker and Docker Compose
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/seanrw93/Yoga-Studio-Management-System.git
cd Yoga-Studio-Management-System
```

### 2. Install Backend Dependencies

```bash
npm install          # root: installs the Husky git hooks
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Set up Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd ../backend
cp .env.example .env
```

The default configuration works with Docker Compose:

```env
DATABASE_URL="postgresql://yogauser:yogapass@localhost:5433/yogastudio"
JWT_SECRET="your-secret-key-change-me-in-production"
PORT=8080
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
# Dev-only: set to true (with NODE_ENV=development) to allow self-promotion to admin
ENABLE_ADMIN_SELF_PROMOTION=false
```

The backend validates these at startup and refuses to start if any are missing or invalid:
- `JWT_SECRET` must be at least 32 characters.
- `CORS_ORIGIN` must be a full URL.
- `NODE_ENV` must be `development`, `test` or `production`.

### 5. Start PostgreSQL with Docker

From the project root:

```bash
docker compose up -d
```

This starts a PostgreSQL container on port **5433** (mapped from the container's 5432).

### 6. Run Database Migrations

```bash
cd backend
npm run prisma:migrate
```

### 7. Seed the Database

```bash
npm run prisma:seed
```

This will create:
- 1 admin user: `yoga@studio.com` / `test!1234`
- 1 regular user: `user@test.com` / `test!1234`
- 3 teachers
- 4 yoga sessions

## Running the Application

### Start the Backend (Terminal 1)

```bash
cd backend
npm run dev
```

The API will run on `http://localhost:8080`

### Start the Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## Default Credentials

**Admin User:**
- Email: `yoga@studio.com`
- Password: `test!1234`

**Regular User:**
- Email: `user@test.com`
- Password: `test!1234`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Sessions
- `GET /api/session` - Get all sessions (protected)
- `GET /api/session/:id` - Get session by ID (protected)
- `POST /api/session` - Create session (admin only)
- `PUT /api/session/:id` - Update session (admin only)
- `DELETE /api/session/:id` - Delete session (admin only)
- `POST /api/session/:id/participate` - Join session as the current user (protected)
- `DELETE /api/session/:id/participate` - Leave session as the current user (protected)

### Teachers
- `GET /api/teacher` - Get all teachers (protected)
- `GET /api/teacher/:id` - Get teacher by ID (protected)

### Users
- `GET /api/user/:id` - Get user by ID (own account or admin)
- `DELETE /api/user/:id` - Delete user account (protected)
- `POST /api/user/promote-admin` - Promote the current user to admin (dev only: requires `NODE_ENV=development` and `ENABLE_ADMIN_SELF_PROMOTION=true`)

### Health
- `GET /api/health` - API health check (public)

## Database Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  firstName String
  lastName  String
  password  String
  admin     Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  SessionParticipation[]
}

model Teacher {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  Session[]
}

model Session {
  id          Int       @id @default(autoincrement())
  name        String
  date        DateTime
  description String
  teacherId   Int
  teacher     Teacher   @relation(fields: [teacherId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  participants SessionParticipation[]
}

model SessionParticipation {
  sessionId Int
  userId    Int
  session   Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([sessionId, userId])
}
```

## Development Scripts

### Backend

```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed the database
npm run prisma:studio    # Open Prisma Studio
npm test             # Run unit tests
npm run test:coverage    # Run unit tests with a coverage report
npm run typecheck    # Type-check without emitting
npm run lint         # Lint with ESLint
npm run format:check # Check formatting with Prettier
```

### Frontend

```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run unit tests
npm run test:watch   # Run unit tests in watch mode
npm run test:coverage    # Run unit tests with a coverage report
npm run typecheck    # Type-check without emitting
npm run lint         # Lint with ESLint
npm run format:check # Check formatting with Prettier
```

### E2E

```bash
npm test             # Run the Playwright suite
npm run test:ui      # Open Playwright's interactive UI
npm run report       # Open the last HTML report
```

### Git hooks

Husky runs these automatically from the project root:
- **pre-commit:** `typecheck`, `lint` and `format:check` in both `frontend/` and `backend/`
- **pre-push:** `typecheck` in both

## Project Structure

```
Yoga-Studio-Management-System/
├── backend/
│   ├── src/
│   │   ├── config/           # Validated environment config
│   │   ├── controllers/      # Request handlers
│   │   ├── dto/              # Zod validation schemas
│   │   ├── middleware/       # Auth, authorization, validation, error handling
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic and database access
│   │   ├── test-utils/       # Test helpers
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # JWT and ID parsing utilities
│   │   ├── app.ts            # Express app setup
│   │   └── server.ts         # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Database seeding
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── context/          # Auth context and provider
│   │   ├── dto/              # Zod form validation schemas
│   │   ├── pages/            # React page components
│   │   ├── services/         # API services
│   │   ├── test/             # Test setup and shared helpers
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Error helpers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── e2e/
│   ├── tests/                # Playwright specs
│   ├── fixtures.ts           # Logged-in member/admin fixtures
│   ├── global-setup.ts       # Resets and seeds the E2E database
│   └── playwright.config.ts
├── .husky/                   # Git hooks
├── docker-compose.yml
└── README.md
```

## Testing

| Layer | Tool | Location | Command |
|---|---|---|---|
| Backend unit tests | Vitest | `backend/src/**/*.{test,spec}.ts` | `cd backend && npm test` |
| Frontend unit tests | Vitest + Testing Library | `frontend/src/**/*.test.{ts,tsx}` | `cd frontend && npm test` |
| End-to-end tests | Playwright | `e2e/tests/` | `cd e2e && npm test` |

Use `npm run test:coverage` in `backend/` or `frontend/` for a coverage report.

### Unit tests

- **Backend:** covers config, DTOs, middleware, routes, controllers, services and utils, with Prisma mocked.
- **Frontend:** covers pages, components, context, services, DTOs and utils, with the API mocked.
  - Coverage is measured across all source files.
  - Shared fixtures live in `frontend/src/test/helpers.ts`.

### End-to-end tests (Playwright)

The E2E suite in `e2e/` drives the real frontend and backend together in Chromium.

```bash
docker compose up -d postgres   # the tests need the database container
cd e2e
npm install
npx playwright install chromium # first time only
npm test
```

- Playwright starts the backend (`:8080`) and frontend (`:3000`) itself. Stop your dev servers first, because the ports must be free.
- Each run resets and seeds a separate `yogastudio_e2e` database, so your dev data is never touched. Override it with `E2E_DATABASE_URL`.
- On failure, screenshots and traces are saved. Open the report with `npm run report`, or a trace with `npx playwright show-trace <path>`.

## Troubleshooting

### Database connection issues
```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker compose restart postgres

# View logs
docker compose logs postgres
```

### Port already in use
macOS / Linux:
```bash
lsof -i :8080        # or :3000
kill -9 <PID>
```

Windows (PowerShell):
```powershell
netstat -ano | findstr :8080   # or :3000; the last column is the PID
taskkill /PID <PID> /F
```

### Every Vitest suite fails with `Cannot read properties of undefined (reading 'config')` (Windows)
The terminal's path starts with a lowercase drive letter (`c:\...`), which VS Code terminals sometimes use. Vitest then loads two copies of itself. Run the tests from a path that starts with `C:\`:
```powershell
Set-Location "C:\path\to\Yoga-Studio-Management-System\frontend"
npm test
```

### Prisma issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate
```

## Contributing

Please follow the existing code style and make sure all tests pass before submitting changes. The Husky hooks check types, linting and formatting on every commit (see [Git hooks](#git-hooks)).

## License

MIT
