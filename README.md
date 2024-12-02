# DriveIQ

DriveIQ is an advanced telematics platform that transforms driving data into actionable insights for insurance companies and drivers, extending beyond mileage-based risk assessments. The platform comprises three key components: `DriveIQ-backend`, `ml_model`, and `DriveIQ-PWA`.

## Project Structure

DriveIQ/ ├── DriveIQ-backend/ # Flask REST API for data processing and integration │ └── app/ # Application folder with server code ├── ml_model/ # Machine learning models for scoring and risk categorization └── DriveIQ-PWA/ # Progressive Web Application for user and admin interfaces



## Features

- **Dual Interfaces**: Separate dashboards for drivers and insurance admins.
- **Real-Time GPS Data Analysis**: Metrics include speed, acceleration, jerk, and heading changes.
- **Sensitive Area Detection**: Uses Google Geolocation API and OpenStreetMap API to detect violations within 300 meters of schools and hospitals.
- **Three Machine Learning Models**:
  1. Real-time scoring model for individual trips.
  2. Multi-day consolidated data model for admins.
  3. Bulk data analysis model for JSON/CSV uploads.
- **Secure Access**: JWT-based authentication.
- **Real-Time Updates**: Socket.io for real-time event handling and a PWA for offline capabilities.

## Technology Stack

- **Frontend**: React (Progressive Web App)
- **Backend**: Flask REST API
- **Database**: SQLite
- **Authentication**: JWT
- **Machine Learning**: Random Forest, SHAP (Explainable AI), k-fold cross-validation
- **APIs**:
  - Google Geolocation API
  - OpenStreetMap API

## Installation

### Backend Setup (DriveIQ-backend)
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/DriveIQ.git
   cd DriveIQ/DriveIQ-backend/app
Create a virtual environment and install dependencies:


python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
Run the backend server:


python server.py
Machine Learning Model Setup (ml_model)
Navigate to the ml_model directory:

cd ../../ml_model
Ensure required dependencies are installed:


pip install -r requirements.txt
Frontend Setup (DriveIQ-PWA)
Navigate to the DriveIQ-PWA directory:


cd ../DriveIQ-PWA
Install dependencies and run the application:


npm install
npm start
Usage
Backend Integration with Machine Learning Models
The backend processes GPS data and interacts with the machine learning models to evaluate driving behavior in real-time, daily, and multi-day contexts.
Admins can upload JSON/CSV files for bulk trip analysis.
API Endpoints
POST /api/gps-data: Submit real-time GPS data for analysis.
GET /api/driver-score: Retrieve daily driving scores and categories.
POST /api/upload-json: Bulk upload for trip data analysis.
Future Enhancements
PWA Optimization: Faster response times and offline support.
Real-Time Notifications: Using Socket.io for event-driven updates.
Contributing
Contributions are welcome! Feel free to open issues or submit pull requests for enhancements.

License
This project is licensed under the MIT License.



Feel free to replace the GitHub link with your actual repository link! Let me know if you need m