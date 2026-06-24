# 🏥 Hospital Management System — V2

**Modern Application Development - II Project**

> Production-ready full-stack hospital management platform built with Flask, Vue.js, PostgreSQL, Redis, Docker, and Nginx. The system provides secure role-based access control, appointment scheduling, treatment management, asynchronous background processing, caching, and automated CI/CD deployment.

---

**Name:** Anshul Shakya  
**Email:** 24f1002114@ds.study.iitm.ac.in

---

## Table of Contents

- [🏥 Hospital Management System — V2](#-hospital-management-system--v2)
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
    - [Configuration Reference](#configuration-reference)
  - [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
    - [Required GitHub Secrets](#required-github-secrets)
  - [Production Setup (VPS)](#production-setup-vps)
    - [Prerequisites](#prerequisites-1)
    - [Firewall Rules](#firewall-rules)
  - [Production Debugging](#production-debugging)
    - [Container Status](#container-status)
    - [Resource Usage](#resource-usage)
    - [Restart Services](#restart-services)
    - [Redis](#redis)
    - [Ports](#ports)
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

| Layer            | Technologies                                          |
|------------------|-------------------------------------------------------|
| Frontend         | `Vue.js` `Vite`                                       |
| Backend          | `Flask` `Flask-RESTful` `Flask-Security` `SQLAlchemy` |
| Database         | `PostgreSQL` `SQLite`                                 |
| Caching          | `Redis`                                               |
| Background Jobs  | `Celery` `Celery Beat`                                |
| Infrastructure   | `Gunicorn` `Nginx`                                    |
| Containerization | `Docker` `Docker Compose`                             |
| CI/CD            | `GitHub Actions`                                      |
| Deployment       | `Linux VPS`                                           |
| Email            | `Mailtrap`                                            |

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

### Docker Services

| Container         | Purpose                                                                             |
|-------------------|-------------------------------------------------------------------------------------|
| `hms-frontend`    | Serves the Vue.js application through Nginx and proxies API requests to the backend |
| `hms-backend`     | Hosts the Flask REST API using Gunicorn                                             |
| `hms-postgres`    | Stores application data and persistent records                                      |
| `hms-redis`       | Provides caching and serves as the Celery message broker                            |
| `hms-celery`      | Executes asynchronous background tasks and scheduled jobs                           |
| `hms-celery-beat` | Schedules periodic tasks for Celery workers                                         |

---

## Database Schema

### Core Entities

`User` • `Role` • `PatientProfile` • `DoctorProfile` • `Department` • `DoctorAvailability` • `Appointment` • `Treatment` • `Medicine`

### Relationships

- **User ↔ Role** — Many-to-Many
- **User ↔ PatientProfile** — One-to-One
- **User ↔ DoctorProfile** — One-to-One
- **DoctorProfile ↔ Department** — Many-to-Many
- **PatientProfile ↔ Appointment** — One-to-Many
- **DoctorProfile ↔ Appointment** — One-to-Many
- **Appointment ↔ Treatment** — One-to-One
- **Treatment ↔ Medicine** — One-to-Many

---

## API Endpoints

| Module               | Endpoints                                                                                           |
|----------------------|-----------------------------------------------------------------------------------------------------|
| **Authentication**   | `POST /api/login`, `GET /api/validate-token`                                                        |
| **Administration**   | `/api/doctors`, `/api/doctor/<id>`, `/api/user/<id>/blacklist`, `/api/departments`                  |
| **Patient Services** | `/api/patients`, `/api/patient/<id>`, `/api/search/doctors`, `/api/appointments`, `/api/treatments` |
| **Doctor Services**  | `/api/availabilities`, `/api/doctor/availability/<id>`, `/api/appointments`, `/api/treatments`      |

---

## Application Setup

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Git](https://git-scm.com/)
- [Node.js & npm](https://nodejs.org/) *(only for local frontend dev)*

---

### Quick Start

```bash
git clone <repo-url>
cd Hospital-Management-System---V2

# Copy and configure the backend environment file
cp backend/application/.env.example backend/application/.env

# Start all services (backend, frontend, DB, Redis, Celery)
docker compose up --build
```

Once running, the services are available at:

| Service        | URL                   |
|----------------|-----------------------|
| Frontend (App) | http://localhost:5173 |
| Backend (API)  | http://localhost:8000 |

> A default admin account is created on first run using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

---

### Environment Configuration

> ⚠️ Never commit your `.env` files. Ensure they are listed in `.gitignore`.

#### Root `.env` (Docker)

Used by Docker Compose to configure shared services. Place this file in the project root.

```env
ENV=dev
DOMAIN=localhost
DOCKER_HOST_IP=host-gateway

POSTGRES_USER=your-postgres-user
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=hospital_db
```

#### Backend `.env`

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

#### Frontend `.env`

Place this file at `frontend/.env`.

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_TITLE=HMS Dev
```

---

### Running the Application

#### Production-Like Local Setup (Recommended)

Runs the full stack — backend, frontend, PostgreSQL, Redis, and Celery — in a production-like environment for consistency with VPS deployment. `ENV=prod` is intentional; this setup guarantees no environment-specific breakage before deploying.

```bash
docker compose up --build
```

#### Frontend Only (Local Dev)

```bash
cd frontend
npm install
npm run dev
```

---

### Configuration Reference

| Variable                 | Description                                              |
|--------------------------|----------------------------------------------------------|
| `SECRET_KEY`             | Used for session management and token generation         |
| `SECURITY_PASSWORD_SALT` | Salt used for password hashing                           |
| `SECURITY_TOKEN_MAX_AGE` | Token expiry duration in seconds (default: 86400 = 24h)  |
| `DATABASE_URL`           | PostgreSQL connection string                             |
| `SQLALCHEMY_DATABASE_URI`| SQLAlchemy-specific PostgreSQL URI (same DB as above)    |
| `REDIS_URL`              | Redis connection used for caching and Celery             |
| `CELERY_BROKER_URL`      | Message broker URL for Celery task queue                 |
| `CELERY_RESULT_BACKEND`  | Backend URL for storing Celery task results              |
| `ADMIN_EMAIL`            | Email for the default admin account (created on startup) |
| `ADMIN_PASSWORD`         | Password for the default admin account                   |
| `ALLOWED_ORIGINS`        | Frontend origins permitted by CORS                       |
| `MAIL_*`                 | Email service config for notifications and reminders     |
| `VITE_API_URL`           | Backend API base URL consumed by the Vue frontend        |
| `VITE_APP_TITLE`         | App title displayed in the browser tab                   |

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
  │  ─ docker compose ps  (health check)     │
  └──────────────────┬───────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ✅ Success             ❌ Failure
    echo deployed          echo failed
```

> `script_stop: true` and `set -e` are set on the deploy script — any failed command aborts the deployment immediately.

> `--legacy-peer-deps` is required due to a known peer dependency conflict in the frontend. `--maxsockets=1` throttles concurrent npm connections to avoid network errors on CI.

### Required GitHub Secrets

| Secret        | Description     |
|---------------|-----------------|
| `VPS_HOST`    | VPS IP or domain |
| `VPS_USER`    | SSH username    |
| `VPS_SSH_KEY` | Private SSH key |

---

## Production Setup (VPS)

### Prerequisites

- Ubuntu 24.04
- Docker & Docker Compose installed
- PostgreSQL installed and running
- UFW firewall configured

### Firewall Rules

PostgreSQL runs inside Docker and communicates only on the internal Docker network — it never touches the host's network stack, so no UFW rules are needed for port 5432.

```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Verify
sudo ufw status numbered
```

Expected output:

```
[ 1] Nginx Full       ALLOW IN    Anywhere
[ 2] 22/tcp           ALLOW IN    Anywhere
[ 3] Nginx Full (v6)  ALLOW IN    Anywhere (v6)
[ 4] 22/tcp (v6)      ALLOW IN    Anywhere (v6)
```

---

## Production Debugging

### Container Status

```bash
docker compose ps
docker compose logs -f
docker compose logs -f backend
docker compose logs -f celery
```

### Resource Usage

```bash
docker stats --no-stream
free -h
df -h
```

### Restart Services

```bash
docker compose restart backend
docker compose restart celery
docker compose down && docker compose up -d
```

### Redis

```bash
docker exec hms-redis redis-cli ping           # should return PONG
docker exec hms-redis redis-cli -n 2 KEYS '*'  # view cached keys
docker exec hms-redis redis-cli -n 2 FLUSHDB   # clear cache
```

### Ports

```bash
sudo ss -tlnp | grep -E '80|443|5432'
```

---

## Troubleshooting

| Issue                      | Fix                                                      |
|----------------------------|----------------------------------------------------------|
| Container not starting     | `docker compose logs <service>`                          |
| DB connection refused      | Check UFW rules allow Docker subnet                      |
| Port 80 already in use     | Stop nginx systemd: `sudo systemctl stop nginx`          |
| Redis connection error     | Check `hms-redis` container is running                   |
| 403 on API routes          | Clear browser localStorage and re-login                  |
| Workers crashing           | Check `docker compose logs backend` for errors           |
| GitHub Actions failing     | Check all secrets are set in repo settings               |

---

## Author

**Anshul Shakya** — [@24f1002114](https://github.com/24f1002114)