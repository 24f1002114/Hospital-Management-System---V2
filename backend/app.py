from flask import Flask
from application.cache import cache
from application.database import db
from application.resources import api
from application.models import User, Role
from application.config import LocalDevelopmentConfig, ProductionConfig
from flask_security import Security, SQLAlchemyUserDatastore
from werkzeug.security import generate_password_hash
from application.celery_init import celery_init_app
from celery.schedules import crontab
from application.task import daily_reminder, monthly_report
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    CORS(app,
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "Authentication-Token"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    env = os.getenv("ENV", "dev")
    if env == "prod":
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(LocalDevelopmentConfig)

    print("ENV:", env)
    print("DB:", app.config.get("SQLALCHEMY_DATABASE_URI").split("/")[-1])

    db.init_app(app)
    cache.init_app(app)
    api.init_app(app)
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)
    #app.app_context().push()
    return app


app = create_app()
celery = celery_init_app(app)
celery.autodiscover_tasks()

#from application.routes import *

with app.app_context():
    import application.routes
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



@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        #crontab(0,0, day_of_month="1"),  # monthly at midnight on the first day of the month
        crontab(0, 0, day_of_month="1"),
        monthly_report.s()     
    )
    
    #sender.add_periodic_task(
        #crontab(day_of_week="*", hour=9, minute=0),  # 9 AM every day.
     #   crontab(hour=9, minute=0),
      #  daily_reminder.s()    
    #) 

    sender.add_periodic_task(
    crontab(hour=8, minute=0),   # 8 AM reminder
    daily_reminder.s(),
    name='daily_reminder_8am'
    )
    sender.add_periodic_task(
    crontab(hour=9, minute=0),  # 9 AM reminder
    daily_reminder.s(),
    name='daily_reminder_9am'    
   ) 

 

if __name__=="__main__":
    app.run()
