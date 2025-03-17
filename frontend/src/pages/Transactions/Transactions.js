import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Transactions = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Transaction History
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Transaction history will be displayed here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Transactions;



