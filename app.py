from flask import Flask
from application.cache import cache
from application.database import db
from application.resources import api
from application.models import User, Role
from application.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore
from werkzeug.security import generate_password_hash
from application.celery_init import celery_init_app
from celery.schedules import crontab
from application.task import daily_reminder, monthly_report
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)
    cache.init_app(app)
    api.init_app(app)
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)
    app.app_context().push()
    return app

app = create_app()
celery = celery_init_app(app)
celery.autodiscover_tasks()

with app.app_context():
    db.create_all()
    app.security.datastore.find_or_create_role(name = "admin", description = "Superuser of app")
    app.security.datastore.find_or_create_role(name = "doctor", description = "General user of app")
    app.security.datastore.find_or_create_role(name = "patient", description = "General user of app")
    db.session.commit()
    if not app.security.datastore.find_user(email = "admin@example.com"):
        app.security.datastore.create_user(email = "admin@example.com",
                                           username = "admin",
                                           password = generate_password_hash("1234"),
                                           roles = ['admin'])
    db.session.commit()      

from application.routes import *

@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        #crontab(0,0, day_of_month="1"),  # monthly at midnight on the first day of the month
        crontab(minute="*/2"),
        monthly_report.s()     
    )
    
    sender.add_periodic_task(
        #crontab(day_of_week="*", hour=9, minute=0),  # 9 AM every day.
        crontab(minute="*/1"),
        daily_reminder.s()    
    )  

 

if __name__=="__main__":
    app.run()