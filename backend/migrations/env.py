import os
from logging.config import fileConfig
from alembic import context

# Only load dotenv in dev — in prod Docker injects env vars via env_file
env = os.getenv("ENV", "dev")
if env != "prod":
    from dotenv import load_dotenv
    load_dotenv(".env.dev", override=True)

from app import create_app
from application.database import db
from application.models import *  # ensures all models are registered

config = context.config
app = create_app()

with app.app_context():
    db_url = app.config["SQLALCHEMY_DATABASE_URI"]

config.set_main_option("sqlalchemy.url", db_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = db.metadata

def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and reflected and compare_to is None:
        return False  # skip tables not in metadata (already removed)
    return True

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    with app.app_context():
        connectable = db.engine
        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                compare_type=True,
                compare_server_default=True,
                include_object=include_object,
                render_as_batch=True,
            )
            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()