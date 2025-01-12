import React, { useEffect } from 'react';
import './Message.css';

const Message = ({ type = 'info', message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose(); // Automatically close the message after 5 seconds
      }, 5000);
      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [message, onClose]);

  if (!message) return null; // Don't render if there's no message

  return (
    <div className={`message-container ${type}`}>
      <span>{message}</span>
      <button
        className="close-button"
        onClick={onClose}
        aria-label="Close message"
      >
        {/* &times; */}
        {/* using font awesome icon for close button */}
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Message;
