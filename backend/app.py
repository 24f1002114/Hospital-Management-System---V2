import os
from dotenv import load_dotenv

env = os.getenv("ENV", "dev")

if env == "prod":
    load_dotenv("application/.env", override=True)
else:
    load_dotenv(".env.dev", override=True)

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


# now ENV is correctly set from whichever .env loaded it
env = os.getenv("ENV", "dev")

def create_app():
    app = Flask(__name__)

    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    CORS(app,
         origins=ALLOWED_ORIGINS,
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "Authentication-Token"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    if env == "prod":
        app.config.from_object(ProductionConfig)
    else:
        app.config.from_object(LocalDevelopmentConfig)

    print("ENV:", env)
    print("DB:", app.config.get("SQLALCHEMY_DATABASE_URI").split("/")[-1])

    db.init_app(app)
    cache.init_app(app)
    api.init_app(app)
    with app.app_context():
        from application import routes
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()

    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)
    return app

app = create_app()
celery = celery_init_app(app)
celery.autodiscover_tasks()

def seed_roles_and_admin():
    with app.app_context():
        app.security.datastore.find_or_create_role(
            name="admin",
            description="Superuser of app"
        )
        app.security.datastore.find_or_create_role(
            name="doctor",
            description="General user of app"
        )
        app.security.datastore.find_or_create_role(
            name="patient",
            description="General user of app"
        )

        db.session.commit()

        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if admin_email and admin_password:
            if not app.security.datastore.find_user(email=admin_email):
                app.security.datastore.create_user(
                    email=admin_email,
                    username="admin",
                    password=generate_password_hash(admin_password),
                    roles=["admin"],
                )

            db.session.commit()

@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(0, 0, day_of_month="1"),
        monthly_report.s()
    )
    sender.add_periodic_task(
        crontab(hour=8, minute=0),
        daily_reminder.s(),
        name='daily_reminder_8am'
    )
    sender.add_periodic_task(
        crontab(hour=9, minute=0),
        daily_reminder.s(),
        name='daily_reminder_9am'
    )


if __name__ == "__main__":
    seed_roles_and_admin()
    app.run()