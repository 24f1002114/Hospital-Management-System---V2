import os
from dotenv import load_dotenv

load_dotenv()
class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = True

class LocalDevelopmentConfig(Config):
    #configuration
    SQLALCHEMY_DATABASE_URI = "sqlite:///lmsv2.sqlite3"
    DEBUG = True

    #config for security
    SECRET_KEY = "this-is-a-secretkey" 
    SECURITY_PASSWORD_HASH = "bcrypt" 
    SECURITY_PASSWORD_SALT = "this-is-password-salt" 
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"

    # Flask-Caching configuration (add these)
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_HOST = 'localhost'
    CACHE_REDIS_PORT = 6379
    CACHE_REDIS_DB = 2 
    CACHE_DEFAULT_TIMEOUT = 300
    CACHE_KEY_PREFIX = 'hms_cache_'    

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    SECURITY_PASSWORD_HASH = "bcrypt"
    SECURITY_PASSWORD_SALT = "this-is-password-salt"
    WTF_CSRF_ENABLED = True
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_HOST = 'localhost'
    CACHE_REDIS_PORT = 6379
    CACHE_REDIS_DB = 2
    CACHE_DEFAULT_TIMEOUT = 300
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {"options": "-ctimezone=Asia/Kolkata"}
    }
