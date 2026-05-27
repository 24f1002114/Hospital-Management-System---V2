from unittest import result
from flask import current_app as app, request
from flask_restful import Api, Resource, reqparse
from flask_security import auth_required, roles_required, roles_accepted, current_user

from application.task import daily_reminder
from .models import DoctorProfile, Medicine, PatientProfile, User, db, Appointment, Treatment, Department, DoctorAvailability
from werkzeug.security import generate_password_hash
from datetime import datetime
#from application.cache import cache 

api = Api()

# ------------------ Parsers ------------------

appointment_parser = reqparse.RequestParser()
appointment_parser.add_argument("doctor_id", type=int, required=True, help="Doctor ID is required")
appointment_parser.add_argument("department", type=str, required=True, help="Department is required")
appointment_parser.add_argument("slot_id", type=int, required=True, help="Slot ID is required")
appointment_parser.add_argument("status", type=str, required=False, default="Booked")

availability_parser = reqparse.RequestParser()
availability_parser.add_argument("date", type=str, required=True, help="Date is required in YYYY-MM-DD format")
availability_parser.add_argument("day_of_week", type=str, required=True)
availability_parser.add_argument("start_time", type=str, required=True)
availability_parser.add_argument("end_time", type=str, required=True)
availability_parser.add_argument("is_active", type=bool, required=False, default=True)

treatment_parser = reqparse.RequestParser()
treatment_parser.add_argument("appointment_id", type=int, required=True)
treatment_parser.add_argument("visit_type", type=str, default="In-person")
treatment_parser.add_argument("tests_done", type=str)
treatment_parser.add_argument("diagnosis", type=str, required=True)
treatment_parser.add_argument("prescription", type=str, required=True)
treatment_parser.add_argument("notes", type=str)
treatment_parser.add_argument("medicines", type=list, location='json', required=True, help="List of medicines")

department_parser = reqparse.RequestParser()
department_parser.add_argument('name', type=str, required=True, help='Department name is unique')
department_parser.add_argument('description', type=str, required=True, help='Description is required')

doctor_parser = reqparse.RequestParser()
doctor_parser.add_argument('email', type=str, required=True, help='Email is required')
doctor_parser.add_argument('username', type=str, required=True, help='Username is required')
doctor_parser.add_argument('name', type=str, required=True, help='Name is required')
doctor_parser.add_argument('age', type=int, required=False)
doctor_parser.add_argument('gender', type=str, required=False, help='Gender is required')
doctor_parser.add_argument('password', default='1234')
doctor_parser.add_argument('degree', type=str, required=True, help='Degree is required')
doctor_parser.add_argument('specialization', type=str, required=True, help='Specialization is required')
doctor_parser.add_argument('years_of_experience', type=int, required=True, help='Years of experience is required')
doctor_parser.add_argument('bio', type=str, required=False)
doctor_parser.add_argument('role', type=str, required=False, default='doctor')
doctor_parser.add_argument('departments', type=int, action='append', required=True, help='Departments ids list required')


# ------------------ Resources ------------------

