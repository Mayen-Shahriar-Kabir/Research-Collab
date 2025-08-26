import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState } from "react";
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import User from './pages/User';
import ProfilePage from './pages/ProfilePage';
import AdminUsers from './pages/AdminUsers';
import RoleRequest from './pages/RoleRequest';
import NewProject from './pages/NewProject';
import ApplicationsReview from './pages/ApplicationsReview';
import Navbar from "./components/navbar";
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import BookmarksPage from './pages/BookmarksPage';
import NotificationsPage from './pages/NotificationsPage';
import ProjectManagement from './components/ProjectManagement';
import Dashboard from './pages/Dashboard';
import PcRequestsPage from './pages/PcRequestsPage';
import AdminPcManagement from './pages/AdminPcManagement';
import CertificatesPage from './pages/CertificatesPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // store logged-in user

  // Hydrate user from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, []);

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
            <Route path='/admin/users' element={<AdminUsers user={user} />} />
            <Route path='/role-request' element={<RoleRequest user={user} setUser={setUser} />} />
            <Route path='/projects/new' element={<NewProject user={user} />} />
            <Route path='/applications-review' element={<ApplicationsReview user={user} />} />
            <Route path='/projects' element={<ProjectsPage userRole={user?.role} userId={user?.id} />} />
            <Route path='/tasks' element={<TasksPage userId={user?.id || user?._id} userRole={user?.role} />} />
            <Route path='/tasks/:taskId' element={<TasksPage userId={user?.id || user?._id} userRole={user?.role} />} />
            <Route path='/bookmarks' element={<BookmarksPage userId={user?.id} />} />
            <Route path='/notifications' element={<NotificationsPage userId={user?.id} />} />
            <Route path='/project-management' element={<ProjectManagement user={user} />} />
            <Route path='/dashboard' element={<Dashboard userId={user?.id || user?._id} userRole={user?.role} />} />
            <Route path='/pc-requests' element={<PcRequestsPage user={user} />} />
            <Route path='/admin/pc' element={<AdminPcManagement user={user} />} />
            <Route path='/certificates' element={<CertificatesPage userId={user?.id || user?._id} />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;