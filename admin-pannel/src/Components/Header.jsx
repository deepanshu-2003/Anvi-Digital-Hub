import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Message from './Message';
import { useContext } from 'react';
import { MessageContext } from '../Context/MessageContext';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { message, setMessage } = useContext(MessageContext);
  const [user, setUser] = useState(localStorage.getItem('user') || 'Root User');

  const validateToken = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      handleLogout(); // If no token, log out the user
      return false;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auth_token: token }),
      });

      if (!response.ok) {
        handleLogout(); // Invalid token, log out the user
        return false;
      }

      const data = await response.json();
      console.log('Token validated:', data);
      return true; // Token is valid
    } catch (error) {
      console.error('Error validating token:', error);
      handleLogout(); // On error, log out the user
      return false;
    }
  };

  const fetchUsername = async () => {
    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/get-admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          auth_token: token,
        },
      });

      if (!response.ok) {
        localStorage.setItem('user', 'Root User');
        throw new Error(`Error: ${response.status}`);
      }

      const { first_name, last_name } = await response.json();
      const username = `${first_name} ${last_name}`;
      setUser(username);
      localStorage.setItem('user', username);
    } catch (error) {
      console.error('Error fetching username:', error);
      setUser('Root User');
      localStorage.setItem('user', 'Root User');
    }
  };



  
  
  
  useEffect(() => {
    const initializeUser = async () => {
      const isValidToken = await validateToken();
      if (!isValidToken) return;
      
      const token = localStorage.getItem('auth_token');
      setIsLoggedIn(!!token);      
      const username = localStorage.getItem('user');
      if (!username) {
        fetchUsername();
        console.log('Fetching username');
      } else {
        setUser(username);
      }
    };
    
    initializeUser();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser('Root User');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
    <header className="custom-header text-white shadow-sm">
      <nav className="navbar navbar-expand-lg navbar-dark container py-2">
        <button
          className="navbar-toggler me-3"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasNavbar"
          aria-controls="offcanvasNavbar"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <img src="logo192.png" alt="Logo" className="logo me-2" />
          Anvi Digital Hub
        </Link>
        <div className="offcanvas offcanvas-start" id="offcanvasNavbar" data-bs-scroll="true">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Menu</h5>
            <button
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body">
            <ul className="navbar-nav ms-auto">
              {['Home', 'Services', 'Courses', 'About', 'Contact'].map((menu) => (
                <li className="nav-item" key={menu}>
                  <Link
                    className={`nav-link fw-semibold ${isActive(`/${menu.toLowerCase()}`) ? 'active' : ''}`}
                    to={`/${menu.toLowerCase()}`}
                  >
                    {menu}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="d-flex align-items-center ms-lg-4 user-section">
          <div className="dropdown">
            <button
              className="btn user-btn dropdown-toggle"
              type="button"
              id="userDropdown"
              data-bs-toggle="dropdown"
            >
              {user}
            </button>
            <ul className="dropdown-menu user-dropdown">
              {isLoggedIn ? (
                <>
                  <li>
                    <Link className="dropdown-item" to="/account">
                      Account
                    </Link>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link className="dropdown-item" to="/login">
                    Login Now
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
    {message && (
        <Message
          type={message.type}
          message={message.text}
          onClose={() => setMessage(null)}
        />
      )}
    </>
  );
};

export default Header;
