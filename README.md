# 🏥 Hospital Management System — V2
Modern Application Development - II Project

Production-ready full-stack hospital management platform built with Flask, Vue.js, PostgreSQL, Redis, Docker, and Nginx. The system provides secure role-based access control, appointment scheduling, treatment management, asynchronous background processing, caching, and automated CI/CD deployment.

**Name:** Anshul Shakya  
**Email:** 24f1002114@ds.study.iitm.ac.in

---
![Python](https://img.shields.io/badge/Python-3.10-blue)
![Flask](https://img.shields.io/badge/Flask-3.1-black)
![Vue.js](https://img.shields.io/badge/Vue.js-3-42b883)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Redis](https://img.shields.io/badge/Redis-7-dc382d)
![Celery](https://img.shields.io/badge/Celery-5.3-37814A)
![Alembic](https://img.shields.io/badge/Alembic-Migrations-orange)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED)
![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF)
---
## Table of Contents

- [🏥 Hospital Management System — V2](#-hospital-management-system--v2)
  - [](#)
  - [Table of Contents](#table-of-contents)
  - [Key Features](#key-features)
  - [Technology Stack](#technology-stack)
  - [Architecture](#architecture)
  - [Docker Services](#docker-services)
  - [Database Schema](#database-schema)
    - [Core Entities](#core-entities)
    - [Relationships](#relationships)
  - [API Endpoints](#api-endpoints)
  - [Application Setup](#application-setup)
    - [Prerequisites](#prerequisites)
    - [Quick Start](#quick-start)
  - [Environment Configuration](#environment-configuration)
    - [Root `.env` (Docker)](#root-env-docker)
    - [Backend `.env`](#backend-env)
    - [Frontend `.env`](#frontend-env)
  - [Running the Application](#running-the-application)
    - [Production-Like Local Setup (Recommended)](#production-like-local-setup-recommended)
    - [Frontend Only (Local Dev)](#frontend-only-local-dev)
  - [Database Migrations](#database-migrations)
    - [Migration Service Flow](#migration-service-flow)
    - [Developer Workflow](#developer-workflow)
    - [Useful Commands](#useful-commands)
    - [Rules](#rules)
  - [Configuration Reference](#configuration-reference)
  - [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
    - [Required GitHub Secrets](#required-github-secrets)
  - [Troubleshooting](#troubleshooting)
  - [Author](#author)

---

## Key Features

- **Role-Based Access Control** — Secure token-based authentication and authorization for Admin, Doctor, and Patient roles.
- **Administration** — Doctor management, department administration, and user access control.
- **Patient Management** — Registration, doctor search, appointment scheduling, and treatment tracking.
- **Doctor Operations** — Availability management, appointment handling, and treatment record maintenance.
- **Background Processing** — Automated reminders, scheduled reports, and CSV exports powered by Celery.
- **Performance Optimization** — Redis caching for frequently accessed endpoints to improve response times and reduce database load.
- **Production Infrastructure** — Dockerized deployment with Nginx, Gunicorn, PostgreSQL, and automated CI/CD pipelines.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Vue.js, Vite |
| Backend | Flask, Flask-RESTful, Flask-Security, SQLAlchemy |
| Database | PostgreSQL |
| Caching | Redis |
| Background Jobs | Celery, Celery Beat |
| Infrastructure | Gunicorn, Nginx |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Linux VPS |
| Email | Mailtrap |

---

## Architecture

```
Browser
   │
   ▼
Nginx (Frontend Container)
   ├── /      → Vue.js Static Build
   └── /api   → Gunicorn
                    │
                    ▼
                 Flask API
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
 PostgreSQL      Redis         Celery
                                   │
                                   ▼
                             Celery Beat
```

---

## Docker Services

| Container | Purpose |
|---|---|
| hms-migrate | Runs Alembic migrations and seeds roles/admin on every deployment |
| hms-frontend | Serves the Vue.js application through Nginx and proxies API requests to the backend |
| hms-backend | Hosts the Flask REST API using Gunicorn |
| hms-postgres | Stores application data and persistent records |
| hms-redis | Provides caching and serves as the Celery message broker |
| hms-celery | Executes asynchronous background tasks and scheduled jobs |
| hms-celery-beat | Schedules periodic tasks for Celery workers |

---

## Database Schema

### Core Entities

`User` • `Role` • `PatientProfile` • `DoctorProfile` • `Department` • `DoctorAvailability` • `Appointment` • `Treatment` • `Medicine`

### Relationships

- User ↔ Role — Many-to-Many
- User ↔ PatientProfile — One-to-One
- User ↔ DoctorProfile — One-to-One
- DoctorProfile ↔ Department — Many-to-Many
- PatientProfile ↔ Appointment — One-to-Many
- DoctorProfile ↔ Appointment — One-to-Many
- Appointment ↔ Treatment — One-to-One
- Treatment ↔ Medicine — One-to-Many

---

## API Endpoints

| Module | Endpoints |
|---|---|
| Authentication | `POST /api/login`, `GET /api/validate-token` |
| Administration | `/api/doctors`, `/api/doctor/<id>`, `/api/user/<id>/blacklist`, `/api/departments` |
| Patient Services | `/api/patients`, `/api/patient/<id>`, `/api/search/doctors`, `/api/appointments`, `/api/treatments` |
| Doctor Services | `/api/availabilities`, `/api/doctor/availability/<id>`, `/api/appointments`, `/api/treatments` |

---

## Application Setup

### Prerequisites

- Docker & Docker Compose
- Git
- Node.js & npm (only for local frontend dev)

### Quick Start

> ⚠️ If you have run this project before on this machine, wipe old volumes first to avoid migration conflicts:
> ```bash
> docker compose down -v
> ```

```bash
git clone <repo-url>
cd Hospital-Management-System---V2

# Copy and configure the backend environment file
cp backend/application/.env.example backend/application/.env

# Configure frontend and Docker environment files  

# Start all services (backend, frontend, DB, Redis, Celery)
docker compose up --build
```

Once running, the services are available at:

| Service | URL |
|---|---|
| Frontend (App) | http://localhost:80 |
| Backend (API) | http://localhost:8000 (internal only) |

A default admin account is created on first run using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

---

## Environment Configuration

> ⚠️ Never commit your `.env` files. Ensure they are listed in `.gitignore`.

### Root `.env` (Docker)

Used by Docker Compose to configure shared services. Place this file in the project root.

```env
ENV=dev
DOMAIN=localhost
DOCKER_HOST_IP=host-gateway

POSTGRES_USER=your-postgres-user
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=hospital_db
```

### Backend `.env`

Place this file at `backend/application/.env` (copy from `.env.example` and fill in values).

```env
ENV=prod

# Security
SECRET_KEY=your-strong-secret-key
SECURITY_PASSWORD_SALT=your-password-salt
SECURITY_TOKEN_MAX_AGE=86400

# Database
DATABASE_URL=postgresql://your-db-user:your-db-password@postgres:5432/hospital_db
SQLALCHEMY_DATABASE_URI=postgresql://your-db-user:your-db-password@postgres:5432/hospital_db

# Redis
REDIS_URL=redis://redis:6379/0
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=2

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# CORS
ALLOWED_ORIGINS=http://your-frontend-domain.com

# Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong-admin-password

# Mail (Mailtrap or SMTP)
MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USE_TLS=True
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_DEFAULT_SENDER=noreply@example.com
```

### Frontend `.env`

Place this file at `frontend/.env.development`.

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_TITLE=HMS Dev
```

---

## Running the Application

### Production-Like Local Setup (Recommended)

Using ENV=prod locally ensures Docker, Nginx, Gunicorn,
Celery and PostgreSQL behave exactly as they do on the VPS,
reducing deployment-only issues.

```bash
docker compose up --build
```

### Frontend Only (Local Dev)

```bash
cd frontend
npm install
npm run dev
```

---

## Database Migrations

This project uses **Alembic** for database schema migrations. Migrations run automatically on every `docker compose up` via the `hms-migrate` service.

### Migration Service Flow

```
docker compose up --build -d
          │
          ▼
   hms-postgres (healthy)
          │
          ▼
   hms-migrate
   ─ alembic upgrade head    ← applies all pending migrations
   ─ seed_roles_and_admin()  ← creates roles and admin (idempotent)
          │
          ▼
   hms-backend + hms-celery + hms-celery-beat
   (start only after migrate exits successfully)
```

### Developer Workflow

**Adding a table or column (autogenerate works):**

```bash
# 1. Edit your model

# 2. Generate migration
docker compose run --rm migrate alembic revision --autogenerate -m "describe change"

# 3. Review generated file — make sure upgrade() is not empty
cat backend/migrations/versions/<revision_id>_describe_change.py

# 4. Apply locally
docker compose run --rm migrate alembic upgrade head

# 5. Verify
docker compose exec postgres psql -U hospital_user -d hospital_db -c "\dt"

# 6. Commit and push
git add backend/migrations/
git commit -m "db: describe change [revision_id]"
git push origin production
```

**Removing a table or column (manual edit required):**

> ⚠️ Alembic never auto-detects removals to protect against accidental data loss. Always edit the file manually.

```bash
# 1. Remove model from code

# 2. Generate migration
docker compose run --rm migrate alembic revision --autogenerate -m "remove X"

# 3. Manually edit the generated file
#    Add to upgrade():   op.drop_table('table_name')
#    Add to downgrade(): op.create_table(...)

# 4. Apply locally and verify before pushing
docker compose run --rm migrate alembic upgrade head
docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt"

# 5. Commit and push
git add backend/migrations/
git commit -m "db: remove X [revision_id]"
git push origin production
```

### Useful Commands

```bash
# Check current revision
docker compose run --rm migrate alembic current

# View migration history
docker compose run --rm migrate alembic history

# Rollback one step
docker compose run --rm migrate alembic downgrade -1

# Force stamp without running SQL (emergency fix)
docker compose run --rm migrate alembic stamp <revision_id>

# Rebuild and apply migrations
docker compose run --rm --build migrate alembic upgrade head
```

### Rules

- ✅ Always review generated migration files before applying
- ✅ Never push a migration with empty `upgrade()` — check for `pass`
- ✅ Test locally first, then push to production
- ✅ Commit migration files to git — CI/CD applies them automatically on deploy
- ❌ Never manually edit the DB schema on production
- ❌ Never delete a migration file that has already been applied to any DB

---

## Configuration Reference

| Variable | Description |
|---|---|
| `SECRET_KEY` | Used for session management and token generation |
| `SECURITY_PASSWORD_SALT` | Salt used for password hashing |
| `SECURITY_TOKEN_MAX_AGE` | Token expiry duration in seconds (default: 86400 = 24h) |
| `DATABASE_URL` | PostgreSQL connection string |
| `SQLALCHEMY_DATABASE_URI` | SQLAlchemy-specific PostgreSQL URI (same DB as above) |
| `REDIS_URL` | Redis connection used for caching and Celery |
| `CELERY_BROKER_URL` | Message broker URL for Celery task queue |
| `CELERY_RESULT_BACKEND` | Backend URL for storing Celery task results |
| `ADMIN_EMAIL` | Email for the default admin account (created on startup) |
| `ADMIN_PASSWORD` | Password for the default admin account |
| `ALLOWED_ORIGINS` | Frontend origins permitted by CORS |
| `MAIL_*` | Email service config for notifications and reminders |
| `VITE_API_URL` | Backend API base URL consumed by the Vue frontend |
| `VITE_APP_TITLE` | App title displayed in the browser tab |

---

## CI/CD Pipeline (GitHub Actions)

Triggered automatically on every push to the `production` branch, or manually via `workflow_dispatch`.

```
Push to production  (or manual trigger)
          │
          ▼
  ┌──────────────────────────────────────────┐
  │                 validate                 │
  │  ─ Setup Node.js 20 (npm cache)          │
  │  ─ Setup Python 3.10 (pip cache)         │
  │  ─ npm ci --legacy-peer-deps (frontend)  │
  │  ─ npm run build                         │
  │  ─ pip install -r requirements.txt       │
  │  ─ py_compile syntax check (backend)     │
  └──────────────────┬───────────────────────┘
                     │ on success
                     ▼
  ┌──────────────────────────────────────────┐
  │                  deploy                  │
  │  ─ SSH into VPS (appleboy/ssh-action)    │
  │  ─ git fetch origin production           │
  │  ─ git reset --hard origin/production    │
  │  ─ docker compose down                   │
  │  ─ docker compose up --build -d          │
  │    ↓ hms-migrate runs automatically:     │
  │      alembic upgrade head                │
  │      seed_roles_and_admin()              │
  │  ─ wait for backend healthy              │
  │  ─ docker compose ps  (health check)     │
  │  ─ verify alembic_version table          │
  │  ─ docker image prune -f                 │
  └──────────────────┬───────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ✅ Success             ❌ Failure
    echo deployed          echo failed
```

`script_stop: true` and `set -e` are set on the deploy script — any failed command aborts the deployment immediately.

`--legacy-peer-deps` is required due to a known peer dependency conflict in the frontend. `--maxsockets=1` throttles concurrent npm connections to avoid network errors on CI.

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `VPS_HOST` | VPS IP or domain |
| `VPS_USER` | SSH username |
| `VPS_SSH_KEY` | Private SSH key |
| `POSTGRES_USER` | PostgreSQL username (for migration verification) |
| `POSTGRES_DB` | PostgreSQL database name (for migration verification) |

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Container not starting | `docker compose logs <service>` |
| DB connection refused | Check UFW rules allow Docker subnet |
| Port 80 already in use | `sudo systemctl stop nginx` |
| Redis connection error | Check hms-redis container is running |
| 403 on API routes | Clear browser localStorage and re-login |
| Workers crashing | `docker compose logs backend` |
| GitHub Actions failing | Check all secrets are set in repo settings |
| Migration fails with `Can't locate revision` | Old volume conflict — `docker compose down -v && docker compose up --build -d` |
| Migration fails with `DuplicateTable` | Tables exist but no alembic_version — `alembic stamp <revision_id>` |
| Migration `upgrade()` is empty | Autogenerate missed a removal — manually add `op.drop_table()` |

---

## Author

**Anshul Shakya** — @24f1002114