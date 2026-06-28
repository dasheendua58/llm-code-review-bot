import os
import datetime
import hashlib
import secrets
import jwt
from functools import wraps
from flask import request, jsonify
import models

SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")

def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2 with SHA-256 and a random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(stored_password: str, provided_password: str) -> bool:
    """Verifies a password against its PBKDF2 hashed counterpart."""
    try:
        salt, stored_hash = stored_password.split('$')
        key = hashlib.pbkdf2_hmac(
            'sha256',
            provided_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return key.hex() == stored_hash
    except ValueError:
        return False

def generate_token(user_id: int, username: str) -> str:
    """Generates a JWT token valid for 24 hours."""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def decode_token(token: str):
    """Decodes a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired."}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token."}

def token_required(f):
    """Flask decorator to protect endpoints and inject the current user."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"message": "Token format is 'Bearer <token>'!"}), 401
        
        if not token:
            return jsonify({"message": "Authentication token is missing!"}), 401
        
        payload = decode_token(token)
        if "error" in payload:
            return jsonify({"message": payload["error"]}), 401
        
        current_user = models.get_user_by_id(payload['user_id'])
        if not current_user:
            return jsonify({"message": "User not found!"}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated
