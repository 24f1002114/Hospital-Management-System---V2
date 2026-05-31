from unittest import result
from flask import current_app as app, request
from flask_restful import Resource, reqparse
from flask_security import auth_required, roles_required, roles_accepted, current_user

from application.task import daily_reminder
from application.models import DoctorProfile, Medicine, PatientProfile, User, db, Appointment, Treatment, Department, DoctorAvailability
from datetime import datetime
#from application.cache import cache 


availability_parser = reqparse.RequestParser()
availability_parser.add_argument("date", type=str, required=True, help="Date is required in YYYY-MM-DD format")
availability_parser.add_argument("day_of_week", type=str, required=True)
availability_parser.add_argument("start_time", type=str, required=True)
availability_parser.add_argument("end_time", type=str, required=True)
availability_parser.add_argument("is_active", type=bool, required=False, default=True)

class AvailabilityResource(Resource):
    
    @auth_required("token")
    @roles_required("doctor")
    def post(self):
        doctor = DoctorProfile.query.filter_by(user_id=current_user.id).first()
        if not doctor:
            return {"message": "Doctor not found"}, 404
        
        data = availability_parser.parse_args()
        
        new_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        new_start_time = datetime.strptime(data["start_time"], "%H:%M").time()
        new_end_time = datetime.strptime(data["end_time"], "%H:%M").time()
        
        existing_slot = DoctorAvailability.query.filter_by(
            doctor_id=doctor.id,
            date=new_date,
            start_time=new_start_time,
            end_time=new_end_time
        ).first()
        
        if existing_slot:
            return {"message": "This availability slot already exists."}, 400
        
        conflicting_appointment = Appointment.query.join(DoctorAvailability).filter(
            DoctorAvailability.doctor_id == doctor.id,
            DoctorAvailability.date == new_date,
            Appointment.status == "Booked",
            DoctorAvailability.start_time < new_end_time,
            DoctorAvailability.end_time > new_start_time
        ).first()
        
        if conflicting_appointment:
            return {"message": "Cannot create availability slot that overlaps with existing booked appointments."}, 400
        
        availability = DoctorAvailability(
            user_id=current_user.id,
            doctor_id=doctor.id,
            date=new_date,
            day_of_week=data["day_of_week"],
            start_time=new_start_time,
            end_time=new_end_time,
            is_active=data.get("is_active", True)
        )
        
        db.session.add(availability)
        db.session.commit()
        
        return {"message": "Availability added", "id": availability.id}, 201

    @auth_required("token")
    @roles_accepted("doctor", "patient")
    def get(self, doctor_id=None):
        if doctor_id:
            doctor = DoctorProfile.query.filter_by(user_id=doctor_id).first()
            if not doctor:
                return {"message": "Doctor not found"}, 404
        else:
            if not current_user.has_role("doctor"):
                return {"message": "Doctor ID is required for patients"}, 400
            doctor = DoctorProfile.query.filter_by(user_id=current_user.id).first()
            if not doctor:
                return {"message": "Doctor profile not found"}, 404
        
        availabilities = DoctorAvailability.query.filter_by(doctor_id=doctor.id).all()

        booked_slot_ids = {
            a.slot_id for a in Appointment.query.filter_by(
                doctor_id=doctor.user_id, status="Booked"
            ).all()
        }

        return [{
            "id": a.id,
            "date": a.date.strftime("%Y-%m-%d"),
            "day_of_week": a.day_of_week,
            "start_time": a.start_time.strftime("%H:%M"),
            "end_time": a.end_time.strftime("%H:%M"),
            "is_active": a.is_active,
            "is_booked": a.id in booked_slot_ids  # ← new field
        } for a in availabilities], 200
    
    @auth_required("token")
    @roles_required("doctor")   
    def put(self, availability_id):
        availability = DoctorAvailability.query.get(availability_id)
        if not availability:
            return {"message": "Availability not found"}, 404
        
        if availability.doctor.user_id != current_user.id:
            return {"message": "You can only update your own availability."}, 403
        
        data = availability_parser.parse_args()
        
        booked_appointment = Appointment.query.filter_by(
            slot_id=availability_id,
            status="Booked"
        ).first()
        
        if booked_appointment:
            return {"message": "Cannot update availability slot that has booked appointments."}, 400

        if data.get("date"):
            availability.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        if data.get("day_of_week"):
            availability.day_of_week = data["day_of_week"]
        if data.get("start_time"):
            availability.start_time = datetime.strptime(data["start_time"], "%H:%M").time()
        if data.get("end_time"):
            availability.end_time = datetime.strptime(data["end_time"], "%H:%M").time()
        if "is_active" in data:    
            availability.is_active = data.get("is_active", availability.is_active)
        
        db.session.commit()
        return {"message": "Availability updated successfully"}, 200
    
    @auth_required("token")
    @roles_required("doctor")
    def delete(self, availability_id):
        availability = DoctorAvailability.query.get(availability_id)
        if not availability:
            return {"message": "Availability not found"}, 404
        
        if availability.doctor.user_id != current_user.id:
            return {"message": "You can only delete your own availability."}, 403
        
        booked_appointment = Appointment.query.filter_by(
            slot_id=availability_id,
            status="Booked"
        ).first()
        
        if booked_appointment:
            return {"message": "Cannot delete availability slot that has booked appointments."}, 400
        
        db.session.delete(availability)
        db.session.commit()
        
        return {"message": "Availability deleted successfully"}, 200
