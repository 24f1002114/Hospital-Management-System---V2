from flask import current_app as app, request
from flask_restful import Resource, reqparse
from flask_security import auth_required, roles_required, roles_accepted

from application.models import DoctorProfile, Department, Appointment, Treatment, DoctorAvailability, User, db
from werkzeug.security import generate_password_hash

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
