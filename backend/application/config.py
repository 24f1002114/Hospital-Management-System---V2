import os

class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WTF_CSRF_ENABLED = False
    WTF_CSRF_CHECK_DEFAULT = False
    SECURITY_PASSWORD_HASH = "bcrypt"
    SECURITY_PASSWORD_SALT = os.getenv("SECURITY_PASSWORD_SALT", "this-is-password-salt")
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    SECURITY_TOKEN_MAX_AGE = int(os.getenv("SECURITY_TOKEN_MAX_AGE", 86400))
    SECURITY_CSRF_PROTECT_MECHANISMS = []

    # Mail
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")

    # Celery
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND")


class LocalDevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv("SQLALCHEMY_DATABASE_URI")
    SECRET_KEY = os.getenv("SECRET_KEY")

    # Cache
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    CACHE_REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    CACHE_REDIS_DB = int(os.getenv("REDIS_DB", 2))
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_KEY_PREFIX = 'hms_cache_'


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv("SQLALCHEMY_DATABASE_URI")
    SECRET_KEY = os.getenv("SECRET_KEY")

    # Cache
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_HOST = os.getenv("REDIS_HOST", "hms-redis")
    CACHE_REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    CACHE_REDIS_DB = int(os.getenv("REDIS_DB", 2))
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_KEY_PREFIX = 'hms_cache_'

    # DB connection pool
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_reset_on_return": "rollback",
        "connect_args": {
            "connect_timeout": 10,
            "options": "-ctimezone=Asia/Kolkata"
        }
    }