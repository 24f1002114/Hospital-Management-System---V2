from flask_restful import Api

api = Api()

from .doctor import DoctorRegistration, DoctorSearchResource
from .patient import PatientResource, PatientSearchResource
from .department import DepartmentResource
from .appointment import AppointmentResource
from .treatment import TreatmentResource
from .availability import AvailabilityResource
from .blacklist import BlacklistResource

api.add_resource(DoctorRegistration,   "/api/doctors", "/api/doctor/<int:doctor_id>")
api.add_resource(PatientResource,      "/api/patients", "/api/patient/<int:patient_id>")
api.add_resource(BlacklistResource,    "/api/user/<int:id>/blacklist")
api.add_resource(DepartmentResource,   "/api/departments", "/api/department/<int:id>")
api.add_resource(AppointmentResource,  "/api/appointments", "/api/appointment/<int:appointment_id>")
api.add_resource(TreatmentResource,    "/api/treatments", "/api/treatment/<int:treatment_id>")
api.add_resource(AvailabilityResource, "/api/availabilities", "/api/availabilities/<int:doctor_id>", "/api/doctor/availability/<int:availability_id>")
api.add_resource(DoctorSearchResource, "/api/search/doctors")
api.add_resource(PatientSearchResource,"/api/search/patients")