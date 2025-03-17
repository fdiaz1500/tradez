import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoUser, setIsDemoUser] = useState(false);

  // Initialize authentication state from local storage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Set up axios with auth header
          const apiClient = axios.create({
            baseURL: process.env.REACT_APP_API_URL || '/api',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          // Fetch user profile
          const response = await apiClient.get('/users/profile');
          setUser(response.data.user);
          setToken(storedToken);
          setIsDemoUser(false);
        } catch (err) {
          console.error('Authentication error:', err);
          // If token is invalid or expired, clear it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          // Set as demo user
          initDemoUser();
        }
      } else {
        // No token, use demo user
        initDemoUser();
      }
      setLoading(false);
    };

    const initDemoUser = async () => {
      try {
        // Create axios instance without auth header
        const apiClient = axios.create({
          baseURL: process.env.REACT_APP_API_URL || '/api',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Fetch any endpoint to get the demo user attached by middleware
        const response = await apiClient.get('/users/profile');
        if (response.data && response.data.user) {
          setUser(response.data.user);
          setIsDemoUser(true);
        } else {
          // If all else fails, create a local demo user
          setUser({
            id: '00000000-0000-0000-0000-000000000000',
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'User',
            role: 'user'
          });
          setIsDemoUser(true);
        }
      } catch (err) {
        console.error('Demo user initialization error:', err);
        // Still create a local demo user on failure
        setUser({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'user'
        });
        setIsDemoUser(true);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make login request
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      // Save token to local storage
      localStorage.setItem('token', response.data.token);
      
      // Set state
      setToken(response.data.token);
      setUser(response.data.user);
      setIsDemoUser(false);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Make register request
      const response = await axios.post('/api/auth/register', userData);
      
      // Save token to local storage
      localStorage.setItem('token', response.data.token);
      
      // Set state
      setToken(response.data.token);
      setUser(response.data.user);
      setIsDemoUser(false);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Make logout request if token exists
      if (token) {
        await axios.post('/api/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Clear local storage and state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      
      // Switch to demo user mode
      const demoUser = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'user'
      };
      setUser(demoUser);
      setIsDemoUser(true);
    } catch (err) {
      console.error('Logout error:', err);
      // Even if the request fails, clear local storage and state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsDemoUser(true);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (isDemoUser) {
        // For demo users, just simulate a successful update
        response = {
          data: {
            user: {
              ...user,
              ...profileData
            }
          }
        };
      } else {
        // Make update request for authenticated users
        response = await axios.put('/api/users/profile', profileData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Update user state
      setUser(response.data.user);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user && !isDemoUser;

  const value = {
    user,
    token,
    isAuthenticated,
    isDemoUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

