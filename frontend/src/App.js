import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState } from "react";
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import User from './pages/User';
import ProfilePage from './pages/ProfilePage';
import Navbar from "./components/navbar";
import './App.css';

function App() {
  const [user, setUser] = useState(null); // store logged-in user

  // Debug user state
  console.log('App user state:', user);
  console.log('User ID for profile:', user?.id);

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar user={user} setUser={setUser} />
        <div className="pages">
          <Routes>
            <Route path='/' element={<Navigate to="/login" />} />
            <Route path='/home' element={<Home user={user} />} />
            <Route path='/login' element={<Login setUser={setUser} />} />
            <Route path='/register' element={<Register />} />
            <Route path='/user' element={<User user={user} />} />
            <Route path='/profile' element={<ProfilePage userId={user?.id} user={user} />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;