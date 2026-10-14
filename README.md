# ProgressPilot — Personal Productivity & Progress Tracker

> **"Plan Better. Focus Deeper. Progress Every Day."**

ProgressPilot is a modern, production-minded personal productivity management system designed for students, software engineers, and busy professionals. It combines daily and weekly task planning, recurrence schedules, a Pomodoro focus timer with offline state persistence, long-term goal tracking, interactive calendars, daily reviews with blocker logging, and real-time database-calculated analytics.

---

## 🌟 Key Features

### 1. Dashboard & Real-Time Analytics
- **6 Core Database Metrics**: Today's completion rate, focused time vs planned time, time utilization rate (with transparent formula allowing >100%), high-priority success, pending/overdue task counts, and consecutive productivity streak.
- **Weekly & Monthly Charts**: Planned vs actual focus hours visualized using Recharts area and bar charts.
- **Category Breakdown**: Donut chart displaying focus minutes across DSA, Full Stack, Academics, Core CS, Projects, and custom categories.
- **Date Navigation**: Inspect any past day or jump to specific dates using the interactive date picker.

### 2. Complete Task Management System
- **CRUD Operations**: Title, description, categories, priority (`High`, `Medium`, `Low`), and schedule type.
- **Recurrence Engine**: Support for One-time, Daily, Weekly (select specific weekdays e.g. Mon, Wed, Fri), and Custom intervals.
- **Task Occurrence Isolation**: Completed Monday occurrences never corrupt Tuesday occurrences.
- **Subtasks & Checklists**: Interactive step-by-step checklists with progress summaries.
- **Bulk Actions**: Select multiple tasks to complete or delete simultaneously.
- **Postpone with Blocker Logging**: Move incomplete tasks to new dates while recording distraction reasons (e.g. unexpected time constraints, difficulty, loss of focus) for weekly review insights.

### 3. Focus Timer & Pomodoro
- **Modes**: Pomodoro (25m), Short Break (5m), Long Break (15m), and Custom focus durations.
- **Task-Linked Focus**: Associate sessions directly with specific tasks and categories.
- **Refresh-Resistant Persistence**: Timer state is preserved via timestamp offsets (`targetEndTime`) in `localStorage`—refreshing or navigating away never corrupts elapsed time.
- **Automatic Logging**: Completed sessions automatically log focused minutes to MongoDB, update task actual duration, and exclude breaks.
- **Manual Time Entry**: Log offline study sessions or book reading with input validation.

### 4. Long-Term Goal Tracking
- **4-Level Hierarchy**: `Long-Term Goal` → `Monthly Milestone` → `Weekly Target` → `Daily Tasks`.
- **Target Units**: Track custom metrics (e.g., *150 Problems*, *50 Hours*, *10 Modules*).
- **Progress Calculations**: Live percentage progress bars, milestone checkboxes, and linked tasks.

### 5. Interactive Calendar
- **Views**: Seamless Month, Week, and Day views.
- **Visual Indicators**: Color-coded priority borders, scheduled dates, and overdue badges.
- **Direct Scheduling**: Click any day to quickly add or reschedule tasks.

### 6. Evening Daily Review
- **Stats Snapshot**: Captures completion rate, focused hours, and high-priority tasks completed on that date.
- **Structured Reflection Form**:
  1. What went well today?
  2. What did not go well?
  3. What caused distractions?
  4. What did I learn today?
  5. What should I improve tomorrow?
  6. Top three priorities for tomorrow.
- **History Browser**: Browse and review past reflections without accidental overwrites.

### 7. Notification Center & Scheduled Reminders
- **Background Cron Worker**: `node-cron` runs every 15 minutes to evaluate upcoming deadlines (within 24h) and overdue tasks.
- **In-App Notification Center**: Unread badges, mark-as-read, and direct links to tasks.
- **Browser Notifications**: Native HTML5 web notifications for focus session completion.

### 8. Data Portability & Export
- **CSV Exports**: Export Tasks, Focus Time Logs, and Goals with formatted CSV headers.
- **Full Account Backup**: Download your entire account data in structured JSON format.

### 9. AI Daily Journal & Smart Notes (Multilingual Support)
- **Freeform Distraction-Free Editor**: Write naturally in Hindi, Hinglish (Romanized Hindi), English, or mixed.
- **Real-Time Debounced Draft Autosave**: 1200ms debounce with animated `Saved`, `Saving...`, `Save failed` states, preventing accidental data loss.
- **Unsaved Changes Guard**: Built-in `beforeunload` browser warnings prevent leaving with unsaved thoughts.
- **8-Section AI Structuring Engine**:
  1. Executive Daily Summary
  2. Completed Activities
  3. Learning & Skills Practiced
  4. Achievements & Milestones
  5. Challenges & Blockers
  6. Incomplete / Pending Work
  7. Tomorrow's Plan
  8. Additional Notes & AI Suggestions (clearly distinguished)
