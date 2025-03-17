import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from '../context/AuthContext';

// Create a theme for testing
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

/**
 * Custom render function that includes global providers
 */
function render(ui, { route = '/', ...renderOptions } = {}) {
  // Set window location
  window.history.pushState({}, 'Test page', route);
  
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  }
  
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock authenticated user context
 */
function renderWithAuth(ui, { 
  user = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user'
  }, 
  token = 'fake-jwt-token',
  ...renderOptions 
} = {}) {
  
  // Mock the AuthContext values
  const mockAuthContext = {
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null,
    login: jest.fn().mockResolvedValue({ user, token }),
    register: jest.fn().mockResolvedValue({ user, token }),
    logout: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue({ user })
  };
  
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthProvider value={mockAuthContext}>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  }
  
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from RTL
export * from '@testing-library/react';

// Override render method
export { render, renderWithAuth };

