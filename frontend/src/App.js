import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import './App.css';

// Auth components
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Main app components
import Dashboard from './pages/Dashboard/Dashboard';
import Trading from './pages/Trading/Trading';
import Wallets from './pages/Wallets/Wallets';
import Transactions from './pages/Transactions/Transactions';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound';

// Layout components
import AppLayout from './components/Layout/AppLayout';

// Context
import { useAuth } from './context/AuthContext';

function App() {
  const { loading } = useAuth();

  // If authentication is still loading, show a loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </Box>
    );
  }

  return (
    <Container maxWidth={false} disableGutters>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* All routes are accessible without authentication */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trading" element={<Trading />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Container>
  );
}

export default App;

