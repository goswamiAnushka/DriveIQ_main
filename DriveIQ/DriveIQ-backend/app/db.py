from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

# Admin Table with hashed password functionality
class Admin(db.Model):
    __tablename__ = 'admin'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Driver Table
class Driver(db.Model):
    __tablename__ = 'driver'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    identity_proof = db.Column(db.String(255), nullable=True)
    accepted_terms = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Trip Table
class Trip(db.Model):
    __tablename__ = 'trip'
    id = db.Column(db.Integer, primary_key=True)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    trip_id = db.Column(db.String(50), unique=True, nullable=False)
    gps_data = db.Column(db.Text, nullable=True)
    avg_speed = db.Column(db.Float, nullable=True)
    avg_acceleration = db.Column(db.Float, nullable=True)
    avg_jerk = db.Column(db.Float, nullable=True)
    avg_heading_change = db.Column(db.Float, nullable=True)
    avg_braking_intensity = db.Column(db.Float, nullable=True)
    avg_sasv = db.Column(db.Float, nullable=True)
    total_distance = db.Column(db.Float, nullable=True)
    score = db.Column(db.Float, nullable=True)
    category = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    driver = db.relationship('Driver', backref=db.backref('trips', lazy=True))
class AggregatedData(db.Model):
    __tablename__ = 'aggregated_data'
    id = db.Column(db.Integer, primary_key=True)
    driver_id = db.Column(db.Integer, db.ForeignKey('driver.id'), nullable=False)
    period = db.Column(db.String(50), nullable=False)  
    date = db.Column(db.Date, nullable=False) 
    avg_speed = db.Column(db.Float, nullable=True)
    avg_acceleration = db.Column(db.Float, nullable=True)
    avg_jerk = db.Column(db.Float, nullable=True)
    avg_heading_change = db.Column(db.Float, nullable=True)
    avg_braking_intensity = db.Column(db.Float, nullable=True)
    avg_sasv = db.Column(db.Float, nullable=True)
    speed_violation_count = db.Column(db.Integer, nullable=True)
    total_observations = db.Column(db.Integer, nullable=True)
    driving_score = db.Column(db.Float, nullable=True)  # Add this column
    driving_category = db.Column(db.String(50), nullable=True)  # Add this column
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    
    driver = db.relationship('Driver', backref=db.backref('aggregated_data', lazy=True))
# Function to unregister a driver
def unregister_driver(email, password):
    driver = Driver.query.filter_by(email=email).first()
    if driver and driver.check_password(password):
        db.session.delete(driver)
        db.session.commit()
        return True, "Successfully unregistered."
    return False, "Invalid email or password."

# Function to create an admin user with fixed credentials
def create_admin(username='admin', password='admin123'):
    # Check if the admin already exists
    if not Admin.query.first():
        admin = Admin(username=username)
        admin.set_password(password)  # Hash the password
        db.session.add(admin)
        db.session.commit()
        print("Admin user created.")
    else:
        print("Admin user already exists.")