- **Direct Task Integration**: Hover over any structured bullet to create an actionable, scheduled task with user confirmation (title, category, priority, estimated duration).
- **Date-Wise Journal History & Calendar Indicators**: Mini calendar with glowing dots for note-taking days and AI structured report days.
- **Weekly Insights & Topic Mining**: Weekly summary highlighting top learned skills, recurring blocker patterns, and key milestones.
- **High-Fidelity Hybrid AI Architecture**: Uses Google Gemini API (`gemini-1.5-flash`) when configured, backed by a local semantic parser for guaranteed 100% offline reliability. Original user text is strictly preserved.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v7, Recharts, Lucide React, canvas-confetti, date-fns |
| **Backend** | Node.js, Express.js, Mongoose, REST APIs, express-rate-limit, morgan, node-cron |
| **Database** | MongoDB Atlas / Local MongoDB instance (`mongodb://127.0.0.1:27017/progresspilot`) |
| **Authentication** | Firebase Authentication (Google Sign-In), Firebase Admin SDK for backend ID token verification, with local Dev Mode fallback |

---

## 📁 Project Structure

```text
progresspilot/
├── client/                      # React + Vite Frontend
│   ├── public/                  # Favicon and static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Modal, Badge, ProgressBar, EmptyState, SkeletonLoader, ConfirmDialog
│   │   │   ├── layout/          # Sidebar, Header, AppLayout
│   │   │   ├── tasks/           # TaskCard, TaskModal, PostponeModal, TaskFilters
│   │   │   └── timer/           # TimerDisplay, ManualTimeModal
│   │   ├── context/             # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/               # Dashboard, Tasks, Calendar, Goals, Timer, Analytics, Review, Notifications, Settings, Login
│   │   ├── services/            # api.js, firebase.js
│   │   ├── App.jsx              # Routing & Route Guard
│   │   ├── index.css            # Tailwind & theme variables
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── config/              # db.js (MongoDB), firebase.js (Firebase Admin)
│   │   ├── controllers/         # task, occurrence, goal, focusSession, dailyReview, analytics, notification, export, user
│   │   ├── jobs/                # cronScheduler.js (background reminders)
│   │   ├── middleware/          # auth.js (token verification), errorHandler.js
│   │   ├── models/              # User, Task, TaskOccurrence, Goal, FocusSession, DailyReview, Notification
│   │   ├── routes/              # task, occurrence, goal, focusSession, dailyReview, analytics, notification, export, user, apiRouter
│   │   ├── services/            # occurrenceService, analyticsService, reminderService
│   │   └── index.js             # Express application entrypoint
│   ├── tests/                   # Automated node:test API test suite
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── package.json                 # Monorepo root scripts (concurrently)
└── README.md
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v9+
- **MongoDB** running locally or a free **MongoDB Atlas** cluster URI

### 1. Clone & Install Dependencies
From the repository root directory:
```bash
# Install all root, client, and server dependencies
npm install
```

### 2. Configure Environment Variables

#### Backend (`server/.env`):
Create `server/.env` from `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Allows immediate testing without Google OAuth keys
ALLOW_DEV_AUTH=true

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb://127.0.0.1:27017/progresspilot

# Firebase Admin SDK Credentials (Optional for local dev mode)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

#### Frontend (`client/.env`):
Create `client/.env` from `client/.env.example`:
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## 🏃 Running the Application

### Option A: Run Both Client & Server Concurrently
```bash
npm run dev
```
- **Client**: `http://localhost:5173`
- **Server API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

### Option B: Run Individually
```bash
# Terminal 1: Server
npm run dev:server

# Terminal 2: Client
npm run dev:client
```

---

## 🔑 Authentication Guide

ProgressPilot supports two authentication pathways:

