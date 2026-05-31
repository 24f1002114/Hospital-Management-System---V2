from unittest import result
from flask import current_app as app, request
from flask_restful import Api, Resource, reqparse
from flask_security import auth_required, roles_required, roles_accepted, current_user

from application.task import daily_reminder
from application.models import DoctorProfile, Medicine, PatientProfile, User, db, Appointment, Treatment, Department, DoctorAvailability
from datetime import datetime
#from application.cache import cache 

treatment_parser = reqparse.RequestParser()
treatment_parser.add_argument("appointment_id", type=int, required=True)
treatment_parser.add_argument("visit_type", type=str, default="In-person")
treatment_parser.add_argument("tests_done", type=str)
treatment_parser.add_argument("diagnosis", type=str, required=True)
treatment_parser.add_argument("prescription", type=str, required=True)
treatment_parser.add_argument("notes", type=str)
treatment_parser.add_argument("medicines", type=list, location='json', required=True, help="List of medicines")


class TreatmentResource(Resource):

    @auth_required("token")
    @roles_accepted("doctor")
    def post(self):
        data = request.get_json()
        appointment_id = data.get("appointment_id")
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return {"message": "Appointment not found"}, 404

        if current_user.doctor_profile and current_user.doctor_profile.blacklisted:
            return {"message": "You are blacklisted and cannot add treatments."}, 403

        if appointment.doctor_id != current_user.id:
            return {"message": "Unauthorized: Cannot add treatment to another doctor's appointment"}, 403

        if appointment.status == "Completed":
            return {"message": "Cannot add treatment to a completed appointment"}, 400

        treatment = Treatment(
            appointment_id=appointment_id,
            visit_type=data.get("visit_type", "In-person"),
            tests_done=data.get("tests_done"),
            diagnosis=data.get("diagnosis"),
            prescription=data.get("prescription"),
            notes=data.get("notes"),
            next_visit_date=datetime.strptime(data.get("next_visit_date"), "%Y-%m-%d").date() if data.get("next_visit_date") else None
        )
        db.session.add(treatment)
        db.session.commit()

        for med in data.get("medicines", []):
            db.session.add(Medicine(
                treatment_id=treatment.id,
                name=med.get("name"),
                dosage=med.get("dosage"),
                duration_days=med.get("duration_days")
            ))
        db.session.commit()

        appointment.status = "Completed"
        db.session.commit()

        return {"message": "Treatment record created", "id": treatment.id}, 201

    @auth_required("token")
    @roles_accepted("doctor")
    def put(self, treatment_id):
        treatment = Treatment.query.get(treatment_id)
        if not treatment:
            return {"message": "Treatment record not found"}, 404

        if treatment.appointment.doctor_id != current_user.id:
            return {"message": "Unauthorized: Cannot modify another doctor's treatment"}, 403

        data = request.get_json()

        for key in ["appointment_id", "visit_type", "tests_done", "diagnosis", "prescription", "notes"]:
            if key in data and data[key] is not None:
                setattr(treatment, key, data[key])
        
        if "next_visit_date" in data:
            if data["next_visit_date"]:
                treatment.next_visit_date = datetime.strptime(data["next_visit_date"], "%Y-%m-%d").date()
            else:
                treatment.next_visit_date = None

        if "medicines" in data:
            Medicine.query.filter_by(treatment_id=treatment.id).delete()
            for med in data["medicines"]:
                db.session.add(Medicine(
                    treatment_id=treatment.id,
                    name=med.get("name"),
                    dosage=med.get("dosage"),
                    duration_days=med.get("duration_days")
                ))

        db.session.commit()
        return {"message": "Treatment record updated successfully"}, 200

    @auth_required("token")
    @roles_accepted("admin", "doctor", "patient")
    
    def get(self, treatment_id=None):
        if treatment_id:
            treatment = Treatment.query.get(treatment_id)
            if not treatment:
                return {"message": "Treatment record not found"}, 404
            
            # Check permissions
            if current_user.has_role("patient") and treatment.appointment.patient_id != current_user.id:
                return {"message": "Permission denied"}, 403
            if current_user.has_role("doctor") and treatment.appointment.doctor_id != current_user.id:
                return {"message": "Permission denied"}, 403
                
            data = {
                "id": treatment.id,
                "appointment_id": treatment.appointment_id,
                "patient_id": treatment.appointment.patient_id,
                "patient_name": treatment.appointment.patient_profile.name if treatment.appointment.patient_profile else "N/A",
                "doctor_name": treatment.appointment.doctor_profile.name if treatment.appointment.doctor_profile else "N/A",
                "department": treatment.appointment.department,
                "visit_type": treatment.visit_type,
                "tests_done": treatment.tests_done,
                "diagnosis": treatment.diagnosis,
                "prescription": treatment.prescription,
                "notes": treatment.notes,
                "next_visit_date": treatment.next_visit_date.isoformat() if treatment.next_visit_date else None,
                "medicines": [{
                    "name": m.name,
                    "dosage": m.dosage,
                    "duration_days": m.duration_days
                } for m in treatment.medicines]
            }
            return data, 200
        
        # Get all treatments with filtering
        query = Treatment.query.join(Appointment)
        
        if current_user.has_role("patient"):
            query = query.filter(Appointment.patient_id == current_user.id)
        elif current_user.has_role("doctor"):
            query = query.filter(Appointment.doctor_id == current_user.id)
        
        # Optional filters from query params
        patient_id = request.args.get('patient_id', type=int)
        department = request.args.get('department', type=str)
        
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)
        
        if department and department != 'All':
            query = query.filter(Appointment.department == department)
        
        treatments = query.all()

        result = []
        for t in treatments:
            result.append({
                "id": t.id,
                "appointment_id": t.appointment_id,
                "patient_id": t.appointment.patient_id,
                "patient_name": t.appointment.patient_profile.name if t.appointment.patient_profile else "N/A",
                "doctor_name": t.appointment.doctor_profile.name if t.appointment.doctor_profile else "N/A",
                "department": t.appointment.department,
                "visit_type": t.visit_type,
                "tests_done": t.tests_done,
                "diagnosis": t.diagnosis,
                "prescription": t.prescription,
                "notes": t.notes,
                "next_visit_date": t.next_visit_date.isoformat() if t.next_visit_date else None,
                "medicines": [{
                    "name": m.name,
                    "dosage": m.dosage,
                    "duration_days": m.duration_days
                } for m in t.medicines]
            })
        
        return result, 200

    @auth_required("token")
    @roles_accepted("admin", "doctor")
    def delete(self, treatment_id):
        treatment = Treatment.query.get(treatment_id)
        if not treatment:
            return {"message": "Treatment record not found"}, 404  
        
        if current_user.has_role("doctor") and treatment.appointment.doctor_id != current_user.id:
            return {"message": "Unauthorized: Cannot delete another doctor's treatment"}, 403

        db.session.delete(treatment)
        db.session.commit()
        
        return {"message": "Treatment record deleted successfully"}, 200

