import sys
import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv  # Load environment variables from .env file
from flask_jwt_extended import JWTManager  # JWT support

# Add the parent directory to the system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the db instance from app.db
from app.db import db, Admin  
# Import API routes
from api.routes import api_bp  
# Import Admin routes
from api.routes_admin import admin_bp  

# Load environment variables from .env
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# Set the secret key for session management
app.secret_key = os.getenv('SECRET_KEY', 'your_default_secret_key')

# Enable CORS to allow requests from your frontend (React)
CORS(app, resources={r"/*": {"origins": os.getenv('CORS_ALLOWED_ORIGINS').split(',')}})

# Configure the SQLite database with the correct path
basedir = os.path.abspath(os.path.dirname(__file__))  # This points to the app/ directory
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, '..', 'instance', 'driveiq.db')  
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configure JWT secret key
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your_fallback_secret') 

# Initialize SQLAlchemy and Migrate
db.init_app(app)
migrate = Migrate(app, db)

# Initialize JWT
jwt = JWTManager(app)

# Initialize SocketIO for real-time data streaming
socketio = SocketIO(app, cors_allowed_origins=os.getenv('SOCKETIO_CORS_ALLOWED_ORIGINS', '*'))

# Register the API blueprint (driver routes)
app.register_blueprint(api_bp, url_prefix='/api')

# Register the Admin blueprint
app.register_blueprint(admin_bp, url_prefix='/admin')

# Health check route to verify if the server is running
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "Running"}), 200

# Function to create an admin user with fixed credentials
def create_admin(username='admin', password='admin123'):
    with app.app_context():  # Ensure you're within the Flask application context
        if not Admin.query.first():
            admin = Admin(username=username)
            admin.set_password(password)  # Hash the password
            db.session.add(admin)
            db.session.commit()
            print("Admin user created.")
        else:
            print("Admin user already exists.")

# WebSocket event handling
@socketio.on('connect')
def handle_connect():
    print("Client connected!")
    emit('server_response', {'data': 'Connected to WebSocket!'})

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected!")

# GPS WebSocket stream
@socketio.on('gps_update')
def gps_update(data):
    print(f"Received GPS data: {data}")
    emit('gps_response', {'data': 'GPS data received'}, broadcast=True)

if __name__ == "__main__":
    # Create admin user on server startup
    create_admin()  # Call the function to create the admin user
    # Run the app with SocketIO
    socketio.run(app, debug=True)
