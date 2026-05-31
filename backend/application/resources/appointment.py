from flask import current_app as app, request
from flask_restful import Resource, reqparse
from flask_security import auth_required, roles_accepted, current_user

from application.models import DoctorProfile, PatientProfile, db, Appointment, Department, DoctorAvailability
#from application.cache import cache 


appointment_parser = reqparse.RequestParser()
appointment_parser.add_argument("doctor_id", type=int, required=True, help="Doctor ID is required")
appointment_parser.add_argument("department", type=str, required=True, help="Department is required")
appointment_parser.add_argument("slot_id", type=int, required=True, help="Slot ID is required")
appointment_parser.add_argument("status", type=str, required=False, default="Booked")

class AppointmentResource(Resource):
    
    @auth_required("token")
    @roles_accepted("admin", "doctor", "patient")
    def get(self, appointment_id=None):
        
        patient_profile = current_user.patient_profile if current_user.has_role("patient") else None
        doctor_profile = current_user.doctor_profile if current_user.has_role("doctor") else None

        if patient_profile and patient_profile.blacklisted:
            return {"message": "You are blacklisted and cannot view appointments."}, 403

        if doctor_profile and doctor_profile.blacklisted:
            return {"message": "You are blacklisted and cannot view appointments."}, 403

        if appointment_id is not None:           
            if patient_profile:
                appointment = Appointment.query.filter_by(id=appointment_id, patient_id=current_user.id).first()
            elif doctor_profile:
                appointment = Appointment.query.filter_by(id=appointment_id, doctor_id=current_user.id).first()
            else:
                appointment = Appointment.query.get(appointment_id)
                
            if not appointment: 
                return {"message": "Appointment not found."}, 404
            
            slot_info = {}
            if appointment.doctor_availability:
                slot_info = {
                    "date": appointment.doctor_availability.date.strftime("%Y-%m-%d"),
                    "day_of_week": appointment.doctor_availability.day_of_week,
                    "start_time": appointment.doctor_availability.start_time.strftime("%H:%M"),
                    "end_time": appointment.doctor_availability.end_time.strftime("%H:%M")
                }
                
            data = {
                "id": appointment.id,
                "patient_id": appointment.patient_id,
                "patient_name": appointment.patient_profile.name if appointment.patient_profile else "N/A",
                "doctor_id": appointment.doctor_id,
                "doctor_name": appointment.doctor_profile.name if appointment.doctor_profile else "N/A",
                "specialization": appointment.doctor_profile.specialization if appointment.doctor_profile else "N/A",
                "department": appointment.department,
                "slot_id": appointment.slot_id,
                "slot_details": slot_info,
                "status": appointment.status,
                "created_at": appointment.created_at.isoformat()
            }
            return data, 200
        
        department = request.args.get('department', type=str)
        doctor_id = request.args.get('doctor_id', type=int)
        status = request.args.get('status', type=str)
        day_of_week = request.args.get('day_of_week', type=str)
        
        if patient_profile:
            query = Appointment.query.filter_by(patient_id=current_user.id)
        elif doctor_profile:
            query = Appointment.query.filter_by(doctor_id=current_user.id)
        else:
            query = Appointment.query
        
        if department:
            query = query.filter_by(department=department)
        if doctor_id:
            query = query.filter_by(doctor_id=doctor_id)
        if status:
            query = query.filter_by(status=status)
        if day_of_week:
            query = query.join(DoctorAvailability).filter(DoctorAvailability.day_of_week == day_of_week)
        
        appointments = query.order_by(Appointment.created_at.desc()).all()
        
        if not appointments:
            return [], 200
        
        result = []
        for a in appointments:
            slot_info = {}
            if a.doctor_availability:
                slot_info = {
                    "date": a.doctor_availability.date.strftime("%Y-%m-%d"),
                    "day_of_week": a.doctor_availability.day_of_week,
                    "start_time": a.doctor_availability.start_time.strftime("%H:%M"),
                    "end_time": a.doctor_availability.end_time.strftime("%H:%M")
                }
            
            result.append({
                "id": a.id,
                "patient_id": a.patient_id,
                "patient_name": a.patient_profile.name if a.patient_profile else "N/A",
                "doctor_id": a.doctor_id,
                "doctor_name": a.doctor_profile.name if a.doctor_profile else "N/A",
                "specialization": a.doctor_profile.specialization if a.doctor_profile else "N/A",
                "department": a.department,
                "slot_id": a.slot_id,
                "slot_details": slot_info,
                "status": a.status,
                "created_at": a.created_at.isoformat()
            })
            
        return result, 200
        

    @auth_required("token")
    @roles_accepted("patient")
    def post(self):
        data = appointment_parser.parse_args()
        
        doctor = DoctorProfile.query.filter_by(user_id=data["doctor_id"]).first()
        if not doctor:
            return {"message": "Selected doctor does not exist."}, 404
            
        if doctor.blacklisted:
            return {"message": "Selected doctor is blacklisted."}, 403

        department_name = data.get("department")
        if not department_name:
            return {"message": "Department is required."}, 400
        
        department = Department.query.filter_by(name=department_name).first()
        if not department:
            return {"message": "Invalid department selected."}, 400
        
        if department not in doctor.departments:
            return {"message": "Selected doctor does not work in this department."}, 400

        current_user_profile = PatientProfile.query.filter_by(user_id=current_user.id).first()
        if not current_user_profile:
            return {"message": "Patient profile not found."}, 404
            
        if current_user_profile.blacklisted:
            return {"message": "You are blacklisted and cannot book appointments."}, 403
        
        slot_id = data.get("slot_id")
        if not slot_id:
            return {"message": "Slot ID is required."}, 400
        
        slot = DoctorAvailability.query.filter_by(
            id=slot_id,
            doctor_id=doctor.id,
            is_active=True
        ).first()
        
        if not slot:
            return {"message": "Invalid or inactive time slot selected."}, 404

        booked = Appointment.query.filter_by(
            doctor_id=data["doctor_id"],
            slot_id=slot_id,
            status="Booked"
        ).first()
        
        if booked:
            return {"message": "This time slot is already booked for the selected doctor."}, 400
        
        appointment = Appointment(
            patient_id=current_user.id,
            doctor_id=data["doctor_id"],
            department=department_name,
            slot_id=slot_id,
            status=data.get("status", "Booked")
        )
        
        
        try:
            db.session.add(appointment)
            db.session.commit()
         
            return {
                "status": appointment.status,
                "id": appointment.id,
                "department": appointment.department,
                "slot_id": appointment.slot_id,
                "slot_details": {
                    "date": slot.date.strftime("%Y-%m-%d"),
                    "day_of_week": slot.day_of_week,
                    "start_time": slot.start_time.strftime("%H:%M"),
                    "end_time": slot.end_time.strftime("%H:%M")
                }
            }, 201
        except Exception as e:
            db.session.rollback()
            return {"message": f"Error booking appointment: {str(e)}"}, 500
    
    @auth_required("token")
    @roles_accepted("admin", "doctor", "patient")
    def put(self, appointment_id):
        if not appointment_id:
            return {"message": "Appointment ID is required."}, 400
        
        patient_profile = current_user.patient_profile if current_user.has_role("patient") else None
        doctor_profile = current_user.doctor_profile if current_user.has_role("doctor") else None
        is_admin = current_user.has_role("admin")
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return {"message": "Appointment not found."}, 404
        
        if patient_profile and appointment.patient_id != current_user.id:
            return {"message": "You don't have permission to update this appointment."}, 403
        
        if doctor_profile and appointment.doctor_id != current_user.id:
            return {"message": "You don't have permission to update this appointment."}, 403
        
        data = request.get_json() or {}
        
        if not data:
            return {"message": "No data provided for update."}, 400
        
        valid_statuses = ["Booked", "Cancelled", "Completed", "No-show"]
        if data.get("status") and data["status"] not in valid_statuses:
            return {"message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}, 400
        
        if data.get("slot_id") and data["slot_id"] != appointment.slot_id:
            new_slot_id = data["slot_id"]
            
            new_slot = DoctorAvailability.query.filter_by(
                id=new_slot_id,
                doctor_id=appointment.doctor_id,
                is_active=True
            ).first()
            
            if not new_slot:
                return {"message": "Invalid or inactive time slot selected."}, 404
            
            existing = Appointment.query.filter_by(
                doctor_id=appointment.doctor_id,
                slot_id=new_slot_id
            ).filter(Appointment.id != appointment_id).first()
            
            if existing:
                return {"message": "This time slot is already booked for the selected doctor."}, 400
            
            appointment.slot_id = new_slot_id
        
        if data.get("department") and data["department"] != appointment.department:
            department_name = data["department"]
            
            department = Department.query.filter_by(name=department_name).first()
            if not department:
                return {"message": "Invalid department selected."}, 400
            
            doctor = DoctorProfile.query.filter_by(user_id=appointment.doctor_id).first()
            if department not in doctor.departments:
                return {"message": "Selected doctor does not work in this department."}, 400
            
            appointment.department = department_name
        
        if data.get("doctor_id") and data["doctor_id"] != appointment.doctor_id:
            if not is_admin:
                return {"message": "Only admin can change the assigned doctor."}, 403
            
            new_doctor = DoctorProfile.query.filter_by(user_id=data["doctor_id"]).first()
            if not new_doctor:
                return {"message": "Selected doctor does not exist."}, 404
            
            if new_doctor.blacklisted:
                return {"message": "Selected doctor is blacklisted."}, 403
            
            appointment.doctor_id = data["doctor_id"]
        
        if data.get("status"):
            appointment.status = data["status"]
        
        try:
            db.session.commit()
            
            slot_info = {}
            if appointment.doctor_availability:
                slot_info = {
                    "date": appointment.doctor_availability.date.strftime("%Y-%m-%d"),
                    "day_of_week": appointment.doctor_availability.day_of_week,
                    "start_time": appointment.doctor_availability.start_time.strftime("%H:%M"),
                    "end_time": appointment.doctor_availability.end_time.strftime("%H:%M")
                }
            
            return {
                "message": "Appointment updated successfully",
                "id": appointment.id,
                "patient_id": appointment.patient_id,
                "doctor_id": appointment.doctor_id,
                "department": appointment.department,
                "slot_id": appointment.slot_id,
                "slot_details": slot_info,
                "status": appointment.status
            }, 200
        except Exception as e:
            db.session.rollback()
            return {"message": f"Error updating appointment: {str(e)}"}, 500

    @auth_required("token")
    @roles_accepted("admin", "patient")
    def delete(self, appointment_id):
        if not appointment_id:
            return {"message": "Appointment ID is required."}, 400
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return {"message": "Appointment not found."}, 404
        
        if current_user.has_role("patient"):
            if appointment.patient_id != current_user.id:
                return {"message": "You don't have permission to delete this appointment."}, 403
        
        try:
            db.session.delete(appointment)
            db.session.commit()
            return {"message": "Appointment deleted successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"message": f"Error deleting appointment: {str(e)}"}, 500
