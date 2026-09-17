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
Ensure your `DATABASE_URL` matches your local PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskflow_db?schema=public"
PORT=5000
JWT_SECRET="taskflow_super_secret_jwt_key_2026_academic_student"
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
- `GET /api/tasks/stats` - Productivity metrics (total, pending, completed, overdue, completion percentage, category counts)
- `GET /api/tasks/:id` - Fetch single task details
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update task details
- `PATCH /api/tasks/:id/complete` - Toggle completion status
- `DELETE /api/tasks/:id` - Delete a task
