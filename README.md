# Hospital Management System

A full-stack hospital management platform with role-based workflows, asynchronous background processing, and a containerized deployment pipeline built for production-like environments.

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

**Author:** Anshul Shakya

**GitHub:** [@24f1002114](https://github.com/24f1002114)

**Email:** 24f1002114@ds.study.iitm.ac.in

**Live Demo:** [hmsdesk.app](https://hmsdesk.app)

---

## Overview

This system implements a role-based hospital management workflow for patients, doctors, and administrators. It separates core responsibilities across API processing, background jobs, caching, and persistent storage — built to reflect real-world service architecture rather than a single monolithic app.

**Engineering focus:**
- Separation of concerns across services (API, workers, cache, database, proxy)
- Asynchronous processing for non-blocking operations
- Structured relational data modeling
- Automated, repeatable deployment workflow with environment parity

---

## Features

### 🔐 Authentication & Access Control
- Role-based access control across Admin, Doctor, and Patient roles
- API key authentication passed via the `Authentication-Token` header, with configurable token expiry (`SECURITY_TOKEN_MAX_AGE`)
- Route-level permission enforcement based on role, including admin- and doctor-only actions

### 🧑‍⚕️ Hospital Workflow Management
- Patient registration and profile management
- Doctor onboarding with department mapping
- Appointment scheduling and tracking
- Treatment record management
- Medicine/prescription tracking

### ⚡ Performance Layer
- Redis caching for frequently accessed data
- Reduced database load on repeated queries
- Consistent response times under concurrent usage

### 🧵 Background Processing
- Celery-based asynchronous task execution
- Celery Beat for scheduled and periodic jobs
- Supports email notifications, report generation, CSV exports, and periodic maintenance tasks

### 🐳 Deployment & Infra
- Docker Compose multi-service setup with isolated containers per service
- Nginx reverse proxy for request routing and static hosting
- Environment parity between local development and production

### 🔄 Database Migrations
- Alembic-based schema versioning
- Automated migration execution on deploy
- Idempotent seeding for initial roles and admin account

---

## System Architecture

```
Client (Vue.js)
      ↓
Nginx (Reverse Proxy + Static Hosting)
      ↓
Flask API (Gunicorn)
      ↓
PostgreSQL  +  Redis
      ↓
Celery Workers + Celery Beat
```

| Layer | Responsibility |
|---|---|
| Nginx | Serves frontend, routes API requests |
| Flask API | Request processing and business logic |
| PostgreSQL | Persistent relational data |
| Redis | Caching + Celery message broker |
| Celery | Background and scheduled task execution |

---

## Tech Stack

- **Frontend:** Vue.js
- **Backend:** Flask (Gunicorn)
- **Database:** PostgreSQL
- **Cache / Broker:** Redis
- **Task Queue:** Celery + Celery Beat
- **Migrations:** Alembic
- **Reverse Proxy:** Nginx
- **Deployment:** Docker Compose
- **CI/CD:** GitHub Actions

---

## Data Model

**Core entities:** `User`, `Role`, `PatientProfile`, `DoctorProfile`, `Department`, `Appointment`, `Treatment`, `Medicine`

**Relationships:**
- `User` ↔ `Profile` — One-to-One
- `Doctor` ↔ `Appointment` — One-to-Many
- `Doctor` ↔ `Department` — Many-to-Many
- `Patient` ↔ `Appointment` — One-to-Many

---

## API Reference

The API is fully documented via OpenAPI 3.0 in [`api.yml`](./backend/api.yml), covering 11 resource groups and 30+ endpoints (Authentication, Departments, Doctors, Patients, Appointments, Treatments, Availability, Blacklist, Search, Dashboards, and Async Jobs).

- **Live:** `https://hmsdesk.app` · **Local:** `http://localhost:8000`
- **Auth:** API key via the `Authentication-Token` header
- **Full reference:** [`docs/API.md`](./docs/API.md)

Render the interactive spec locally:
```bash
npx @redocly/cli preview-docs backend/api.yml
```

**A few representative endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Authenticate and receive an auth token |
| `GET` | `/api/doctors` | List doctors |
| `POST` | `/api/appointments` | Book a new appointment |
| `POST` | `/api/treatments` | Add a treatment record with prescribed medicines |
| `GET` | `/api/availabilities` | List doctor availability slots |
| `GET` | `/api/search/doctors` | Search doctors by name, specialization, or department |
| `POST` | `/api/export` | Trigger an async CSV export via Celery |
| `GET` | `/api/csv_result/{task_id}` | Poll or download an export result |

---

## Environment Configuration

> ⚠️ Please avoid committing a real `.env` file to version control. The values shown below are placeholders — copy `.env.example` and provide your own configuration.

### Root Environment (Docker layer) — `.env`
```env
ENV=dev
DOMAIN=localhost
DOCKER_HOST_IP=host-gateway

POSTGRES_USER=your-postgres-user
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=hospital_db
```

### Backend Environment — `backend/application/.env`
```env
ENV=prod

SECRET_KEY=your-secret-key
SECURITY_PASSWORD_SALT=your-password-salt
SECURITY_TOKEN_MAX_AGE=86400

DATABASE_URL=postgresql://user:password@postgres:5432/hospital_db
SQLALCHEMY_DATABASE_URI=postgresql://user:password@postgres:5432/hospital_db

REDIS_URL=redis://redis:6379/0
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=2

CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

ALLOWED_ORIGINS=http://localhost:80

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong-password

MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USE_TLS=True
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
```

### Frontend Environment - `frontend/.env.development`
```env
# Dev (Vite dev server)
VITE_API_URL=http://localhost:8000/api

# Prod (served via Nginx, API proxied under same origin)
# VITE_API_URL=/api

VITE_APP_TITLE=Hospital Management System
```
> **Note:** Port `5173` corresponds to the Vite development server, `8000` to the Gunicorn API (used directly in development), and `80` to the Nginx-served production build, where the frontend and proxied API share a single origin. Please update these values to match your environment.

---

## Services

| Service | Responsibility |
|---|---|
| `hms-frontend` | Vue.js UI served via Nginx |
| `hms-backend` | Flask API (Gunicorn) |
| `hms-postgres` | Persistent database |
| `hms-redis` | Cache + message broker |
| `hms-celery` | Background task worker |
| `hms-celery-beat` | Scheduled job execution |
| `hms-migrate` | Database migrations and seeding |

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (only needed for local frontend dev outside containers)
- Git

### Setup

```bash
git clone <repo-url>
cd Hospital-Management-System

cp backend/application/.env.example backend/application/.env
# Update the file with your own configuration values

docker compose up --build
```

This command will:
1. Build and start all services (frontend, backend, database, cache, and workers)
2. Run Alembic migrations automatically via `hms-migrate`
3. Seed initial roles and the administrator account (idempotent, and safe to re-run)

### Access

- **Frontend:** `http://localhost:80`
- **API:** `http://localhost:80/api` (proxied through Nginx)
- **Default administrator login:** use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values defined in your `.env` file

---

## CI/CD Pipeline

```
Push to production branch
        ↓
GitHub Actions (build + validation)
        ↓
Frontend build + backend checks
        ↓
SSH deployment to VPS
        ↓
Docker Compose rebuild
        ↓
Automatic database migration (Alembic)
        ↓
Health check validation
```

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Summary

A modular hospital management backend with clear separation between API processing, background execution, caching, and persistence layers — designed to run consistently across local and production environments using containerized infrastructure, automated migrations, and a CI/CD pipeline to a live VPS.