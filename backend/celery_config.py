import os

broker_url = os.getenv('REDIS_URL', 'redis://hms-redis:6379/0')
result_backend = os.getenv('REDIS_RESULT_BACKEND', 'redis://hms-redis:6379/1')
timezone = 'Asia/Kolkata'
cache_type = 'RedisCache'
broker_connection_retry_on_startup = True

