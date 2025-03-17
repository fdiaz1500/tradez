import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl,
  InputLabel,
  FormHelperText,
  Typography,
  Paper,
  Grid,
  Box,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';

const TradingForm = () => {
  const { user, token } = useAuth();
  const [currencies, setCurrencies] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const [formData, setFormData] = useState({
    fromCurrency: '',
    toCurrency: '',
    amount: '',
  });
  
  // Fetch exchange rate between two currencies
  const fetchExchangeRate = async (fromCurrency, toCurrency) => {
    if (!fromCurrency || !toCurrency) return;
    
    try {
      setRateLoading(true);
      const apiClient = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await apiClient.get(`/trading/rate/${fromCurrency}/${toCurrency}`);
      setExchangeRate(response.data.rate);
      
      // Calculate estimated amount and fee if we have an amount
      if (formData.amount) {
        calculateEstimatedAmount(formData.amount, response.data.rate);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch exchange rate. Please try again.',
        severity: 'error'
      });
      setExchangeRate(null);
    } finally {
      setRateLoading(false);
    }
  };
  
  const [exchangeRate, setExchangeRate] = useState(null);
  const [estimatedReceived, setEstimatedReceived] = useState(null);
  const [fee, setFee] = useState(null);
  
  // Calculate estimated amount and fee
  const calculateEstimatedAmount = (amount, rate) => {
    if (!amount || !rate) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;
    
    // Assuming 0.1% fee
    const feeAmount = parsedAmount * 0.001;
    setFee(feeAmount);
    
    const amountAfterFee = parsedAmount - feeAmount;
    const received = amountAfterFee * rate;
    setEstimatedReceived(received);
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Fetch new exchange rate if currencies change
    if (name === 'fromCurrency' || name === 'toCurrency') {
      const fromCurrency = name === 'fromCurrency' ? value : formData.fromCurrency;
      const toCurrency = name === 'toCurrency' ? value : formData.toCurrency;
      
      if (fromCurrency && toCurrency) {
        fetchExchangeRate(fromCurrency, toCurrency);
      }
    }
    
    // Recalculate estimated amount if amount changes
    if (name === 'amount' && exchangeRate) {
      calculateEstimatedAmount(value, exchangeRate);
    }
  };
  
  // Swap currencies
  const handleSwapCurrencies = () => {
    setFormData(prev => ({
      ...prev,
      fromCurrency: prev.toCurrency,
      toCurrency: prev.fromCurrency
    }));
    
    if (formData.fromCurrency && formData.toCurrency) {
      fetchExchangeRate(formData.toCurrency, formData.fromCurrency);
    }
  };
  
  // Submit exchange
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const apiClient = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const response = await apiClient.post('/trading/exchange', {
        fromCurrency: formData.fromCurrency,
        toCurrency: formData.toCurrency,
        amount: parseFloat(formData.amount)
      });
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Exchange completed successfully!',
        severity: 'success'
      });
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        amount: ''
      }));
      
      setEstimatedReceived(null);
      setFee(null);
      
      // Refresh wallets
      const walletsResponse = await apiClient.get('/wallets');
      setWallets(walletsResponse.data.data.wallets);
      
    } catch (error) {
      console.error('Exchange error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to complete exchange. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Find current wallet balance
  const getCurrentWalletBalance = (currency) => {
    if (!currency || !wallets.length) return 0;
    
    const wallet = wallets.find(w => w.currency === currency);
    return wallet ? parseFloat(wallet.balance) : 0;
  };
  
  // Fetch available currencies and user wallets on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Set up axios with auth header
        const apiClient = axios.create({
          baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Fetch cryptocurrencies
        const currenciesResponse = await apiClient.get('/market/currencies');
        setCurrencies(currenciesResponse.data.data.currencies);
        
        // Fetch user wallets
        const walletsResponse = await apiClient.get('/wallets');
        setWallets(walletsResponse.data.data.wallets);
        
        // Set default values if currencies and wallets are available
        if (currenciesResponse.data.data.currencies.length > 1 && walletsResponse.data.data.wallets.length > 0) {
          const defaultFromWallet = walletsResponse.data.data.wallets.find(w => parseFloat(w.balance) > 0);
          
          if (defaultFromWallet) {
            const defaultFromCurrency = defaultFromWallet.currency;
            const defaultToCurrency = currenciesResponse.data.data.currencies
              .find(c => c.symbol !== defaultFromCurrency)?.symbol || '';
            
            setFormData({
              fromCurrency: defaultFromCurrency,
              toCurrency: defaultToCurrency,
              amount: ''
            });
            
            // Fetch initial exchange rate
            if (defaultFromCurrency && defaultToCurrency) {
              fetchExchangeRate(defaultFromCurrency, defaultToCurrency);
            }
          }





