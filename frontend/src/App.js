import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import ProjectManagementPage from './pages/ProjectManagementPage';
import Dashboard from './pages/Dashboard';
import PcRequestsPage from './pages/PcRequestsPage';
import AdminPcManagement from './pages/AdminPcManagement';
import CertificatesPage from './pages/CertificatesPage';
import MessagesPage from './pages/MessagesPage';
import './App.css';

function App() {
  // We'll let individual components use useAuth() as needed
  // This prevents the "useAuth must be used within an AuthProvider" error

  return (
    <AuthProvider>
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
        <Navbar />
        <div className="pages">
          <Routes>
            <Route path='/' element={<Navigate to="/login" />} />
            <Route path='/home' element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/user' element={<User />} />
            <Route path='/profile' element={<ProfilePage />} />
            <Route path='/admin/users' element={<AdminUsers />} />
            <Route path='/role-request' element={<RoleRequest />} />
            <Route path='/projects/new' element={<NewProject />} />
            <Route path='/applications-review' element={<ApplicationsReview />} />
            <Route path='/projects' element={<ProjectsPage />} />
            <Route path='/tasks' element={<TasksPage />} />
            <Route path='/tasks/:taskId' element={<TasksPage />} />
            <Route path='/bookmarks' element={<BookmarksPage />} />
            <Route path='/notifications' element={<NotificationsPage />} />
            <Route path='/project-management' element={<ProjectManagementPage />} />
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/pc-requests' element={<PcRequestsPage />} />
            <Route path='/admin/pc' element={<AdminPcManagement />} />
            <Route path='/admin/users' element={<AdminUsers />} />
            <Route path='/certificates' element={<CertificatesPage />} />
            <Route path='/messages' element={<MessagesPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;