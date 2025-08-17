import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar({ user, setUser }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      // Clear any persisted session items if used
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      // no-op
    }
    setUser?.(null);
    navigate('/login');
  };

  const linkClass = (path) =>
    `nav-link ${pathname === path ? "active" : ""}`;

  return (
    <nav className="modern-navbar">
      <div className="navbar-container">
        {/* Left Navigation */}
        <div className="navbar-left">
          <ul className="nav-links">
            {user && (
              <>
                <li>
                  <Link className={linkClass("/home")} to="/home">
                    <i className="nav-icon">🏠</i>
                    Home
                  </Link>
                </li>
                <li>
                  <Link className={linkClass("/profile")} to="/profile">
                    <i className="nav-icon">👤</i>
                    Profile
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Center Title */}
        <div className="navbar-center">
          <Link className="navbar-title" to="/">
             Research Portal
          </Link>
        </div>

        {/* Right Navigation */}
        <div className="navbar-right">
          <ul className="nav-links">
            {user ? (
              <>
                <li>
                  <Link className={linkClass("/user")} to="/user">
                    <i className="nav-icon">📊</i>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className={linkClass("/logout")}
                    onClick={(e) => { e.preventDefault(); handleLogout(); }}
                  >
                    <i className="nav-icon">🚪</i>
                    Logout
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link className={linkClass("/login")} to="/login">
                    <i className="nav-icon">🔐</i>
                    Login
                  </Link>
                </li>
                <li>
                  <Link className={linkClass("/register")} to="/register">
                    <i className="nav-icon">📝</i>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-toggle" onClick={() => document.querySelector('.navbar-container').classList.toggle('mobile-open')}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}