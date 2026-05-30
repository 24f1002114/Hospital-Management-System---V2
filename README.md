# 🏥 Hospital Management System 

**Modern Application Development - II Project**

> Full-stack hospital management system with Flask backend, Vue.js frontend, featuring RBAC, appointment scheduling, async task processing, and Redis caching.

---

**Name:** Anshul Shakya  
**Email:** 24f1002114@ds.study.iitm.ac.in

---

## Key Features

- **RBAC** — Token-based Admin/Doctor/Patient access control
- **Admin** — Doctor CRUD, user blacklisting, department management
- **Patient** — Registration, doctor search, appointment booking
- **Doctor** — Availability setting, appointment dashboard, treatment records
- **Background Jobs** — Daily reminders, monthly reports, CSV export (Celery)
- **Performance** — Redis caching on high-frequency endpoints (5–10 min TTL)

---

## Technology Stack

| Layer | Tech |
|-------|------|
| Backend | Flask, Flask-RESTful, Flask-Security, SQLAlchemy |
| Frontend | Vue.js (Vite) |
| Web Server | Nginx |
| App Server | Gunicorn (3 sync workers) |
| Database | SQLite (local) / PostgreSQL (production) |
| Cache | Redis |
| Jobs | Celery, Celery Beat |
| Email | Mailtrap |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions → VPS via SSH |

---

## 🏗 Architecture

```
Browser
   │
   ▼
 Nginx (hms-frontend container)
   ├── /        → serves Vue.js static build
   └── /api/    → proxy_pass to Gunicorn
                       │
                       ├── PostgreSQL (host)
                       ├── Redis (hms-redis container)
                       └── Celery + Celery Beat (containers)
```

### Docker Services

| Container | Purpose |
|-----------|---------|
| `hms-frontend` | Nginx serving Vue.js build + API proxy |
| `hms-backend` | Gunicorn running Flask (3 workers) |
| `hms-celery` | Celery background task worker |
| `hms-celery-beat` | Celery scheduled task runner |
| `hms-redis` | Redis message broker + cache |

---

## Database Schema

**Tables:** User • Role • PatientProfile • DoctorProfile • Department • DoctorAvailability • Appointment • Treatment • Medicine

**Key Relationships:**
- User ↔ Role (Many-to-Many)
- User → PatientProfile / DoctorProfile (One-to-One)
- DoctorProfile ↔ Department (Many-to-Many)
- Appointment → Treatment (One-to-One)

---

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/login`, `GET /api/validate-token` |
| Admin | `/api/doctors`, `/api/doctor/<id>`, `/api/user/<id>/blacklist`, `/api/departments` |
| Patient | `/api/patients`, `/api/patient/<id>`, `/api/search/doctors`, `/api/appointments`, `/api/treatments` |
| Doctor | `/api/availabilities`, `/api/doctor/availability/<id>`, `/api/appointments`, `/api/treatments` |

---

## Local Development Setup

### Prerequisites
- Docker & Docker Compose
- PostgreSQL (local)
- Git

### Quick Start

```bash
git clone <repo-url>
cd Hospital-Management-System---V2

# Copy and fill in environment variables
cp backend/application/.env.example backend/application/.env

# Start all services
docker compose up --build
```

**App URL:** http://localhost

A default admin account is created on first run using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

### Local `.env`

```env
ENV=dev
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SQLALCHEMY_DATABASE_URI=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379/0
ALLOWED_ORIGINS=http://localhost:5173,http://localhost
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-admin-password
```

---

## Docker Commands

```bash
# Start all containers
docker compose up -d

# Stop all containers
docker compose down

# Rebuild and restart
docker compose up --build -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend

# Check container status
docker compose ps
```

---

## CI/CD Pipeline (GitHub Actions)

Triggered automatically on every push to the `production` branch.

```
Push to production
       │
       ▼
  ┌─────────────────────────────┐
  │         validate            │
  │  ─ npm ci (frontend)        │
  │  ─ npm run build            │
  │  ─ pip install (backend)    │
  │  ─ py_compile syntax check  │
  └────────────┬────────────────┘
               │ on success
               ▼
  ┌─────────────────────────────────────┐
  │              deploy                 │
  │  ─ SSH into VPS                     │
  │  ─ git reset --hard origin/prod     │
  │  ─ docker compose down              │
  │  ─ docker compose up --build -d     │
  └─────────────────────────────────────┘
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP or domain |
| `VPS_USER` | SSH username |
| `VPS_SSH_KEY` | Private SSH key |

---

## Production Setup (VPS)

### Prerequisites
- Ubuntu 24.04
- Docker & Docker Compose installed
- PostgreSQL installed and running
- UFW firewall configured

### Firewall Rules

```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow from 172.17.0.0/16 to any port 5432
sudo ufw allow from 172.18.0.0/16 to any port 5432
sudo ufw enable
```

### PostgreSQL Configuration

Allow Docker containers to connect by adding to `pg_hba.conf`:

```
host    hospitaldb    hospitaluser    172.17.0.0/16    md5
host    hospitaldb    hospitaluser    172.18.0.0/16    md5
```

Set `listen_addresses = '*'` in `postgresql.conf` and restart PostgreSQL.

### Production `.env`

```env
ENV=prod
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/dbname
SQLALCHEMY_DATABASE_URI=postgresql://user:password@host.docker.internal:5432/dbname
REDIS_URL=redis://hms-redis:6379/0
ALLOWED_ORIGINS=http://your-domain-or-ip
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-admin-password
```

> Never commit your `.env` file. Make sure it is listed in `.gitignore`.

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

| Issue | Fix |
|-------|-----|
| Container not starting | `docker compose logs <service>` |
| DB connection refused | Check UFW rules allow Docker subnet |
| Port 80 already in use | Stop nginx systemd: `sudo systemctl stop nginx` |
| Redis connection error | Check `hms-redis` container is running |
| 403 on API routes | Clear browser localStorage and re-login |
| Workers crashing | Check `docker compose logs backend` for errors |
| GitHub Actions failing | Check all secrets are set in repo settings |

---

## 👤 Author

**Anshul Shakya** — [@24f1002114](https://github.com/24f1002114)