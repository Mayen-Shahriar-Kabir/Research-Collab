import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
      return null;
    }
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthToken(null);
      setCurrentUser(null);
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }, []);

  const login = useCallback(async (token, userData) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setAuthToken(token);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }, []);

  // Check for existing token and validate it
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        setLoading(false);
        return;
      }

      try {
        // Parse and set user data
        const user = JSON.parse(userData);
        setAuthToken(token);
        setCurrentUser(user);
        
        console.log('AuthContext: User loaded from localStorage:', user);
      } catch (error) {
        console.error('Session validation failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [logout]);

  const value = React.useMemo(() => ({
    authToken,
    currentUser,
    setCurrentUser,
    login,
    logout,
    isAuthenticated: !!authToken,
  }), [authToken, currentUser, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
