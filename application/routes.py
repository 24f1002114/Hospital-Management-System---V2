import os
from .database import db
from .models import PatientProfile, User, Role
from flask import current_app as app, jsonify, request, render_template, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from celery.result import AsyncResult
from .task import csv_report
from flask_security import auth_required, roles_required, roles_accepted, current_user,login_user


@app.route("/", methods = ["GET"])
def home():
    return render_template("index.html")

@app.route("/api/login", methods=["POST"])
def user_login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required!"}), 400
    user = app.security.datastore.find_user(email=email)
    if not user:
        return jsonify({"success": False, "message": "User not found!"}), 404
    if not check_password_hash(user.password, password):
        return jsonify({"success": False, "message": "Incorrect password!"}), 400
    login_user(user)
    token = user.get_auth_token() if hasattr(user, "get_auth_token") else None
    return jsonify({
        "success": True,
        "id": user.id,
        "username": user.username,
        "roles": [r.name for r in user.roles],
        "auth_token": token
    }), 200
 

@app.route("/api/register", methods=["POST"])
def register_patient():
    data = request.get_json() or {}
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")
    name = data.get("name")
    age = data.get("age")
    gender = data.get("gender")
    contact_number = data.get("contact_number")
    address = data.get("address")
    medical_history = data.get("medical_history")
    role = "patient"
    if not email or not username or not password:
        return jsonify({ "success": False, "message": "Email, username, and password are required!"}), 400
    if app.security.datastore.find_user(email=email):
        return jsonify({"success": False, "message": "User already exists!"}), 400
    if app.security.datastore.find_user(username=username):
        return jsonify({"success": False, "message": "Username already taken!"}), 400
    role_obj = app.security.datastore.find_role(role)
    if not role_obj:
        return jsonify({ "success": False, "message": "Patient role not found"}), 400
    app.security.datastore.create_user(
        email=email,
        username=username,
        password=generate_password_hash(password),
        roles= [role_obj],
        active=True
    )
    db.session.commit()
    patient_user = app.security.datastore.find_user(email=email)
    profile = PatientProfile(
        user_id=patient_user.id,
        name=name,
        age=age,
        gender=gender,
        contact_number=contact_number,
        address=address,
        medical_history=medical_history
    )
    db.session.add(profile)
    db.session.commit()
    return jsonify({"success": True, "message": "User created successfully"}), 201

@app.route("/api/export", methods=["POST"])
@auth_required("token")
@roles_accepted("patient")
def export_csv():
    task = csv_report.delay(patient_id=current_user.id)
    return jsonify({"id": task.id, "status": task.status}), 202

@app.route("/api/csv_result/<task_id>")
@auth_required("token")
@roles_accepted("patient")
def csv_result(task_id):
    res = AsyncResult(task_id)
    if not res.ready() or res.result is None:
        return jsonify({"task_id": task_id, "status": res.status, "ready": False}), 202

    filename = res.result
    if not isinstance(filename, str):
        return jsonify({"error": "invalid task result"}), 500

    allowed_prefixes = [
        f"treatment_report_patient_{current_user.id}_",
        f"treatment_report_{current_user.id}_"
    ]
    if not any(filename.startswith(p) for p in allowed_prefixes):
        return jsonify({"error": "forbidden", "message": "You may only download your own exports"}), 403

    directory = os.path.join(app.root_path, "static")
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "file not found", "filename": filename}), 404

    return send_from_directory(directory, filename, as_attachment=True)



