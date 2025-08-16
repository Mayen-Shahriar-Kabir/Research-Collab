import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const linkClass = (path) =>
    `nav-link ${pathname === path ? "active" : ""}`;

  return (
    <nav className="modern-navbar">
      <div className="navbar-container">
        {/* Left Navigation */}
        <div className="navbar-left">
          <ul className="nav-links">
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
          </ul>
        </div>

        {/* Center Title */}
        <div className="navbar-center">
          <Link className="navbar-title" to="/">
            T1 Research Portal
          </Link>
        </div>

        {/* Right Navigation */}
        <div className="navbar-right">
          <ul className="nav-links">
            <li>
              <Link className={linkClass("/user")} to="/user">
                <i className="nav-icon">📊</i>
                Dashboard
              </Link>
            </li>
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