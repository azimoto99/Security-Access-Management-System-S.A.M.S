import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Logout,
  DirectionsCar,
  Person,
  Search,
  Business,
  People,
  Assessment,
  Security,
  Warning,
  Description,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { occupancyService, type JobSiteOccupancy } from '../services/occupancyService';
import { OccupancyCard } from '../components/OccupancyCard';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [occupancies, setOccupancies] = useState<JobSiteOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection for real-time updates
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'occupancy_update') {
      setOccupancies(message.data || []);
    }
  }, []);

  useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    loadOccupancy();
  }, []);

  const loadOccupancy = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await occupancyService.getAllOccupancy();
      setOccupancies(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load occupancy data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getActionIcon = (action: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      entry: <DirectionsCar fontSize="small" />,
      exit: <Person fontSize="small" />,
      search: <Search fontSize="small" />,
      'job-sites': <Business fontSize="small" />,
      users: <People fontSize="small" />,
      'audit-logs': <Assessment fontSize="small" />,
      reports: <Assessment fontSize="small" />,
      watchlist: <Security fontSize="small" />,
      alerts: <Warning fontSize="small" />,
      'hr/manage': <Description fontSize="small" />,
      'hr/documents': <Description fontSize="small" />,
      emergency: <Warning fontSize="small" />,
    };
    return icons[action] || <DashboardIcon fontSize="small" />;
  };

  const actionCards = [
    ...((user?.role === 'guard' || user?.role === 'admin')
      ? [
          { title: 'Log Entry', desc: 'Record entry', path: '/entry', icon: 'entry' },
          { title: 'Process Exit', desc: 'Process exits', path: '/exit', icon: 'exit' },
          { title: 'Search Entries', desc: 'Search history', path: '/search', icon: 'search' },
          { title: 'Audit Logs', desc: 'View logs', path: '/audit-logs', icon: 'audit-logs' },
          { title: 'Reports', desc: 'Analytics', path: '/reports', icon: 'reports' },
        ]
      : []),
    ...(user?.role === 'client'
      ? [
          { title: 'Search Entries', desc: 'Search history', path: '/search', icon: 'search' },
          { title: 'Audit Logs', desc: 'View logs', path: '/audit-logs', icon: 'audit-logs' },
          { title: 'Reports', desc: 'Analytics', path: '/reports', icon: 'reports' },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [
          { title: 'Job Sites', desc: 'Manage sites', path: '/job-sites', icon: 'job-sites' },
          { title: 'Users', desc: 'Manage users', path: '/users', icon: 'users' },
          { title: 'Watchlist', desc: 'Manage list', path: '/watchlist', icon: 'watchlist' },
          { title: 'HR Docs', desc: 'DocuSign', path: '/hr/manage', icon: 'hr/manage' },
        ]
      : []),
    ...((user?.role === 'employee' || user?.role === 'guard')
      ? [{ title: 'My Documents', desc: 'HR docs', path: '/hr/documents', icon: 'hr/documents' }]
      : []),
    ...((user?.role === 'guard' || user?.role === 'admin')
      ? [
          { title: 'Alerts', desc: 'Security alerts', path: '/alerts', icon: 'alerts' },
          { title: 'Emergency', desc: 'Emergency mode', path: '/emergency', icon: 'emergency' },
        ]
      : []),
  ];

  // Remove duplicates
  const uniqueActionCards = Array.from(
    new Map(actionCards.map((card) => [card.path, card])).values()
  );

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ minHeight: '56px !important', py: 1 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Shield Logo"
            sx={{ height: 32, mr: 2 }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem', fontWeight: 600 }}>
            Security Access Management
          </Typography>
          <Chip
            label={`${user?.username} (${user?.role})`}
            size="small"
            sx={{
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
              mr: 1,
              height: '28px',
              fontSize: '0.75rem',
            }}
          />
          <IconButton
            onClick={handleLogout}
            size="small"
            sx={{
              color: '#ffd700',
              '&:hover': { backgroundColor: '#2a2a2a' },
            }}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Compact Header */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              Welcome, {user?.username} • {user?.role}
              {user?.job_site_access && user.job_site_access.length > 0
                ? ` • ${user.job_site_access.length} site(s)`
                : ''}
            </Typography>
          </Box>
        </Box>

        {/* Real-time Occupancy */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}>
            Real-time Occupancy
          </Typography>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 1.5,
                backgroundColor: '#2a1a1a',
                border: '1px solid #ff4444',
                color: '#ff6666',
                '& .MuiAlert-icon': { color: '#ff4444' },
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={32} sx={{ color: '#ffd700' }} />
            </Box>
          ) : occupancies.length === 0 ? (
            <Alert
              severity="info"
              sx={{
                backgroundColor: '#1a1a2a',
                border: '1px solid #2a2a3a',
                color: '#b0b0b0',
              }}
            >
              No active job sites found
            </Alert>
          ) : (
            <Grid container spacing={1.5}>
              {occupancies.map((occupancy) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={occupancy.job_site_id}>
                  <OccupancyCard occupancy={occupancy} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}>
            Quick Actions
          </Typography>
          <Grid container spacing={1.5}>
            {uniqueActionCards.map((action) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={action.path}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      borderColor: '#ffd700',
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => navigate(action.path)}
                >
                  <CardContent sx={{ p: 1.5, flexGrow: 1, '&:last-child': { pb: 1.5 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 0.5,
                        color: '#ffd700',
                      }}
                    >
                      {getActionIcon(action.icon)}
                      <Typography
                        variant="body2"
                        sx={{
                          ml: 0.5,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          lineHeight: 1.2,
                        }}
                      >
                        {action.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#b0b0b0', fontSize: '0.7rem', display: 'block' }}
                    >
                      {action.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

