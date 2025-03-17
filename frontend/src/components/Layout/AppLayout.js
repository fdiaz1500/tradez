import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as SwapIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const AppLayout = () => {
  const { user, isAuthenticated, isDemoUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    await logout();
    handleProfileMenuClose();
  };
  
  const handleLogin = () => {
    navigate('/login');
    handleProfileMenuClose();
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Trading', icon: <SwapIcon />, path: '/trading' },
    { text: 'Wallets', icon: <WalletIcon />, path: '/wallets' },
    { text: 'Transactions', icon: <HistoryIcon />, path: '/transactions' }
  ];
  
  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div">
          Crypto Exchange
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Crypto Exchange'}
          </Typography>
          
          {/* Demo Mode Indicator */}
          {isDemoUser && (
            <Chip 
              label="Demo Mode" 
              color="secondary" 
              size="small" 
              sx={{ mr: 2 }} 
            />
          )}
          
          {/* User profile button */}
          <Button 
            color="inherit" 
            onClick={handleProfileMenuOpen}
            startIcon={
              <Avatar 
                sx={{ width: 32, height: 32 }}
                alt={user?.firstName}
                src="/static/images/avatar/1.jpg"
              >
                {user?.firstName?.charAt(0)}
              </Avatar>
            }
          >
            {user?.firstName} {user?.lastName}
          </Button>
          
          {/* Profile menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => {
              navigate('/profile');
              handleProfileMenuClose();
            }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            
            {isAuthenticated ? (
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            ) : (
              <MenuItem onClick={handleLogin}>
                <ListItemIcon>
                  <LoginIcon fontSize="small" />
                </ListItemIcon>
                Login
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Side Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;

