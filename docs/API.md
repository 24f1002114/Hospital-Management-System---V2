# API Reference

Full specification: [`api.yml`](../backend/api.yml) (OpenAPI 3.0)

- **Production:** `https://hmsdesk.app`
- **Local development:** `http://localhost:8000`
- **Authentication:** API key passed via the `Authentication-Token` request header (all routes require it unless noted otherwise)

Render the full spec locally with Swagger UI or Redoc:

```bash
npx @redocly/cli preview-docs backend/api.yml
```

---

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/login` | Authenticate and receive an auth token | No |
| `POST` | `/api/register` | Register a new patient account | No |
| `GET` | `/api/validate-token` | Validate the current auth token | Yes |

### Departments
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/departments` | List all departments | Yes |
| `POST` | `/api/departments` | Create a department | Admin |
| `GET` | `/api/department/{id}` | Get department details | Yes |
| `PUT` | `/api/department/{id}` | Update a department | Admin |
| `DELETE` | `/api/department/{id}` | Delete a department | Admin |

### Doctors
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/doctors` | List all doctors | Yes |
| `POST` | `/api/doctors` | Create a doctor profile | Admin |
| `GET` | `/api/doctor/{id}` | Get doctor details | Yes |
| `PUT` | `/api/doctor/{id}` | Update a doctor profile | Admin |
| `DELETE` | `/api/doctor/{id}` | Delete a doctor profile | Admin |

### Patients
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/patients` | List all patients | Yes |
| `GET` | `/api/patient/{id}` | Get patient details | Yes |
| `PUT` | `/api/patient/{id}` | Update a patient profile | Yes |
| `DELETE` | `/api/patient/{id}` | Delete a patient profile | Admin |

### Appointments
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/appointments` | List all appointments | Yes |
| `POST` | `/api/appointments` | Book a new appointment | Yes |
| `GET` | `/api/appointment/{id}` | Get appointment details | Yes |
| `PUT` | `/api/appointment/{id}` | Update an appointment (e.g. reschedule) | Yes |
| `DELETE` | `/api/appointment/{id}` | Cancel/delete an appointment | Yes |

### Treatments
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/treatments` | List all treatment records | Yes |
| `POST` | `/api/treatments` | Add a treatment record, including prescribed medicines | Doctor |
| `PUT` | `/api/treatment/{id}` | Update a treatment record | Doctor |
| `DELETE` | `/api/treatment/{id}` | Delete a treatment record | Doctor |

### Doctor Availability
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/availabilities` | List doctor availability slots | Yes |
| `POST` | `/api/availabilities` | Add availability slots | Doctor |
| `PUT` | `/api/doctor/availability/{id}` | Update an availability slot | Doctor |
| `DELETE` | `/api/doctor/availability/{id}` | Delete an availability slot | Doctor |

### Blacklist
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/user/{id}/blacklist` | Blacklist a user account | Admin |
| `DELETE` | `/api/user/{id}/blacklist` | Remove a user from the blacklist | Admin |

### Search
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/search/doctors` | Search doctors by name, specialization, or department | No |
| `GET` | `/api/search/patients` | Search patients by name or email | Yes |

### Dashboards
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin dashboard summary data | Admin |
| `GET` | `/api/patient/dashboard` | Patient dashboard summary data | Patient |

### Async Backend Jobs
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/export` | Trigger an asynchronous CSV export task via Celery | Patient |
| `GET` | `/api/csv_result/{task_id}` | Poll or download the result of a CSV export task | Yes (owner only) |