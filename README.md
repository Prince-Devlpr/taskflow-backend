# TaskFlow Backend API

Production-ready REST API for the Student Task Management Application built with **Node.js**, **Express**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing
- **Validation**: Zod
- **Architecture**: Controller-Service-Repository (MVC/Service Architecture)

---

## 📋 Prerequisites

1. Node.js (v18 or higher) installed
2. PostgreSQL installed and running on port 5432 (or configured via connection string)

---

## 🚀 Quick Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (already done if `.env` exists):
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` matches your local PostgreSQL credentials and set a
**strong** `JWT_SECRET` (the server refuses to start in production with a weak
or default secret):
```env
DATABASE_URL="postgresql://taskflow_user:STRONG_PASSWORD@localhost:5432/taskflow_db?schema=public"
PORT=5000
JWT_SECRET="<generate with: openssl rand -hex 32>"
# Comma-separated CORS allowlist (leave blank in dev for localhost defaults):
CLIENT_URL=""
```

### 3. Generate Prisma Client & Run Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init
```

### 4. Seed Database (Demo User & Realistic Academic Tasks)
```bash
npm run prisma:seed
```
Default demo credentials:
- **Email**: `prince@student.edu`
- **Password**: `password123`

### 5. Start Development Server
```bash
npm run dev
```
The server will start at: `http://localhost:5000/api`

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create student account
- `POST /api/auth/login` - Login and retrieve JWT token
- `GET /api/auth/me` - Get current student profile (Bearer Token required)

### Tasks
- `GET /api/tasks` - List tasks with filtering, search and sorting
  - Query params:
    - `status`: `all` | `pending` | `completed` | `today` | `upcoming` | `overdue`
    - `category`: `ASSIGNMENT` | `EXAM` | `PROJECT` | `LAB` | `PERSONAL` | `OTHER`
    - `priority`: `LOW` | `MEDIUM` | `HIGH`
    - `search`: text query matching title and description
    - `sortBy`: `dueDate` | `priority` | `createdAt` | `title`
    - `sortOrder`: `asc` | `desc`
    - `page`: page number (default `1`)
    - `limit`: page size (default `50`, **hard‑capped at 100**)
  - Response includes `data` (task array) and `meta` (pagination info).
- `GET /api/tasks/stats` - Productivity metrics (total, pending, completed, overdue, completion percentage, category counts)
- `GET /api/tasks/:id` - Fetch single task details
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update task details
- `PATCH /api/tasks/:id/complete` - Toggle completion status
- `DELETE /api/tasks/:id` - Delete a task

---

## 🔐 Security

TaskFlow is hardened against common web/API attack classes (OWASP‑aligned). See
[`../SECURITY_CHECKLIST.md`](../SECURITY_CHECKLIST.md) for the full list.

**Implemented controls**

- **Auth**: JWT (verified signature + expiry), bcrypt hashing (cost 12), identity taken only from the verified token — clients can never pass a `userId`.
- **Authorization / IDOR**: every task is scoped by `{ id, userId }`; other users' tasks return `404`.
- **Rate limiting**: global limiter on `/api`, strict limiter on auth endpoints (brute‑force), write limiter on task creation → `429`.
- **Validation**: Zod schemas run before business logic; body schemas are `.strict()` (mass‑assignment protection).
- **Headers**: Helmet; `x-powered-by` disabled.
- **CORS**: explicit allowlist — never reflects an arbitrary origin with credentials.
- **Body & result limits**: `10kb` request bodies (`413`), paginated task lists hard‑capped at 100 rows.
- **Error hygiene**: generic client messages; Prisma/stack details logged server‑side only.
- **SQL injection**: Prisma ORM only, no raw SQL; search uses parameterized `contains`.
- **Security logging**: failed/successful logins, denied access, blocked CORS (no secrets logged).

**Verify locally**

```bash
npm audit            # dependency vulnerabilities (expect: 0)
npm test             # 13 automated security tests
```

**Production hardening**

- Serve the API over **HTTPS** only; the Flutter client uses an HTTPS base URL in production.
- Use a **dedicated, non‑superuser** PostgreSQL role, enable **SSL**, and do not expose the database to the public internet.
- Set `NODE_ENV=production`, a strong `JWT_SECRET`, and an explicit `CLIENT_URL` allowlist.
