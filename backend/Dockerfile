FROM python:3.10-slim
WORKDIR /app
# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy app code
COPY . .
EXPOSE 8000
CMD ["gunicorn", \
     "--workers", "3", \
     "--worker-class", "sync", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info", \
     "app:app"]
