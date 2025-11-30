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

Flask • Vue.js • Bootstrap • SQLite • SQLAlchemy • Redis • Celery • Flask-Security • Flask-RESTful • MailHog

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
