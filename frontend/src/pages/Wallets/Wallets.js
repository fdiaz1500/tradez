import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Wallets = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Wallets
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Wallet management interface will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Wallets;


