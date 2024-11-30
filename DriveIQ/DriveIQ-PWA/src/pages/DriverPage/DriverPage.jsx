import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatBot from '../../components/ChatBot/ChatBot';
import { FaComments, FaArrowRight, FaSignOutAlt } from 'react-icons/fa'; // Importing icons
import Slider from 'react-slick'; // Importing the slider component
import Typical from 'react-typical'; // Importing Typical for typing effect
import './DriverPage.scss';
import drivingImage1 from '../../assets/driving.jpg';
import drivingImage2 from '../../assets/driving2.jpg';
import drivingImage3 from '../../assets/driving3.jpg';

const DriverPage: React.FC = () => {
  const navigate = useNavigate();
  const [showChatBot, setShowChatBot] = useState(false);
  const [slogans, setSlogans] = useState([
    "Pay as you drive, save as you go!",
    "Telematics tracking, tailored for your needs!",
    "Drive smart, save big with DriveIQ!",
    "Insurance made easy with every mile you drive!",
  ]);
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);

  // Fetch the driver's info from local storage
  const driverName = localStorage.getItem('driver_name') || "Driver";
  const driverId = localStorage.getItem('driver_id') || "Unknown";
  const token = localStorage.getItem('token');

  const userInfo = {
    name: driverName,
    id: driverId,
    token,
  };

  // Check for authentication
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);

  // Slogan rotation effect
  useEffect(() => {
    const sloganInterval = setInterval(() => {
      setCurrentSloganIndex((prevIndex) => (prevIndex + 1) % slogans.length);
    }, 4000);

    return () => clearInterval(sloganInterval);
  }, [slogans.length]);

  const toggleChatBot = () => {
    setShowChatBot((prev) => !prev);
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('driver_id');
    localStorage.removeItem('driver_name');
    navigate('/login');
  };

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className="driver-page">
      {/* Logout Button Positioned Here */}
      <button className="logout-button" onClick={handleLogout}>
        <FaSignOutAlt /> Logout
      </button>

      <div className="welcome-section">
        <h2>
          <Typical
            steps={[
              `Welcome to DriveIQ, ${driverName}!`,
              2000, // Pause for 2 seconds
              `Your Driver ID: ${driverId}`,
              3000, // Pause for 3 seconds
            ]}
            loop={Infinity}
            wrapper="span"
          />
        </h2>
        <p className="slogan-popup">{slogans[currentSloganIndex]}</p>
      </div>

      <Slider {...sliderSettings} className="image-slider">
        <div className="slider-item">
          <img src={drivingImage1} alt="Driving Experience 1" className="slider-image" />
        </div>
        <div className="slider-item">
          <img src={drivingImage2} alt="Driving Experience 2" className="slider-image" />
        </div>
        <div className="slider-item">
          <img src={drivingImage3} alt="Driving Experience 3" className="slider-image" />
        </div>
      </Slider>

      <div className="arrow-section" onClick={handleNavigateToDashboard}>
        <p className="navigate-message">Ready to start your journey?</p>
        <FaArrowRight className="arrow-icon" />
      </div>

      <div className="chatbot-icon" onClick={toggleChatBot}>
        <FaComments size={40} color="#6200ea" />
      </div>

      {showChatBot && <ChatBot userInfo={userInfo} onLogout={handleLogout} />}
    </div>
  );
};

export default DriverPage;
