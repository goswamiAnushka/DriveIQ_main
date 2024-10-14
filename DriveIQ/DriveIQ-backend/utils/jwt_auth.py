import jwt
import os
from flask import request, jsonify
from functools import wraps
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Secret key for JWT encoding/decoding from the .env file
SECRET_KEY = os.getenv('JWT_SECRET_KEY')  # Load secret key from the environment variable

# Function to create a token
def create_token(user_id):
    expiration = datetime.utcnow() + timedelta(hours=24)
    token = jwt.encode({
        'user_id': user_id,
        'exp': expiration
    }, SECRET_KEY, algorithm='HS256')
    return token

# Function to decode a token
def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token

# jwt_required decorator to protect routes
def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        # Check if token is in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers.get('Authorization')
            token = auth_header.split(" ")[1] if auth_header.startswith('Bearer ') else None

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        # Decode token
        try:
            payload = decode_token(token)
            if payload is None:
                return jsonify({"error": "Token is invalid or expired"}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 401

        # If token is valid, attach the user ID to the request and proceed
        request.user_id = payload['user_id']
        return f(*args, **kwargs)

    return decorated_function

# Function to retrieve the user ID from the JWT payload
def get_jwt_identity():
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers.get('Authorization')
        token = auth_header.split(" ")[1] if auth_header.startswith('Bearer ') else None

    if token:
        payload = decode_token(token)
        if payload:
            return payload.get('user_id')

    return None
