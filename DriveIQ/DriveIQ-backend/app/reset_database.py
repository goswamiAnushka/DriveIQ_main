import sys
import os
# Adjust the Python path to include the parent directory (where 'app' module is)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the Flask app instance and database models
from app.server import app  # Import after adjusting sys.path
from app.db import db, Driver, Trip, AggregatedData

def clear_database():
    with app.app_context():  # Use the Flask app instance for context
        # Clear the Trip, Driver, and AggregatedData tables
        db.session.query(Trip).delete()
        db.session.query(Driver).delete()
        db.session.query(AggregatedData).delete()
        db.session.commit()
        print("All records have been cleared.")

if __name__ == '__main__':
    clear_database()