class DoctorRegistration(Resource):
    
    @auth_required('token')
    @roles_required('admin')
    def post(self):
        data = doctor_parser.parse_args()

        if User.query.filter_by(email=data['email']).first():
            return {"message": "Email already registered"}, 400
        if User.query.filter_by(username=data['username']).first():
            return {"message": "Username already taken"}, 400
        
        role = app.security.datastore.find_role(data['role'])
        
        doctor_user = app.security.datastore.create_user(
            email=data['email'],
            username=data['username'],
            password=generate_password_hash(data['password']),
            roles=[role],
            active=True
        )
        db.session.add(doctor_user)
        db.session.commit()

        profile = DoctorProfile(
            user_id=doctor_user.id,
            name=data['name'],
            age=data.get('age'),
            gender=data.get('gender'),
            degree=data['degree'],
            specialization=data['specialization'],
            years_of_experience=data['years_of_experience'],
            bio=data.get('bio')
        )
        db.session.add(profile)
        db.session.commit()

        departments = Department.query.filter(Department.id.in_(data['departments'])).all()
        for department in departments:
            department.doctors.append(profile)
        db.session.commit()

        #cache.clear()
        
        return {"message": "Doctor registered successfully", "id": doctor_user.id}, 201
    
    @auth_required('token')
    @roles_accepted('admin', 'patient', 'doctor')
    #@cache.cached(timeout=300, query_string=True) #caching data
    def get(self, doctor_id=None):
        """
        if doctor_id:
            cache_key = f'doctor_{doctor_id}'
        else:
            cache_key = 'doctors_all'
        cached = cache.get(cache_key)
        if cached:
            return cached, 200
        """
        if doctor_id:
            doctor_profile = DoctorProfile.query.filter_by(user_id=doctor_id).first()
            if not doctor_profile:
                return {"message": "Doctor not found"}, 404
                
            data = {
                "id": doctor_profile.user.id,
                "email": doctor_profile.user.email,
                "username": doctor_profile.user.username,
                "name": doctor_profile.name,
                "age": doctor_profile.age,
                "gender": doctor_profile.gender,
                "degree": doctor_profile.degree,
                "specialization": doctor_profile.specialization,
                "years_of_experience": doctor_profile.years_of_experience,
                "bio": doctor_profile.bio,
                "blacklisted": doctor_profile.blacklisted,
                "departments": [dept.id for dept in doctor_profile.departments]
            }
            #cache.set(cache_key, data, timeout=300)
            return data, 200
        
        all_profiles = DoctorProfile.query.all()
        data = []
        for profile in all_profiles:
            data.append({
                "id": profile.user.id,
                "email": profile.user.email,
                "username": profile.user.username,
                "name": profile.name,
                "age": profile.age,
                "gender": profile.gender,
                "degree": profile.degree,
                "specialization": profile.specialization,
                "years_of_experience": profile.years_of_experience,
                "bio": profile.bio,
                "blacklisted": profile.blacklisted,
                "departments": [dept.id for dept in profile.departments]
            })    
        #cache.set(cache_key, data, timeout=300)
        return data, 200
    
    @auth_required('token')
    @roles_required('admin')
    def put(self, doctor_id):
        profile = DoctorProfile.query.filter_by(user_id=doctor_id).first()
        if not profile:
            return {"message": "Doctor not found"}, 404
            
        data = request.json
        
        if 'email' in data:
            profile.user.email = data['email']
        if 'username' in data:
            profile.user.username = data['username']
        if 'password' in data:
            profile.user.password = generate_password_hash(data['password'])

        profile.name = data.get('name', profile.name)
        profile.age = data.get('age', profile.age)
        profile.gender = data.get('gender', profile.gender)
        profile.degree = data.get('degree', profile.degree)
        profile.specialization = data.get('specialization', profile.specialization)
        profile.years_of_experience = data.get('years_of_experience', profile.years_of_experience)
        profile.bio = data.get('bio', profile.bio)

        if 'departments' in data:
            profile.departments = Department.query.filter(Department.id.in_(data['departments'])).all()
            
        db.session.commit()

        #cache.clear()

        return {"message": "Doctor updated successfully"}, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, doctor_id: int):
        profile = DoctorProfile.query.filter_by(user_id=doctor_id).first()
        if not profile:
            return {"message": "Doctor not found"}, 404
        
        Treatment.query.filter(
            Treatment.appointment_id.in_(
                db.session.query(Appointment.id).filter_by(doctor_id=doctor_id)
            )
        ).delete(synchronize_session='fetch')
        
        DoctorAvailability.query.filter_by(doctor_id=profile.id).delete(synchronize_session='fetch')
        Appointment.query.filter_by(doctor_id=doctor_id).delete(synchronize_session='fetch')
        profile.departments.clear()
        
        user = profile.user
        db.session.delete(user)
        db.session.commit()

        #cache.clear()

        return {"message": "Doctor deleted successfully"}, 200


class DepartmentResource(Resource):
    
    @auth_required("token")
    @roles_accepted("admin")
    def post(self):
        data = department_parser.parse_args()
        existing_dept = Department.query.filter_by(name=data["name"]).first()
        if existing_dept:
            return {"message": "Department name must be unique"}, 400
            
        department = Department(name=data['name'], description=data.get('description'))
        db.session.add(department)
        db.session.commit()

        #cache.clear()

        return {"message": "Department created", "id": department.id}, 201
    
    @auth_required("token")
    @roles_accepted("admin", "patient")
   # @cache.cached(timeout=300, query_string=True)
    def get(self, id=None):
        """ 
        if id:
            cache_key = f'department_{id}'
        else:
            cache_key = 'departments_all'
        cached = cache.get(cache_key)
        if cached:
            return cached, 200
            """

        if id:
            department = Department.query.get(id)
            if not department:
                return {"message": "Department not found"}, 404
                
            data = {
                "id": department.id,
                "name": department.name,
                "description": department.description,
                "doctors": [{"id": doc.user_id, "name": doc.name} for doc in department.doctors]
            }

            #cache.set(cache_key, data, timeout=200)
            return data, 200
        
        departments = Department.query.all()
        data = [{
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "doctors": [{"id": doc.user_id, "name": doc.name} for doc in d.doctors]
        } for d in departments]
        #cache.set(cache_key, data, timeout=200)
        return data, 200

    @auth_required("token")
    @roles_accepted("admin")
    def put(self, id: int):
        department = Department.query.get(id)
        if not department:
            return {"message": "Department not found"}, 404
            
        data = request.json
        
        if 'name' in data:
            existing_dept = Department.query.filter_by(name=data['name']).first()
            if existing_dept and existing_dept.id != id:
                return {"message": "Department name must be unique"}, 400
            department.name = data['name']
            
        if 'description' in data:
            department.description = data['description']
            
        db.session.commit()

        #cache.clear()

        return {"message": "Department updated successfully"}, 200
    
    @auth_required("token")
    @roles_accepted("admin")    
    def delete(self, id: int):
        department = Department.query.get(id)
        if not department:
            return {"message": "Department not found"}, 404
            
        db.session.delete(department)
        db.session.commit()

        #cache.clear()

        return {"message": "Department deleted successfully"}, 200


