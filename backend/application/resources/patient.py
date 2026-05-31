from unittest import result
from flask import current_app as app, request
from flask_restful import Resource
from flask_security import auth_required, roles_required, roles_accepted, current_user

from application.task import daily_reminder
from application.models import PatientProfile, User, db, Appointment, Treatment, Department, DoctorAvailability
#from application.cache import cache 

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


