import React, { useState, useEffect } from 'react';
import './Navbar.scss';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from './logo.png';  // Import the logo

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [driverName, setDriverName] = useState(null);

  useEffect(() => {
    const storedDriverName = localStorage.getItem('driver_name');
    console.log("Stored Driver Name:", storedDriverName);  // Log the stored name
    if (storedDriverName) {
        setDriverName(storedDriverName);
    }
}, []);


  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleProfileClick = () => {
    if (driverName) {
      window.location.href = '/driver';  // Redirect to DriverPage
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="/" className="navbar-brand">
          <img src={logo} alt="DriveIQ" />  {/* Use the imported logo */}
        </a>
      </div>

      {/* Menu Icon for Small Screens */}
      <div className="menu-icon" onClick={toggleMenu}>
        {menuOpen ? <FaTimes /> : <FaBars />}  {/* Change icon based on menu state */}
      </div>

      <div className={`navbar-right ${menuOpen ? 'open' : ''}`}>
        <ul>
          <li><a href="#why-us">Why Us?</a></li>
          <li><a href="#how-insurance-works">How Insurance Works</a></li>
          <li><a href="#what-telematics">What is Telematics?</a></li>

          {driverName ? (
            // Display driver's name and redirect to DriverPage on click
            <li>
              <button className="profile-button" onClick={handleProfileClick}>
                {driverName}
              </button>
            </li>
          ) : (
            // Dropdown for login if no driver is logged in
            <li className="dropdown">
              <button onClick={toggleDropdown} className="dropdown-btn">
                Login
              </button>
              {dropdownOpen && (
                <div className="dropdown-content">
                  <a href="/login">User Login</a>
                  <a href="/admin">Admin Login</a>
                </div>
              )}
            </li>
          )}

          <li><a href="/register">Register</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