class PatientResource(Resource):
    
    @auth_required('token')
    @roles_accepted('admin', 'patient')
    def get(self, patient_id=None):
        if patient_id:
            profile = PatientProfile.query.filter_by(user_id=patient_id).first()
            if not profile:
                return {"message": "Patient not found"}, 404
                
            if current_user.id == patient_id or current_user.has_role("admin"):
                data = {
                    "id": profile.user.id,  
                    "email": profile.user.email,
                    "username": profile.user.username,
                    "name": profile.name,
                    "age": profile.age,
                    "gender": profile.gender,
                    "contact_number": profile.contact_number,   
                    "address": profile.address,
                    "medical_history": profile.medical_history,
                    "blacklisted": profile.blacklisted
                }
                return data, 200
            else:
                return {"message": "Permission denied"}, 403

        if not current_user.has_role('admin'):
            return {"message": "Permission denied"}, 403
            
        all_profiles = PatientProfile.query.join(User).all()
        data = []
        for profile in all_profiles:
            data.append({
                "id": profile.user.id,
                "email": profile.user.email,
                "username": profile.user.username,
                "name": profile.name,
                "age": profile.age, 
                "gender": profile.gender,
                "contact_number": profile.contact_number,
                "address": profile.address,
                "medical_history": profile.medical_history,
                "blacklisted": profile.blacklisted
            }) 
        return data, 200
        
    @auth_required('token')
    @roles_accepted('admin', 'patient')
    def put(self, patient_id: int):
        profile = PatientProfile.query.filter_by(user_id=patient_id).first()
        if not profile:
            return {"message": "Patient not found"}, 404
            
        if current_user.id == patient_id or current_user.has_role("admin"):
            data = request.json
            
            profile.name = data.get('name', profile.name)
            profile.age = data.get('age', profile.age)
            profile.gender = data.get('gender', profile.gender)
            profile.contact_number = data.get('contact_number', profile.contact_number)
            profile.address = data.get('address', profile.address)
            profile.medical_history = data.get('medical_history', profile.medical_history)
            
            db.session.commit()
            #cache.clear()
            return {"message": "Patient profile updated successfully"}, 200
        else:
            return {"message": "Permission denied"}, 403

    @auth_required('token')
    @roles_required('admin')
    def delete(self, patient_id: int):
        profile = PatientProfile.query.filter_by(user_id=patient_id).first()
        if not profile:
            return {"message": "Patient not found"}, 404
        
        appointments = Appointment.query.filter_by(patient_id=patient_id).all()
        for appointment in appointments:
            if appointment.treatment:
                db.session.delete(appointment.treatment)
        
        Appointment.query.filter_by(patient_id=patient_id).delete(synchronize_session='fetch')
        
        user = profile.user
        db.session.delete(user)
        db.session.commit()
        
        return {"message": "Patient deleted successfully"}, 200


