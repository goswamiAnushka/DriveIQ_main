import React, { useState } from 'react';
import './ChatBot.scss';
import axios from 'axios';

const supportResponses = {
  "login issues": "Please check your username and password. If you forgot your password, you can reset it.",
  "gps not tracking": "Please ensure that GPS is enabled on your device and permissions are granted.",
  "insurance discount": "You can receive discounts by maintaining a good driving score. Please refer to our discount policy.",
  "hi": "Hello! How can I assist you today? Here are some options:",
  "bye": "Goodbye! If you need help, just ask!",
  "how are you": "I'm just a bot, but thanks for asking! How can I help you today?",
  "discontinue premium payd": "Discontinuing your PAYD insurance will mean you won't be able to benefit from discounts based on your driving habits. Do you want to proceed with logging out?",
  "unregister": "Please provide your email and password to unregister.",
  "other": "For any other issues, you can contact admin by clicking the button below."
};

const quickOptions = [
  "Login Issues",
  "GPS Not Tracking",
  "Insurance Discount",
  "Discontinue Premium PAYD",
  "Unregister",
  "Hi",
  "Bye"
];

const ChatBot = ({ onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [isLogoutRequested, setIsLogoutRequested] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [isAdditionalHelpVisible, setIsAdditionalHelpVisible] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  const handleOptionClick = (option) => {
    if (option.toLowerCase() === "discontinue premium payd") {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: supportResponses[option.toLowerCase()], sender: 'bot' }
      ]);
      setIsLogoutRequested(true);
    } else if (option.toLowerCase() === "unregister") {
      handleUnregisterRequest();
    } else {
      const response = supportResponses[option.toLowerCase()] || "I'm here to help! Please describe your issue.";
      setMessages((prevMessages) => [...prevMessages, { text: response, sender: 'bot' }]);
      askForAdditionalHelp();
    }
  };

  const askForAdditionalHelp = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: "Is there anything else I can help you with?", sender: 'bot' }
    ]);
    setIsAdditionalHelpVisible(true);
  };

  const handleUnregisterRequest = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: "You've requested to unregister. Please provide your email and password.", sender: 'bot' }
    ]);
    setIsUnregistering(true);
  };

  const handleUnregister = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/unregister', { email, password });
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Thank you for choosing us! If you wish to continue with discounts or need assistance, contact drive0@gmail.com.", sender: 'bot' }
      ]);
      if (response.status === 200) {
        onLogout();
      }
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: error.response ? error.response.data.message : "An error occurred.", sender: 'bot' }
      ]);
    } finally {
      setLoading(false);
      setEmail('');
      setPassword('');
      setIsUnregistering(false);
      setIsFeedbackVisible(true);
    }
  };

  const handleFeedback = (response) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: `Thank you for your feedback! You rated us: ${response}`, sender: 'bot' }
    ]);
    setIsFeedbackVisible(false);
  };

  const handleConfirmation = (confirm) => {
    if (confirm) {
      onLogout();
    }
    setIsLogoutRequested(false);
  };

  const handleAdditionalHelp = (response) => {
    if (response) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "How can I assist you further?", sender: 'bot' }
      ]);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Here are the options:", sender: 'bot' },
        ...quickOptions.map(option => ({ text: option, sender: 'bot', isOption: true }))
      ]);
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "Thank you! If you need anything else, just ask.", sender: 'bot' }
      ]);
      setIsFeedbackVisible(true);
    }
    setIsAdditionalHelpVisible(false);
  };

  const handleCloseChat = () => {
    setIsChatVisible(false);
  };

  const handleContactAdmin = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: "If you have a different issue, please contact admin by clicking the button below.", sender: 'bot' }
    ]);
  };

  return (
    isChatVisible && (
      <div className="chatbot">
        <div className="chatbot-header">
          <h3>Chat with Us</h3>
          <button className="close-button" onClick={handleCloseChat}>X</button>
        </div>
        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.text}
            </div>
          ))}
        </div>
        {isLogoutRequested && (
          <div className="logout-confirmation">
            <p>Confirm by clicking the button below to log out.</p>
            <button onClick={() => handleConfirmation(true)}>Confirm Logout</button>
            <button onClick={() => handleConfirmation(false)}>Cancel</button>
          </div>
        )}
        {isUnregistering && (
          <div className="unregister-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button onClick={handleUnregister} disabled={loading}>
              {loading ? 'Unregistering...' : 'Confirm Unregister'}
            </button>
          </div>
        )}
        {isFeedbackVisible && (
          <div className="feedback-options">
            <p>Please rate how helpful the chatbot was:</p>
            <div className="feedback-buttons">
              <button onClick={() => handleFeedback('😊')}>Happy</button>
              <button onClick={() => handleFeedback('😐')}>Neutral</button>
              <button onClick={() => handleFeedback('😞')}>Sad</button>
            </div>
          </div>
        )}
        {isAdditionalHelpVisible && (
          <div className="additional-help">
            <button onClick={() => handleAdditionalHelp(true)}>Yes</button>
            <button onClick={() => handleAdditionalHelp(false)}>No</button>
          </div>
        )}
        <div className="quick-options">
          {quickOptions.map((option, index) => (
            <button key={index} onClick={() => handleOptionClick(option)}>
              {option}
            </button>
          ))}
        </div>
        <div className="additional-help">
          <a href="mailto:driveiq0@gmail.com">
            <button>Contact Admin</button>
          </a>
        </div>
      </div>
    )
  );
};

export default ChatBot;
