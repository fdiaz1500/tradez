import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

const Dashboard = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Portfolio Overview</Typography>
            <Typography variant="body1">
              Dashboard content will be implemented here.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Recent Transactions</Typography>
            <Typography variant="body1">
              Recent transaction list will be displayed here.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;



