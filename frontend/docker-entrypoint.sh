#!/bin/sh

if [ "$ENV" = "prod" ]; then
    echo "Starting in PRODUCTION mode (HTTPS)"
    envsubst '${DOMAIN}' < /etc/nginx/nginx.prod.conf \
        > /etc/nginx/conf.d/default.conf
else
    echo "Starting in DEVELOPMENT mode (HTTP)"
    cp /etc/nginx/nginx.dev.conf /etc/nginx/conf.d/default.conf
fi

exec "$@"