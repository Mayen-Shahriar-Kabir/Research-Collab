import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Auth.css';
export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(
      "http://localhost:5001/api/auth/register",
      { name, email, password }
      );
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
  
  <div className="auth-container">
    <div className="auth-card">
     
      <div className="auth-header">
        <h2>Create Account</h2>
        <p>Please fill in your information to register</p>
      </div>
      
      
      {error && <div className="alert alert-danger">{error}</div>}
      
  
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="mb-3">
          
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>
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
     
        <button className="btn auth-btn">Register</button>
      </form>
      

      <div className="auth-link">
        <p>Already have an account? <a href="/login">Sign in here</a></p>
      </div>
    </div>
  </div>
);
}