// src/pages/DriverPage/DriverPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatBot from '../../components/ChatBot/ChatBot';
import { FaComments, FaArrowRight, FaSignOutAlt } from 'react-icons/fa'; // Importing icons
import Slider from 'react-slick'; // Importing the slider component
import './DriverPage.scss';
import drivingImage1 from '../../assets/driving.jpg'; // Ensure to have these images in your assets folder
import drivingImage2 from '../../assets/driving2.jpg';
import drivingImage3 from '../../assets/driving3.jpg';

const DriverPage: React.FC = () => {
  const navigate = useNavigate();
  const [showChatBot, setShowChatBot] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [slogans, setSlogans] = useState([
    "Pay as you drive, save as you go!",
    "Telematics tracking, tailored for your needs!",
    "Drive smart, save big with DriveIQ!",
    "Insurance made easy with every mile you drive!",
  ]);
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);

  // Fetch the driver's name from local storage
  const driverName = localStorage.getItem('driver_name') ; // This should be the driver's name

  // Check for authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login'); // Redirect to login if not authenticated
    }
  }, [navigate]);

  // Typewriter effect for the welcome message
  useEffect(() => {
    if (driverName) {
      const welcomeMessage = `Welcome to DriveIQ,  ${driverName}!   `; // Constructing the welcome message with driverName
      let index = 0;
      const typeWriterInterval = setInterval(() => {
        if (index < welcomeMessage.length) {
          setDisplayText(prev => prev + welcomeMessage[index]);
          index++;
        } else {
          clearInterval(typeWriterInterval);
        }
      }, 100); // Adjust typing speed here

      return () => clearInterval(typeWriterInterval);
    }
  }, [driverName]);

  // Slogan rotation effect
  useEffect(() => {
    const sloganInterval = setInterval(() => {
      setCurrentSloganIndex((prevIndex) => (prevIndex + 1) % slogans.length);
    }, 4000); // Change slogan every 4 seconds

    return () => clearInterval(sloganInterval);
  }, [slogans.length]);

  const toggleChatBot = () => {
    setShowChatBot((prev) => !prev); // Toggle chatbot visibility
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard'); // Navigate to the Dashboard
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('driver_id');
    localStorage.removeItem('driver_name');
    navigate('/login'); // Navigate back to login page after logout
  };

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true, // Enable auto play
    autoplaySpeed: 3000, // Speed of auto play
  };

  return (
    <div className="driver-page">
      {/* Logout Button Positioned Here */}
      <button className="logout-button" onClick={handleLogout}>
        <FaSignOutAlt /> Logout
      </button>

      <div className="welcome-section">
        <h2>{displayText}</h2>
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

      {showChatBot && <ChatBot />} {/* Show chatbot if toggled */}
    </div>
  );
};

export default DriverPage;
