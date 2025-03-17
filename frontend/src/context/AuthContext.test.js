import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Test component that uses auth context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'No user'}</div>
      <div data-testid="token">{auth.token || 'No token'}</div>
      <div data-testid="isAuthenticated">{auth.isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error">{auth.error || 'No error'}</div>
      <button onClick={() => auth.login('test@example.com', 'password')}>Login</button>
      <button onClick={() => auth.register({ email: 'test@example.com', password: 'password' })}>Register</button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };
  
  const mockToken = 'jwt-token';
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock localStorage getItem
    jest.spyOn(Storage.prototype, 'getItem');
    
    // Mock localStorage setItem
    jest.spyOn(Storage.prototype, 'setItem');
    
    // Mock localStorage removeItem
    jest.spyOn(Storage.prototype, 'removeItem');
  });
  
  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  test('initializes with no user or token', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('token')).toHaveTextContent('No token');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Not authenticated');
  });
  
  test('initializes with stored token and fetches user profile', async () => {
    // Mock localStorage to return a token
    localStorage.getItem.mockReturnValueOnce(mockToken);
    
    // Mock successful profile API call
    axios.create.mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({
        data: { user: mockUser }
      })
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    await waitFor(() => {
      // After API call completes
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Authenticated');
    });
  });
  
  test('handles login successfully', async () => {
    // Mock successful login API call
    axios.post.mockResolvedValueOnce({
      data: {
        token: mockToken,
        user: mockUser
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    const loginButton = screen.getByRole('button', { name: /login/i });
    await act(async () => {
      loginButton.click();
    });
    
    // After login completes
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password'
      });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Authenticated');
    });
  });
  
  test('handles login failure', async () => {
    // Mock failed login API call
    const errorMessage = 'Invalid credentials';
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: errorMessage
        }
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click login button
    const loginButton = screen.getByRole('button', { name: /login/i });
    await act(async () => {
      loginButton.click();
    });
    
    // After login fails
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password'
      });
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Not authenticated');
    });
  });
  
  test('handles registration successfully', async () => {
    // Mock successful register API call
    axios.post.mockResolvedValueOnce({
      data: {
        token: mockToken,
        user: mockUser
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click register button
    const registerButton = screen.getByRole('button', { name: /register/i });
    await act(async () => {
      registerButton.click();
    });
    
    // After registration completes
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'test@example.com',
        password: 'password'
      });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email);
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Authenticated');
    });
  });
  
  test('handles logout correctly', async () => {
    // Setup initial authenticated state
    localStorage.getItem.mockReturnValueOnce(mockToken);
    
    // Mock successful profile API call
    axios.create.mockReturnValueOnce({
      get: jest.fn().mockResolvedValueOnce({
        data: { user: mockUser }
      })
    });
    
    // Mock successful logout API call
    axios.post.mockResolvedValueOnce({});
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth state to be set
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Authenticated');
    });
    
    // Click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await act(async () => {
      logoutButton.click();
    });
    
    // After logout completes
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/auth/logout', {}, expect.any(Object));
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('token')).toHaveTextContent('No token');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Not authenticated');
    });
  });
});