1. **Google Sign-In with Firebase Authentication (Production)**:
   - Create a project on [Firebase Console](https://console.firebase.google.com/).
   - Enable **Google** in **Authentication → Sign-in method**.
   - Copy web configuration keys to `client/.env`.
   - Download the Service Account Private Key from **Project Settings → Service Accounts** and paste credentials into `server/.env`.
   - Every request verifies the Firebase ID token cryptographically on the backend using `admin.auth().verifyIdToken()`.

2. **Instant Developer / Demo Pilot Mode**:
   - When developing locally without Google OAuth credentials, click **"Launch Demo Pilot Account"** on the login screen.
   - Generates a signed development identity accepted by the backend when `ALLOW_DEV_AUTH=true`.
   - Performs **real MongoDB persistence**, updates actual focus logs, recurrence series, and calculates live analytics without mock data.

---

## 🧪 Running Automated Tests

Run the built-in automated backend test suite:
```bash
npm test
```
The test suite verifies:
- Health check and system status (`GET /api/health`)
- Authorization rejection for unauthenticated requests (`401 Unauthorized`)
- User profile loading and upserting (`GET /api/user/profile`)
- Task creation validation and database persistence (`POST /api/tasks`)
- Task listing and user isolation (`GET /api/tasks`)
- Focus session logging and duration incrementation (`POST /api/focus-sessions`)
- Real-time productivity analytics formulas (`GET /api/analytics/daily`)
- CSV export serialization (`GET /api/export/tasks`)
- Complete account JSON backup export (`GET /api/export/all`)

---

## 📡 REST API Reference

All protected endpoints require the `Authorization: Bearer <token>` header.

### Tasks
- `GET /api/tasks` — List tasks with search, category, priority, status, and pagination filters.
- `POST /api/tasks` — Create a new task (supports recurrence rules, durations, subtasks).
- `GET /api/tasks/:id` — Retrieve task by ID (verifies user ownership).
- `PATCH /api/tasks/:id` — Update task details.
- `DELETE /api/tasks/:id` — Archive task and remove future occurrences.
- `PATCH /api/tasks/:id/complete` — Toggle task completion status.
- `POST /api/tasks/:id/duplicate` — Duplicate a task.
- `POST /api/tasks/:id/postpone` — Postpone a task with distraction/blocker reason.

### Occurrences (Recurring Series)
- `GET /api/occurrences?date=YYYY-MM-DD` — Get scheduled occurrences for a date.
- `GET /api/occurrences?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` — Get occurrences in date range.
- `PATCH /api/occurrences/:id` — Update occurrence status, duration, or notes.
- `POST /api/occurrences/:id/skip` — Skip a specific occurrence.
- `POST /api/occurrences/:id/reschedule` — Move occurrence to a new date with reason.

### Focus Sessions
- `POST /api/focus-sessions` — Log a completed focus session (increments task actual duration).
- `GET /api/focus-sessions` — List focus sessions.
- `GET /api/focus-sessions/today` — Retrieve today's focused hours and session counts.

### Goals & Milestones
- `GET /api/goals` — List goals with linked task progress.
- `POST /api/goals` — Create long-term goal with milestones.
- `PATCH /api/goals/:id` — Update progress or milestone status.
- `DELETE /api/goals/:id` — Delete goal and unlink tasks.

### Analytics
- `GET /api/analytics/daily?date=YYYY-MM-DD` — Daily completion rate, time utilization, streak, categories.
- `GET /api/analytics/weekly?date=YYYY-MM-DD` — 7-day planned vs actual hours, blocker trends.
- `GET /api/analytics/monthly?date=YYYY-MM-DD` — 30-day focus distribution by week.

### Daily Review
- `GET /api/reviews?date=YYYY-MM-DD` — Get review and live stats snapshot for date.
- `POST /api/reviews` — Save reflection answers and top priorities for tomorrow.
- `GET /api/reviews/history` — Browse past daily reviews.

### Notifications & Reminders
- `GET /api/notifications` — Get user notifications and unread count.
- `PATCH /api/notifications/:id/read` — Mark notification read.
- `POST /api/notifications/mark-all-read` — Mark all notifications read.
- `DELETE /api/notifications/:id` — Dismiss notification.

### Data Export
- `GET /api/export/tasks` — Download Tasks CSV.
- `GET /api/export/time-logs` — Download Focus Sessions CSV.
- `GET /api/export/goals` — Download Goals CSV.
- `GET /api/export/all` — Download complete account JSON backup.

---

## 🔒 Security Best Practices
- **No Token Forgery**: Firebase ID tokens verified server-side with Firebase Admin SDK.
- **Strict User Isolation**: All database queries enforce `{ userId: req.user.uid }`.
- **CORS Protection**: Restricted to configured frontend origins.
- **Rate Limiting**: Express rate limiter protects against brute-force attacks.
- **Zero Hardcoded Secrets**: Secrets loaded exclusively from environment variables.

---

## 📄 License
MIT © ProgressPilot Team
