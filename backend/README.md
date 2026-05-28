# Hospital Management System - V2

**Modern Application Development - II Project**

---

**Name:** Anshul Shakya

**Email:** 24f1002114@ds.study.iitm.ac.in

---

## Project Overview

Full-stack hospital management system with Flask backend, Vue.js frontend, featuring RBAC, appointment scheduling, async task processing, and Redis caching.

### Key Features

* **RBAC** : Token-based Admin/Doctor/Patient access control
* **Admin** : Doctor CRUD, user blacklisting, department management
* **Patient** : Registration, doctor search, appointment booking/rescheduling
* **Doctor** : Availability setting, appointment dashboard, treatment records
* **Background Jobs** : Daily reminders, monthly reports, CSV export (Celery)
* **Performance** : Redis caching on high-frequency endpoints (5-10 min TTL)

---

## Technology Stack

Flask • Vue.js • Bootstrap • SQLite • PostgreSQL • SQLAlchemy • Redis • Celery • Flask-Security • Flask-RESTful • MailHog

---

## Database Schema

### Tables

User • Role • PatientProfile • DoctorProfile • Department • DoctorAvailability • Appointment • Treatment • Medicine

### Key Relationships

* User ↔ Role (Many-to-Many)
* User → PatientProfile/DoctorProfile (One-to-One)
* DoctorProfile ↔ Department (Many-to-Many)
* Appointment → Treatment (One-to-One)

---

## API Endpoints

**Auth:** `POST /api/login`

**Admin:** `/api/doctors`, `/api/doctor/<id>`, `/api/user/<id>/blacklist`, `/api/departments`

**Patient:** `/api/patients`, `/api/patient/<id>`, `/api/search/doctors`, `/api/appointments`, `/api/treatments`

**Doctor:** `/api/availabilities`, `/api/doctor/availability/<id>`, `/api/appointments`, `/api/treatments`

*Complete API specification in `api.yaml`*

---

## Setup & Installation

### Prerequisites

Python 3.8+ • Redis • MailHog

### Install

```bash
# Create virtual environment
python3 -m venv ~/venvs/HMS
source ~/venvs/HMS/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database (auto-creates admin user)
python3 app.py
```

---
Pre-seeded Admin user created on database initialization
Email : `admin@example.com`
Password: `1234`

## Running the Application

**Run these 5 commands in separate terminals:**

### 1. Redis Server

```bash
redis-server
```

### 2. MailHog (Email Testing)

```bash
MailHog &
```

*Access UI at http://localhost:8025*

### 3. Celery Worker

```bash
source ~/venvs/HMS/bin/activate
celery -A app.celery worker --loglevel INFO
```

### 4. Celery Beat (Scheduled Tasks)

```bash
source ~/venvs/HMS/bin/activate
celery -A app.celery beat --loglevel INFO
```

### 5. Flask Application

```bash
source ~/venvs/HMS/bin/activate
python app.py
```

**Application URL:** http://localhost:5000

---

## Redis Cache Commands

```bash
# View all cached keys
redis-cli -n 2 KEYS hms_cache_*

# Monitor cache operations
redis-cli -n 2 MONITOR

# Check cache size
redis-cli -n 2 DBSIZE

# View specific cache
redis-cli -n 2 GET "hms_cache_/api/doctors..."

# Clear all cache
redis-cli -n 2 FLUSHDB
```

---

## Troubleshooting

**Redis connection error:** `redis-server`

**Celery tasks not running:** Check worker and beat terminals

**Port in use:** `lsof -ti:5000 | xargs kill -9`

## SQLite → PostgreSQL Migration

This project uses **SQLite** locally and **PostgreSQL** in production. The database is selected automatically based on the `ENV` variable.

---

## 1. Install & Start PostgreSQL

```bash
sudo apt update && sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql && sudo systemctl enable postgresql
```

---

### 2. Create Database & User

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE hospital_db;
CREATE USER hospital_user WITH PASSWORD 'strongpassword';
GRANT ALL PRIVILEGES ON DATABASE hospital_db TO hospital_user;
ALTER DATABASE hospital_db OWNER TO hospital_user;
\q
```

---

### 3. Configure `.env`

```env
ENV=prod
DATABASE_URL=postgresql://hospital_user:strongpassword@localhost:5432/hospital_db
SECRET_KEY=your-secret-key
```

---

### 4. Install Driver & Run

```bash
pip install psycopg2-binary
python app.py
```

---

### 5. Verify Tables

```bash
psql -U hospital_user -d hospital_db
\dt
```

> Set `ENV=prod` to use PostgreSQL. Without it, the app defaults to SQLite.

---

### PostgreSQL Reference

### Common psql Commands

```sql
\l              -- List all databases
\c db_name      -- Connect to a database
\dt             -- List all tables
\d table_name   -- Describe table structure
\q              -- Quit
```

### Useful Queries

```sql
SELECT * FROM users;
SELECT current_database();
SELECT current_user;
```

### Backup & Restore

```bash
pg_dump hospital_db > backup.sql
psql hospital_db < backup.sql
```

> If `psql -U postgres` fails, use `sudo -u postgres psql` — the system may use **peer authentication**.