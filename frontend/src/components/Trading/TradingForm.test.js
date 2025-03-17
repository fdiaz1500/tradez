import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithAuth } from '../../utils/test-utils';
import TradingForm from './TradingForm';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock the auth context hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    },
    token: 'fake-jwt-token',
    isAuthenticated: true
  })
}));

describe('TradingForm Component', () => {
  // Mock data
  const mockCurrencies = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDT', name: 'Tether' }
  ];
  
  const mockWallets = [
    { currency: 'BTC', currency_name: 'Bitcoin', balance: '1.5' },
    { currency: 'ETH', currency_name: 'Ethereum', balance: '10.0' },
    { currency: 'USDT', currency_name: 'Tether', balance: '5000.0' }
  ];
  
  beforeEach(() => {
    // Mock successful API responses
    axios.create.mockReturnValue({
      get: jest.fn().mockImplementation((url) => {
        if (url.includes('/market/currencies')) {
          return Promise.resolve({ 
            data: { data: { currencies: mockCurrencies } } 
          });
        } else if (url.includes('/wallets')) {
          return Promise.resolve({ 
            data: { data: { wallets: mockWallets } } 
          });
        } else if (url.includes('/trading/rate')) {
          return Promise.resolve({ 
            data: { rate: 50000 } 
          });
        }
        return Promise.reject(new Error('Not found'));
      }),
      post: jest.fn().mockResolvedValue({
        data: {
          status: 'success',
          message: 'Exchange completed successfully',
          transaction: {
            transactionId: 'mock-tx-id',
            fromCurrency: 'BTC',
            toCurrency: 'USDT',
            fromAmount: 0.1,
            toAmount: 5000,
            fee: 0.0001,
            exchangeRate: 50000
          }
        }
      })
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders trading form correctly', async () => {
    renderWithAuth(<TradingForm />);
    
    // Data loading should be in progress
    expect(screen.getByText('Exchange Cryptocurrencies')).toBeInTheDocument();
    
    // Wait for currencies and wallets to load
    await waitFor(() => {
      expect(axios.create).toHaveBeenCalled();
    });
  });
  
  test('handles currency selection', async () => {
    renderWithAuth(<TradingForm />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.create).toHaveBeenCalled();
    });
    
    // Open "From Currency" dropdown
    const fromCurrencySelect = screen.getByLabelText('From Currency');
    fireEvent.mouseDown(fromCurrencySelect);
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
    
    // Select BTC
    const btcOption = screen.getByText('BTC (Bitcoin)');
    fireEvent.click(btcOption);
    
    // Open "To Currency" dropdown
    const toCurrencySelect = screen.getByLabelText('To Currency');
    fireEvent.mouseDown(toCurrencySelect);
    
    // Select USDT
    const usdtOption = screen.getByText('USDT (Tether)');
    fireEvent.click(usdtOption);
    
    // Verify exchange rate is fetched
    await waitFor(() => {
      expect(axios.create().get).toHaveBeenCalledWith('/trading/rate/BTC/USDT');
    });
  });
  
  test('handles amount input and shows estimated result', async () => {
    renderWithAuth(<TradingForm />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.create).toHaveBeenCalled();
    });
    
    // Select currencies
    const fromCurrencySelect = screen.getByLabelText('From Currency');
    fireEvent.mouseDown(fromCurrencySelect);
    const btcOption = await screen.findByText('BTC (Bitcoin)');
    fireEvent.click(btcOption);
    
    const toCurrencySelect = screen.getByLabelText('To Currency');
    fireEvent.mouseDown(toCurrencySelect);
    const usdtOption = await screen.findByText('USDT (Tether)');
    fireEvent.click(usdtOption);
    
    // Wait for exchange rate to load
    await waitFor(() => {
      expect(axios.create().get).toHaveBeenCalledWith(expect.stringContaining('/trading/rate/'));
    });
    
    // Enter amount
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '0.1' } });
    
    // Check that estimated result is shown
    await waitFor(() => {
      expect(screen.getByText(/You will receive approximately/i)).toBeInTheDocument();
    });
  });
  
  test('submits exchange transaction', async () => {
    renderWithAuth(<TradingForm />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.create).toHaveBeenCalled();
    });
    
    // Select currencies
    const fromCurrencySelect = screen.getByLabelText('From Currency');
    fireEvent.mouseDown(fromCurrencySelect);
    const btcOption = await screen.findByText('BTC (Bitcoin)');
    fireEvent.click(btcOption);
    
    const toCurrencySelect = screen.getByLabelText('To Currency');
    fireEvent.mouseDown(toCurrencySelect);
    const usdtOption = await screen.findByText('USDT (Tether)');
    fireEvent.click(usdtOption);
    
    // Wait for exchange rate to load
    await waitFor(() => {
      expect(axios.create().get).toHaveBeenCalledWith(expect.stringContaining('/trading/rate/'));
    });
    
    // Enter amount
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '0.1' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Exchange/i });
    fireEvent.click(submitButton);
    
    // Verify API call
    await waitFor(() => {
      expect(axios.create().post).toHaveBeenCalledWith('/trading/exchange', {
        fromCurrency: 'BTC',
        toCurrency: 'USDT',
        amount: 0.1
      });
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Exchange completed successfully!')).toBeInTheDocument();
    });
  });
  
  test('disables exchange button when amount exceeds balance', async () => {
    renderWithAuth(<TradingForm />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(axios.create).toHaveBeenCalled();
    });
    
    // Select currencies
    const fromCurrencySelect = screen.getByLabelText('From Currency');
    fireEvent.mouseDown(fromCurrencySelect);
    const btcOption = await screen.findByText('BTC (Bitcoin)');
    fireEvent.click(btcOption);
    
    const toCurrencySelect = screen.getByLabelText('To Currency');
    fireEvent.mouseDown(toCurrencySelect);
    const usdtOption = await screen.findByText('USDT (Tether)');
    fireEvent.click(usdtOption);
    
    // Enter amount exceeding balance
    const amountInput = screen.getByLabelText('Amount');
    fireEvent.change(amountInput, { target: { value: '999' } });
    
    // Check that button is disabled
    const submitButton = screen.getByRole('button', { name: /Exchange/i });
    expect(submitButton).toBeDisabled();
  });
});

