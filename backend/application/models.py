from .database import db
from flask_security import UserMixin, RoleMixin
from datetime import datetime


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False, index=True)
    username = db.Column(db.String, unique=True, nullable=False, index=True)
    password = db.Column(db.String, nullable=False)
    fs_uniquifier = db.Column(db.String, unique=True, nullable=False)
    active = db.Column(db.Boolean, nullable=False, default=True)

    roles = db.relationship('Role', backref='bearer', secondary='users_roles')
    doctor_profile = db.relationship('DoctorProfile', backref='user', uselist=False, cascade="all, delete-orphan")
    patient_profile = db.relationship('PatientProfile', backref='user', uselist=False, cascade="all, delete-orphan")


class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.String)


users_roles = db.Table(
    'users_roles',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id', ondelete='CASCADE')),
    db.Column('role_id', db.Integer, db.ForeignKey('role.id', ondelete='CASCADE'))
)


class PatientProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    name = db.Column(db.String, nullable=False, index=True)
    age = db.Column(db.Integer)
    gender = db.Column(db.String)
    contact_number = db.Column(db.String)
    address = db.Column(db.String)
    medical_history = db.Column(db.Text)
    blacklisted = db.Column(db.Boolean, default=False, index=True)


class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    slot_id = db.Column(db.Integer, db.ForeignKey('doctor_availability.id', ondelete='SET NULL'))
    status = db.Column(db.String, nullable=False, default='Booked', index=True)
    department = db.Column(db.String, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    patient_user = db.relationship('User', foreign_keys=[patient_id], backref='patient_appointments')
    doctor_user = db.relationship('User', foreign_keys=[doctor_id], backref='doctor_appointments')
    treatment = db.relationship('Treatment', backref='appointment', uselist=False, cascade="all, delete-orphan")
    doctor_availability = db.relationship('DoctorAvailability', backref='appointments', uselist=False)

    @property
    def patient_profile(self):
        return self.patient_user.patient_profile if self.patient_user else None

    @property
    def doctor_profile(self):
        return self.doctor_user.doctor_profile if self.doctor_user else None


class Treatment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointment.id', ondelete='CASCADE'))
    visit_type = db.Column(db.String, default='In-person')
    tests_done = db.Column(db.String)
    diagnosis = db.Column(db.String, nullable=False)
    prescription = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text)
    next_visit_date = db.Column(db.Date)
    medicines = db.relationship('Medicine', backref='treatment', cascade="all, delete-orphan")


class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    doctors = db.relationship('DoctorProfile', secondary='department_doctors', backref='departments')


department_doctors = db.Table(
    'department_doctors',
    db.Column('id', db.Integer, primary_key=True),
    db.Column('department_id', db.Integer, db.ForeignKey('department.id', ondelete='CASCADE')),
    db.Column('doctor_id', db.Integer, db.ForeignKey('doctor_profile.id', ondelete='CASCADE'))
)


class DoctorProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    name = db.Column(db.String, nullable=False, index=True)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))
    degree = db.Column(db.String, nullable=False, index=True)
    specialization = db.Column(db.String, nullable=False, index=True)
    years_of_experience = db.Column(db.Integer, nullable=False)
    bio = db.Column(db.Text)
    blacklisted = db.Column(db.Boolean, default=False, index=True)


class DoctorAvailability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'))
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor_profile.id', ondelete='CASCADE'))
    date = db.Column(db.Date, nullable=False, index=True)
    day_of_week = db.Column(db.String, nullable=False, index=True)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    is_active = db.Column(db.Boolean, default=True, index=True)
    doctor = db.relationship('DoctorProfile', backref='availabilities')

    __table_args__ = (
        db.UniqueConstraint('doctor_id', 'day_of_week', 'start_time', 'end_time', name='unique_doctor_availability'),
    )


class Medicine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    treatment_id = db.Column(db.Integer, db.ForeignKey('treatment.id', ondelete='CASCADE'))
    name = db.Column(db.String, nullable=False)
    dosage = db.Column(db.String, nullable=False)
    duration_days = db.Column(db.Integer, nullable=False)

