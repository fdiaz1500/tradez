import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center'
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" paragraph>
          The page you are looking for does not exist or has been moved.
        </Typography>
        <Button component={Link} to="/" variant="contained" color="primary">
          Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;


