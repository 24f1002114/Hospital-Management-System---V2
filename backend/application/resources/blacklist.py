from unittest import result
from flask import current_app as app, request
from flask_restful import Resource
from flask_security import auth_required, roles_required, roles_accepted, current_user

from application.task import daily_reminder
from application.models import DoctorProfile, Medicine, PatientProfile, User, db, Appointment, Treatment, Department, DoctorAvailability
#from application.cache import cache 

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
