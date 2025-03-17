import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Box, Typography, Paper, Button } from '@mui/material';

const Register = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Register
          </Typography>
          <Typography variant="body1" gutterBottom>
            Registration form will be implemented here.
          </Typography>
          <Button component={Link} to="/login" variant="contained">
            Back to Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;