class BlacklistResource(Resource):
    
    @auth_required('token')
    @roles_required('admin')
    def post(self, id: int):
        if id is None:
            return {"message": "ID is required"}, 400

        doctor_profile = DoctorProfile.query.filter_by(user_id=id).first()
        if doctor_profile:
            doctor_profile.blacklisted = True
            db.session.commit()

            #cache.clear()
      
            return {"message": "Doctor has been blacklisted"}, 200

        patient_profile = PatientProfile.query.filter_by(user_id=id).first()
        if patient_profile:
            patient_profile.blacklisted = True
            db.session.commit()

            #cache.clear()

            return {"message": "Patient has been blacklisted"}, 200

        return {"message": "User not found as doctor or patient"}, 404
    
    @auth_required('token')
    @roles_required('admin')
    def delete(self, id: int):
        if id is None:
            return {"message": "ID is required"}, 400

        doctor_profile = DoctorProfile.query.filter_by(user_id=id).first()
        if doctor_profile:
            doctor_profile.blacklisted = False
            db.session.commit()

            #cache.clear()
           
            
            return {"message": "Doctor has been removed from blacklist"}, 200

        patient_profile = PatientProfile.query.filter_by(user_id=id).first()
        if patient_profile:
            patient_profile.blacklisted = False
            db.session.commit()

            #cache.clear()

            return {"message": "Patient has been removed from blacklist"}, 200

        return {"message": "User not found as doctor or patient"}, 404


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
    
        return [{
            "id": a.id,
            "date": a.date.strftime("%Y-%m-%d"),
            "day_of_week": a.day_of_week,
            "start_time": a.start_time.strftime("%H:%M"),
            "end_time": a.end_time.strftime("%H:%M"),
            "is_active": a.is_active
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


class DoctorSearchResource(Resource):
    
    @auth_required('token')
    @roles_accepted('admin', 'patient')
    #@cache.cached(timeout=600, query_string=True) # caching data 
    def get(self):
        search_query = request.args.get('query', '').strip()
        search_type = request.args.get('type', 'name')
        
        if not search_query:
            return {"message": "Search query is required"}, 400
        """
        # Generate a cache key based on search type and query
        cache_key = f'doctor_search_{search_type}_{search_query}'
        cached = cache.get(cache_key)
        if cached:
            return cached, 200
        """
        query = DoctorProfile.query.filter_by(blacklisted=False)
        
        if search_type == 'name':
            query = query.filter(DoctorProfile.name.ilike(f'%{search_query}%'))
        elif search_type == 'specialization':
            query = query.filter(DoctorProfile.specialization.ilike(f'%{search_query}%'))
        else:
            return {"message": "Invalid search type. Use 'name' or 'specialization'"}, 400
        
        doctors = query.all()
        
        if not doctors:
            return [], 200
        
        data = [{
            "id": d.user.id,
            "name": d.name,
            "age": d.age,
            "gender": d.gender,
            "specialization": d.specialization,
            "years_of_experience": d.years_of_experience,
            "bio": d.bio,
            "departments": [dept.name for dept in d.departments]
        } for d in doctors]
        #cache.set(cache_key, data, timeout=600)
        return data, 200


class PatientSearchResource(Resource):
    
    @auth_required('token')
    @roles_required('admin')
    def get(self):
        search_query = request.args.get('query', '').strip()
        search_type = request.args.get('type', 'name')
        
        if not search_query:
            return {"message": "Search query is required"}, 400
        
        query = PatientProfile.query.join(User)
        
        if search_type == 'id':
            try:
                patient_id = int(search_query)
                query = query.filter(User.id == patient_id)
            except ValueError:
                return {"message": "Invalid patient ID format"}, 400
        elif search_type == 'name':
            query = query.filter(PatientProfile.name.ilike(f'%{search_query}%'))
        else:
            return {"message": "Invalid search type. Use 'name' or 'id'"}, 400
        
        patients = query.all()
        
        if not patients:
            return [], 200
        
        data = [{
            "id": p.user.id,
            "name": p.name,
            "email": p.user.email,
            "contact_number": p.contact_number,
            "age": p.age,
            "gender": p.gender,
            "blacklisted": p.blacklisted
        } for p in patients]

        return data, 200


# ------------------ API Routes ------------------

api.add_resource(DoctorRegistration, "/api/doctors", "/api/doctor/<int:doctor_id>")
api.add_resource(PatientResource, "/api/patients", "/api/patient/<int:patient_id>")
api.add_resource(BlacklistResource, '/api/user/<int:id>/blacklist')
api.add_resource(DepartmentResource, "/api/departments", "/api/department/<int:id>")
api.add_resource(AppointmentResource, "/api/appointments", "/api/appointment/<int:appointment_id>")
api.add_resource(TreatmentResource, "/api/treatments", "/api/treatment/<int:treatment_id>")
api.add_resource(AvailabilityResource, "/api/availabilities", "/api/availability/<int:doctor_id>", "/api/doctor/availability/<int:availability_id>")
api.add_resource(DoctorSearchResource, "/api/search/doctors")
api.add_resource(PatientSearchResource, "/api/search/patients")



