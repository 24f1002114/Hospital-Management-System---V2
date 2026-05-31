from unittest import result
from flask import current_app as app, request
from flask_restful import Api, Resource, reqparse
from flask_security import auth_required, roles_required, roles_accepted, current_user

from application.task import daily_reminder
from application.models import DoctorProfile, Medicine, PatientProfile, User, db, Appointment, Treatment, Department, DoctorAvailability

#from application.cache import cache 

department_parser = reqparse.RequestParser()
department_parser.add_argument('name', type=str, required=True, help='Department name is unique')
department_parser.add_argument('description', type=str, required=True, help='Description is required')

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
