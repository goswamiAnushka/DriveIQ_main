import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.scss';
import Navbar from '../../components/Navbar/Navbar';
import { FaComments } from 'react-icons/fa'; 


const HomePage = () => {
  const [isChatBotVisible, setChatBotVisible] = useState(false);

  const handleLogout = () => {
    // Implement your logout logic here
    console.log("User has logged out.");
    // Redirect to login or homepage after logout
    // window.location.href = '/login'; // Uncomment this for actual redirect
  };

  const toggleChatBot = () => {
    setChatBotVisible(prevState => !prevState);
  };

  return (
    <div className="homepage">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to DriveIQ</h1>
          <p>
            Drive smarter, drive safer. Track your driving performance and get rewarded
            with discounts on your insurance.
          </p>
          <Link to="/register" className="cta-button">Get Started</Link>
        </div>
        <div className="hero-images-grid">
          <img src="https://www.pngmart.com/files/7/GPS-Tracking-System-Background-PNG.png" alt="Track Your Trips" className="large-image" />
          <img src="https://images.autoinsurance.com/app/uploads/2022/01/03210505/Auto-Insurance-Discounts-2.png" alt="Get Insurance Discounts" />
          <img src="https://cdni.iconscout.com/illustration/premium/thumb/insurance-policy-3677842-3087680.png" alt="Monitor Driving Performance" />
        </div>
      </section>

      {/* Why Us Section */}
      <section id="why-us" className="info-section">
        <h2>Why Choose DriveIQ?</h2>
        <p>
          DriveIQ is not just another insurance company. We use advanced telematics to reward safe driving habits.
          Whether you’re a cautious driver or want to improve your driving skills, we provide real-time insights that help you become safer on the road.
          With DriveIQ, you’ll save money while improving your driving performance. Our focus is on fairness, transparency, and rewarding those who drive smartly.
        </p>
      </section>

      {/* How Insurance Works Section */}
      <section id="how-insurance-works" className="info-section">
        <h2>How Insurance Works</h2>
        <p>
          With DriveIQ’s insurance model, you pay for what you use. Our Pay-As-You-Drive (PAYD) insurance ensures that you are only charged for the miles you drive.
          By tracking your driving habits through telematics, we can offer lower premiums for safer driving. It’s insurance designed around you, offering more control, fairness, and significant savings.
        </p>
      </section>

      {/* What is Telematics Section */}
      <section id="what-telematics" className="info-section">
        <h2>What is Telematics?</h2>
        <p>
          Telematics is the technology behind DriveIQ that monitors and collects data on your driving behavior.
          It tracks everything from speed, braking, and cornering to the routes you take and the time of day you drive. 
          This data is used to provide personalized feedback, helping you improve your driving and save money on your insurance premiums.
          Telematics ensures that your premiums reflect your driving, making insurance fairer and more accurate.
        </p>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose DriveIQ?</h2>
        <div className="features-container">
          <div className="feature">
            <i className="fas fa-chart-line"></i>
            <h3>Real-Time Driving Insights</h3>
            <p>Monitor your driving performance and get real-time insights on how you can improve your driving score.</p>
          </div>
          <div className="feature">
            <i className="fas fa-car"></i>
            <h3>Accurate GPS Tracking</h3>
            <p>Track your trips with precise GPS data and get feedback on your routes and driving habits.</p>
          </div>
          <div className="feature">
            <i className="fas fa-shield-alt"></i>
            <h3>Insurance Discounts</h3>
            <p>Good drivers deserve rewards. The better your score, the more you save on your insurance premiums.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2024 DriveIQ. All rights reserved.</p>
          <nav className="footer-nav">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </nav>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
