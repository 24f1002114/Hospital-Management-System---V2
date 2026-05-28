from celery import shared_task
from .models import Treatment, Appointment, User, DoctorAvailability, PatientProfile
from datetime import date, datetime
import csv
import os
import requests
from .utils import formate_report
from .mail import send_email

@shared_task(ignore_result=False, name="Download_csv_report")
def csv_report(patient_id):
    if not patient_id:
        raise ValueError("patient_id is required")

    treatments = (
        Treatment.query.join(Appointment, Treatment.appointment_id == Appointment.id)
        .filter(Appointment.patient_id == patient_id)
        .all()
    )

    os.makedirs("static", exist_ok=True)
    filename = f"treatment_report_patient_{patient_id}_{datetime.now():%Y%m%d_%H%M%S%f}.csv"
    path = os.path.join("static", filename)

    with open(path, "w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow([
            "SN", "user_id", "username", "patient_name", "department", "consulting_doctor",
            "appointment_date", "appointment_status", "slot_date", "slot_start_time", "slot_end_time",
            "diagnosis", "prescription", "medicines", "next_visit_date"
        ])

        for i, t in enumerate(treatments, start=1):
            appt = t.appointment
            if not appt:
                continue

            patient = appt.patient_user
            doctor = appt.doctor_user

            appointment_date = ""
            if getattr(appt, "created_at", None):
                try:
                    appointment_date = appt.created_at.strftime("%Y-%m-%d %H:%M:%S")
                except Exception:
                    appointment_date = str(appt.created_at)

            slot = getattr(appt, "doctor_availability", None)
            slot_date = slot.date.strftime("%Y-%m-%d") if slot and getattr(slot, "date", None) else ""
            slot_start = slot.start_time.strftime("%H:%M:%S") if slot and getattr(slot, "start_time", None) else ""
            slot_end = slot.end_time.strftime("%H:%M:%S") if slot and getattr(slot, "end_time", None) else ""

            medicines = "; ".join(
                f"{m.name}|{m.dosage}|{m.duration_days}" for m in (t.medicines or [])
            )

            next_visit = ""
            if getattr(t, "next_visit_date", None):
                try:
                    next_visit = t.next_visit_date.strftime("%Y-%m-%d")
                except Exception:
                    next_visit = str(t.next_visit_date)

            writer.writerow([
                i,
                patient.id if patient else "",
                patient.username if patient else "",
                (patient.patient_profile.name if patient and patient.patient_profile else ""),
                (appt.department if appt.department else ""),
                (doctor.doctor_profile.name if doctor and doctor.doctor_profile else ""),
                appointment_date,
                (appt.status if appt.status else ""),
                slot_date,
                slot_start,
                slot_end,
                t.diagnosis or "",
                t.prescription or "",
                medicines,
                next_visit
            ])

    return filename

@shared_task(ignore_result=False, name="Monthly_report")
def monthly_report():

    from datetime import datetime, timedelta
    import pytz

    ist = pytz.timezone('Asia/Kolkata')
    today = datetime.now(ist).date()   
    
    last_30_days_start = today - timedelta(days=30)

    users_with_appointments = User.query.join(
        PatientProfile, User.id == PatientProfile.user_id
    ).join(
        Appointment, User.id == Appointment.patient_id
    ).filter(
        Appointment.created_at >= last_30_days_start
    ).distinct().all()

    report_count = 0
    error_count = 0

    for user in users_with_appointments:
        try:
            if not user.patient_profile:
                continue

            recent_appointments = [
                appt for appt in user.patient_appointments
                if appt.created_at and appt.created_at.date() >= last_30_days_start
            ]

            if not recent_appointments:
                continue

            user_data = {
                'name': user.patient_profile.name,
                'email': user.email,
            }

            user_treatments = []

            for idx, appt in enumerate(recent_appointments, start=1):
                doctor = appt.doctor_user
                doctor_profile = doctor.doctor_profile if doctor else None
                slot = appt.doctor_availability
                treatment = appt.treatment

                slot_date = slot.date.strftime("%B %d, %Y") if slot and slot.date else "Not scheduled"
                slot_start = slot.start_time.strftime("%I:%M %p") if slot and slot.start_time else "-"
                slot_end = slot.end_time.strftime("%I:%M %p") if slot and slot.end_time else "-"

                medicines = []
                if treatment and treatment.medicines:
                    medicines = [
                        {
                            'name': med.name,
                            'dosage': med.dosage,
                            'duration_days': med.duration_days
                        }
                        for med in treatment.medicines
                    ]

                treatment_info = {
                    "sn": idx,
                    "user_id": user.id,
                    "username": user.username or user.email,
                    "patient_name": user.patient_profile.name,
                    "department": appt.department or "General",
                    "consulting_doctor": doctor_profile.name if doctor_profile else "Not assigned",
                    "appointment_date": appt.created_at.strftime("%B %d, %Y") if appt.created_at else "-",
                    "appointment_status": appt.status or "Unknown",
                    "slot_date": slot_date,
                    "slot_start_time": slot_start,
                    "slot_end_time": slot_end,
                    "diagnosis": treatment.diagnosis if treatment else "Pending",
                    "prescription": treatment.prescription if treatment else "Pending",
                    "medicines": medicines,
                    "next_visit_date": treatment.next_visit_date.strftime("%B %d, %Y") if (treatment and treatment.next_visit_date) else "-"
                }
                user_treatments.append(treatment_info)

            user_data['treatments'] = user_treatments

            message = formate_report("templates/monthly_report.html", user_data)

            send_email(
                to_address=user_data['email'],
                subject="Monthly Treatment Report - Last 30 Days",
                message=message
            )

            report_count += 1

        except Exception as e:
            error_count += 1
            print(f"Error sending report to user {user.id} ({user.email}): {str(e)}")
            continue

    return f"Monthly reports (last 30 days) sent: {report_count}, Errors: {error_count}"

@shared_task(ignore_result=False, name="daily_reminder")
def daily_reminder():
    from datetime import datetime
    import pytz

    ist = pytz.timezone('Asia/Kolkata')
    today = datetime.now(ist).date()
    appointments = Appointment.query.join(
        DoctorAvailability,
        Appointment.slot_id == DoctorAvailability.id
    ).filter(
        Appointment.status == 'Booked',
        DoctorAvailability.date == today
    ).all()

    reminder_count = 0

    for appt in appointments:
        patient = appt.patient_profile
        patient_user = appt.patient_user
        slot = appt.doctor_availability

        if patient and patient_user and slot:
            data = {
                'patient_name': patient.name,
                'department': appt.department,
                'doctor_name': appt.doctor_profile.name,
                'appointment_date': slot.date.strftime('%B %d, %Y'),
                'start_time': slot.start_time.strftime('%I:%M %p'),
                'end_time': slot.end_time.strftime('%I:%M %p')
            }

            send_email(
                to_address=patient_user.email,
                subject="Appointment Reminder - Today",
                message=formate_report("templates/daily_reminder.html", data)
            )
            reminder_count += 1

    return f"Daily reminders sent: {reminder_count}"







