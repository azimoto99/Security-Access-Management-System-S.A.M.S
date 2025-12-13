import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  AppBar,
  Toolbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
} from '@mui/material';
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
  useWebSocket((message) => {
    if (message.type === 'occupancy_update') {
      setOccupancies(message.data || []);
    }
  });

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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Box
            component="img"
            src="/logo.png"
            alt="Shield Canine Services Logo"
            sx={{
              height: 40,
              mr: 2,
            }}
          />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Security Access Management
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user?.username} ({user?.role})
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Shield Canine Services Logo"
              sx={{
                height: 80,
                mr: 3,
              }}
            />
            <Box>
              <Typography variant="h4" gutterBottom>
                Dashboard
              </Typography>
              <Typography variant="body1" paragraph>
                Welcome, {user?.username}!
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Role: {user?.role}
          </Typography>
          {user?.job_site_access && user.job_site_access.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Job Site Access: {user.job_site_access.length} site(s)
            </Typography>
          )}
        </Paper>

        {/* Real-time Occupancy */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Real-time Occupancy
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : occupancies.length === 0 ? (
            <Alert severity="info">No active job sites found</Alert>
          ) : (
            <Grid container spacing={3}>
              {occupancies.map((occupancy) => (
                <Grid item xs={12} sm={6} md={4} key={occupancy.job_site_id}>
                  <OccupancyCard occupancy={occupancy} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Grid container spacing={3}>
          {(user?.role === 'guard' || user?.role === 'admin') && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Log Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Record vehicle, visitor, or truck entry
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/entry')}>
                      Log Entry
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Process Exit
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Process exits for active entries
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/exit')}>
                      Process Exit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Search Entries
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Search and filter historical entries
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/search')}>
                      Search
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Job Site Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create and manage job sites
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/job-sites')}>
                      Manage Job Sites
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      User Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create and manage user accounts
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/users')}>
                      Manage Users
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Audit Logs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View system audit logs
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/audit-logs')}>
                      View Logs
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Reports & Analytics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Generate reports and view analytics
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/reports')}>
                      View Reports
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Watchlist
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage watchlist entries
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/watchlist')}>
                      Manage Watchlist
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Security Alerts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View and manage security alerts
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/alerts')}>
                      View Alerts
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      HR Document Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage HR documents and DocuSign integration
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/hr/manage')}>
                      Manage HR Documents
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </>
          )}
          {(user?.role === 'employee' || user?.role === 'guard') && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Onboarding & Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View and sign your HR documents
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/hr/documents')}>
                      My Documents
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </>
          )}
          {(user?.role === 'guard' || user?.role === 'admin') && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Security Alerts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View and manage security alerts
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/alerts')}>
                      View Alerts
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Emergency Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Handle emergency situations and evacuations
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/emergency')}>
                      Emergency Mode
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

