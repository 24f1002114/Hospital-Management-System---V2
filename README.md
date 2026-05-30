# 🏥 Hospital Management System - V2

**Modern Application Development - II Project**

> Full-stack hospital management system with Flask backend, Vue.js frontend, featuring RBAC, appointment scheduling, async task processing, and Redis caching.

---

**Name:** Anshul Shakya
**Email:** 24f1002114@ds.study.iitm.ac.in

---

## Key Features

- **RBAC** — Token-based Admin/Doctor/Patient access control
- **Admin** — Doctor CRUD, user blacklisting, department management
- **Patient** — Registration, doctor search, appointment booking/rescheduling
- **Doctor** — Availability setting, appointment dashboard, treatment records
- **Background Jobs** — Daily reminders, monthly reports, CSV export (Celery)
- **Performance** — Redis caching on high-frequency endpoints (5–10 min TTL)

---

## Technology Stack

| Layer | Tech |
|-------|------|
| Backend | Flask, Flask-RESTful, Flask-Security, SQLAlchemy|
| Frontend | Vue.js (CLI) |
| Web Server | Nginx |
| App Server | Gunicorn | 
| Database | SQLite (local) / PostgreSQL (production) |
| Cache | Redis |
| Jobs | Celery, Celery Beat |
| Email | Mailtrap |
| CI/CD | GitHub Actions → VPS via SSH |

---

## 🏗 Architecture

```
Browser
   │
   ▼
 Nginx
   ├── /        → serves Vue.js static build
   └── /api/    → proxy_pass to Gunicorn
                       │
                       ├── PostgreSQL
                       ├── Redis (cache)
                       └── Celery + Celery Beat (background jobs)
```

### Architecture Table

| Layer | Choice | Why |
|-------|--------|-----|
| Web Server | Nginx | Industry standard for static serving + reverse proxy |
| App Server | Gunicorn | Production-grade WSGI server for Flask |
| Backend | Flask | Lightweight, flexible, mature ecosystem |
| Frontend | Vue.js (static build) | No SSR needed for authenticated dashboard, simpler and faster |
| Database | PostgreSQL (prod) / SQLite (local) | Robust relational DB in prod, zero-config locally |
| Cache | Redis | Reduces DB hits on high-frequency endpoints (5–10 min TTL) |
| Background Jobs | Celery + Celery Beat | Industry standard for Python async tasks and scheduled jobs |
| CI/CD | GitHub Actions | Zero infrastructure overhead, free for public repos |
| Process Management | Systemd | Auto-restart on crash, native to Linux |


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

> Complete API specification in `api.yaml`

---

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 20+ & npm
- Redis
- Mailtrap account

### Backend

```bash
python3 -m venv venv
source venv/bin/activate
cd backend
pip install -r requirements.txt
python app.py
```

A default admin account is created automatically on first run. Update the credentials immediately after setup via the admin panel.

### Local `.env`

Copy `.env.example` to `.env` and fill in your values:

```env
ENV=dev
SECRET_KEY=
MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_USE_TLS=True
```

### Frontend

```bash
cd frontend
npm ci --legacy-peer-deps
npm run dev
```

---

## Running Locally

Run these **4 commands in separate terminals:**

```bash
# 1. Redis
redis-server

# 2. Celery Worker
source venv/bin/activate
celery -A app.celery worker --loglevel INFO

# 3. Celery Beat
source venv/bin/activate
celery -A app.celery beat --loglevel INFO

# 4. Flask App
source venv/bin/activate
python app.py
```

**Backend URL:** http://localhost:5000

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
  │  ─ pip install                      │
  │  ─ npm run build                    │
  │  ─ copy dist to web root            │
  │  ─ restart gunicorn                 │
  │  ─ restart celery                   │
  │  ─ restart celery-beat              │
  │  ─ restart nginx                    │
  └─────────────────────────────────────┘
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP or domain |
| `VPS_USER` | SSH username |
| `VPS_SSH_KEY` | Private SSH key |
| `VPS_PORT` | SSH port |

---

## Nginx Config

Nginx serves the Vue.js static build and proxies all `/api/` requests to Gunicorn. The config handles Vue SPA routing by falling back to `index.html` for all unknown routes, and forwards the `Authentication-Token` header to Flask for auth.

---

## Systemd Services

The following services are managed on the VPS via systemd:

| Service | Purpose |
|---------|---------|
| `hms-gunicorn` | Flask backend (3 sync workers) |
| `hms-frontend` | Frontend static service |
| `celery` | Background task worker |
| `celery-beat` | Scheduled task runner |
| `nginx` | Web server / reverse proxy |

```bash
sudo systemctl restart hms-gunicorn celery celery-beat hms-frontend nginx
```

---

## PostgreSQL Setup (Production)

Install PostgreSQL, create a database and user, then configure the connection string in your `.env` file. Set `ENV=prod` to switch from SQLite to PostgreSQL automatically.

### Production `.env`

```env
ENV=prod
SECRET_KEY=
DATABASE_URL=
MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_USE_TLS=True
```

> Never commit your `.env` file. Make sure it is listed in `.gitignore`.

---

## Redis Cache

```bash
redis-cli ping                       # should return PONG
redis-cli -n 2 KEYS hms_cache_*     # view cached keys
redis-cli -n 2 FLUSHDB              # clear cache
```

---

## Production Debugging

### Service Status
```bash
sudo systemctl status hms-gunicorn
sudo systemctl status celery
sudo systemctl status celery-beat
sudo systemctl status hms-frontend
sudo systemctl status nginx
```

### Live Logs
```bash
sudo tail -f /var/log/gunicorn/hms-access.log
sudo tail -f /var/log/gunicorn/hms-error.log
sudo journalctl -u hms-gunicorn -f
sudo journalctl -u celery -f
sudo journalctl -u nginx -f
```

### Nginx
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Ports
```bash
sudo ss -tlnp | grep -E '80|443|8000'
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Redis connection error | Run `redis-server` |
| Celery tasks not running | Check worker and beat terminals |
| Port already in use | `lsof -ti:<port> \| xargs kill -9` |
| PostgreSQL auth error | Use `sudo -u postgres psql` (peer auth) |
| Nginx 502 Bad Gateway | Make sure gunicorn service is running |
| GitHub Actions failing | Check all 4 secrets are set in repo settings |

---

## 👤 Author

**Anshul Shakya** — [@24f1002114](https://github.com/24f1002114)