import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // Normalize API base to avoid double /api or trailing slashes
  const API_BASE = ((process.env.REACT_APP_API_URL || 'http://localhost:5001')
    .replace(/\/$/, '')
    .replace(/\/api$/, ''));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    console.log('Attempting login with:', { email, password });

    try {
      const res = await axios.post(
        `${API_BASE}/api/login`, // use configurable API base
        { email, password },
        { withCredentials: true }
      );

      console.log('Login response:', res.data);
      
      // store user info in state and persist to localStorage
      setUser(res.data.user);
      try {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        // Store JWT token if provided
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
      } catch (e) {
        // ignore storage errors
      }

      // redirect to Profile page for editing
      navigate("/profile");
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Please sign in to your account</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="btn auth-btn">Login</button>
        </form>

        <div className="auth-link">
          <p>Don't have an account? <Link to="/register">Create one here</Link></p>
        </div>
      </div>
    </div>
  );
}