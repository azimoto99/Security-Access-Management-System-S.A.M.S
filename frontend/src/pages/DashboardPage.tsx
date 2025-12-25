import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Skeleton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
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
  Login as LoginIcon,
  Logout as LogoutIcon,
  ExitToApp,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { occupancyService, type JobSiteOccupancy } from '../services/occupancyService';
import { OccupancyCard } from '../components/OccupancyCard';
import { dashboardService, type DashboardSummary } from '../services/dashboardService';
import { DashboardSummaryCard } from '../components/DashboardSummaryCard';
import { RecentActivityList } from '../components/RecentActivityList';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { QuickEntryForm } from '../components/QuickEntryForm';
import { OnSiteVehiclesList } from '../components/OnSiteVehiclesList';
import { ManualExitForm } from '../components/ManualExitForm';
import { entryService, type Entry } from '../services/entryService';
import { AdminDashboardPage } from './AdminDashboardPage';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [occupancies, setOccupancies] = useState<JobSiteOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  
  // Guard dashboard state
  const [onSiteEntries, setOnSiteEntries] = useState<Entry[]>([]);
  const [onSiteLoading, setOnSiteLoading] = useState(false);
  const [onSiteError, setOnSiteError] = useState<string | null>(null);
  const [guardSelectedSiteId, setGuardSelectedSiteId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState(0);
  const [manualExitDialogOpen, setManualExitDialogOpen] = useState(false);
  const [manualExitSuccess, setManualExitSuccess] = useState<string | null>(null);
  const [manualExitError, setManualExitError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get first accessible site for client or guard
  useEffect(() => {
    if (user?.role === 'client' && user.job_site_access && user.job_site_access.length > 0) {
      setSelectedSiteId(user.job_site_access[0]);
      loadJobSites();
    } else if (user?.role === 'guard' && user.job_site_access && user.job_site_access.length > 0) {
      // Guard dashboard - select first accessible site
      const firstSite = user.job_site_access[0];
      setGuardSelectedSiteId(firstSite);
      loadJobSites().then(() => {
        loadOnSiteEntries(firstSite);
      });
    } else if (user?.role !== 'client' && user?.role !== 'guard' && user?.role !== 'admin') {
      loadOccupancy();
    }
  }, [user]);

  const loadJobSites = async () => {
    try {
      const sites = await jobSiteService.getAllJobSites(true);
      setJobSites(sites);
      if (!selectedSiteId && sites.length > 0 && user?.job_site_access) {
        const accessibleSite = sites.find((site) => user.job_site_access?.includes(site.id));
        if (accessibleSite) {
          setSelectedSiteId(accessibleSite.id);
        }
      }
      return sites;
    } catch (err: any) {
      console.error('Failed to load job sites:', err);
      return [];
    }
  };

  // Load on-site entries for guard dashboard
  const loadOnSiteEntries = async (siteId: string) => {
    try {
      setOnSiteLoading(true);
      setOnSiteError(null);
      const entries = await entryService.getActiveEntries(siteId);
      setOnSiteEntries(entries);
    } catch (err: any) {
      setOnSiteError(err.message || 'Failed to load on-site entries');
    } finally {
      setOnSiteLoading(false);
    }
  };

  // Handle exit processing
  const handleExit = async (entryId: string, _exitNotes?: string) => {
    try {
      await entryService.processExit({ entry_id: entryId });
      // Remove from list immediately
      setOnSiteEntries((prev) => prev.filter((e) => e.id !== entryId));
      // Reload to ensure consistency
      if (guardSelectedSiteId) {
        loadOnSiteEntries(guardSelectedSiteId);
      }
    } catch (error: any) {
      throw error;
    }
  };

  // Handle new entry created
  const handleEntryCreated = (entry: Entry) => {
    // Add to on-site list if it's for the current site
    if (guardSelectedSiteId && entry.job_site_id === guardSelectedSiteId) {
      setOnSiteEntries((prev) => [entry, ...prev]);
    }
    // Reload to ensure consistency
    if (guardSelectedSiteId) {
      setTimeout(() => {
        loadOnSiteEntries(guardSelectedSiteId);
      }, 500);
    }
  };

  // Handle manual exit
  const handleManualExit = async (data: any) => {
    try {
      setManualExitError(null);
      setManualExitSuccess(null);
      
      const entry = await entryService.createManualExit(data);
      
      setManualExitDialogOpen(false);
      setManualExitSuccess(`✓ Manual exit logged successfully! Entry ID: ${entry.id.substring(0, 8)}...`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setManualExitSuccess(null);
      }, 5000);
    } catch (err: any) {
      setManualExitError(err.message || 'Failed to log manual exit');
    }
  };

  // WebSocket connection for real-time updates
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'occupancy_update') {
      setOccupancies(message.data || []);
    } else if (message.type === 'entry:created') {
      // Add to on-site list if it's for the current site
      if (guardSelectedSiteId && message.entry?.job_site_id === guardSelectedSiteId && message.entry?.exit_time === null) {
        setOnSiteEntries((prev) => {
          // Check if entry already exists
          if (prev.find((e) => e.id === message.entry.id)) {
            return prev;
          }
          return [message.entry, ...prev];
        });
      }
      // Invalidate dashboard query to refetch data
      if (selectedSiteId) {
        queryClient.invalidateQueries({ queryKey: ['clientDashboard', selectedSiteId] });
      }
    } else if (message.type === 'entry:updated') {
      // Remove from on-site list if exit was processed
      if (guardSelectedSiteId && message.entry?.exit_time) {
        setOnSiteEntries((prev) => prev.filter((e) => e.id !== message.entry.id));
      }
      // Invalidate dashboard query to refetch data
      if (selectedSiteId) {
        queryClient.invalidateQueries({ queryKey: ['clientDashboard', selectedSiteId] });
      }
    }
  }, [selectedSiteId, guardSelectedSiteId, queryClient]);

  useWebSocket(handleWebSocketMessage);

  // React Query for client dashboard
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery<DashboardSummary>({
    queryKey: ['clientDashboard', selectedSiteId],
    queryFn: () => dashboardService.getDashboardSummary(selectedSiteId!),
    enabled: user?.role === 'client' && selectedSiteId !== null,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

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

  const selectedSite = useMemo(() => {
    return jobSites.find((site) => site.id === selectedSiteId);
  }, [jobSites, selectedSiteId]);

  const formatLastUpdated = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
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

  // Admin Dashboard View
  if (user?.role === 'admin') {
    return <AdminDashboardPage />;
  }

  // Guard Dashboard View (Split-Screen)
  if (user?.role === 'guard') {
    // Show loading if site not selected yet
    if (!guardSelectedSiteId) {
      return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      );
    }

    const guardSelectedSite = jobSites.find((site) => site.id === guardSelectedSiteId);
    const guardCurrentOccupancy = onSiteEntries.length;

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
        <Container maxWidth="xl" sx={{ py: 2, height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column' }}>
          {/* Header Section */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {guardSelectedSite?.name || 'Dashboard'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  {user?.username} • Currently On Site: <strong>{guardCurrentOccupancy}</strong> vehicles
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<ExitToApp />}
                  onClick={() => setManualExitDialogOpen(true)}
                  size="small"
                >
                  Manual Exit
                </Button>
                {jobSites.length > 1 && (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Job Site</InputLabel>
                    <Select
                      value={guardSelectedSiteId}
                      onChange={(e) => {
                        const newSiteId = e.target.value;
                        setGuardSelectedSiteId(newSiteId);
                        loadOnSiteEntries(newSiteId);
                      }}
                      label="Job Site"
                    >
                      {jobSites
                        .filter((site) => user?.role === 'admin' || user?.job_site_access?.includes(site.id))
                        .map((site) => (
                          <MenuItem key={site.id} value={site.id}>
                            {site.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Box>
          </Box>

          {/* Quick Actions Section */}
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => navigate('/reports')}
                sx={{
                  borderColor: '#ffd700',
                  color: '#ffd700',
                  '&:hover': {
                    borderColor: '#ffed4e',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  },
                }}
                size="small"
              >
                Reports
              </Button>
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={() => navigate('/audit-logs')}
                sx={{
                  borderColor: '#ffd700',
                  color: '#ffd700',
                  '&:hover': {
                    borderColor: '#ffed4e',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  },
                }}
                size="small"
              >
                Audit Logs
              </Button>
            </Box>
          </Box>

          {/* Mobile: Tabbed Interface */}
          {isMobile ? (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Tabs value={mobileTab} onChange={(_, newValue) => setMobileTab(newValue)} sx={{ mb: 2, flexShrink: 0 }}>
                <Tab label="Log Entry" />
                <Tab label={`On Site (${guardCurrentOccupancy})`} />
              </Tabs>
              <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
                {mobileTab === 0 ? (
                  <QuickEntryForm
                    jobSiteId={guardSelectedSiteId}
                    onEntryCreated={handleEntryCreated}
                  />
                ) : (
                  <OnSiteVehiclesList
                    entries={onSiteEntries}
                    loading={onSiteLoading}
                    error={onSiteError}
                    onExit={handleExit}
                  />
                )}
              </Box>
            </Box>
          ) : (
            /* Desktop: Split-Screen Layout */
            <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
              {/* Left Column: Entry Form (40%) */}
              <Grid item xs={12} md={4.8} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: '100%' }}>
                <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                  <QuickEntryForm
                    jobSiteId={guardSelectedSiteId}
                    onEntryCreated={handleEntryCreated}
                  />
                </Box>
              </Grid>

              {/* Right Column: On-Site List (60%) */}
              <Grid item xs={12} md={7.2} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: '100%' }}>
                <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                  <OnSiteVehiclesList
                    entries={onSiteEntries}
                    loading={onSiteLoading}
                    error={onSiteError}
                    onExit={handleExit}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </Container>

        {/* Manual Exit Dialog */}
        <Dialog
          open={manualExitDialogOpen}
          onClose={() => {
            setManualExitDialogOpen(false);
            setManualExitError(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Log Manual Exit</DialogTitle>
          <DialogContent>
            {manualExitError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setManualExitError(null)}>
                {manualExitError}
              </Alert>
            )}
            {guardSelectedSiteId && (
              <ManualExitForm
                jobSiteId={guardSelectedSiteId}
                onSubmit={handleManualExit}
                onCancel={() => {
                  setManualExitDialogOpen(false);
                  setManualExitError(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={!!manualExitSuccess}
          autoHideDuration={5000}
          onClose={() => setManualExitSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setManualExitSuccess(null)} severity="success" sx={{ width: '100%' }}>
            {manualExitSuccess}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // Client Dashboard View
  if (user?.role === 'client') {
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
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {/* Header Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              {selectedSite?.name || 'Dashboard'}
            </Typography>
            {dashboardData && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  Last updated: {formatLastUpdated(dashboardData.lastUpdated)}
                </Typography>
                {dashboardLoading && (
                  <CircularProgress size={12} sx={{ color: '#ffd700' }} />
                )}
              </Box>
            )}
          </Box>

          {/* Error State */}
          {dashboardError && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: '#2a1a1a',
                border: '1px solid #ff4444',
                color: '#ff6666',
                '& .MuiAlert-icon': { color: '#ff4444' },
              }}
            >
              {dashboardError instanceof Error ? dashboardError.message : 'Failed to load dashboard data'}
            </Alert>
          )}

          {/* Summary Cards */}
          {dashboardLoading ? (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rectangular" height={140} sx={{ borderRadius: '8px' }} />
                </Grid>
              ))}
            </Grid>
          ) : dashboardData ? (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardSummaryCard
                  title="On Site Now"
                  value={dashboardData.currentOccupancy}
                  subtitle="vehicles currently on site"
                  icon={<DirectionsCar />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardSummaryCard
                  title="Today's Entries"
                  value={dashboardData.todayEntries}
                  subtitle="entries logged today"
                  icon={<LoginIcon />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardSummaryCard
                  title="Today's Exits"
                  value={dashboardData.todayExits}
                  subtitle="exits logged today"
                  icon={<LogoutIcon />}
                  color="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DashboardSummaryCard
                  title="Active Alerts"
                  value={dashboardData.activeAlerts}
                  subtitle="alerts today"
                  icon={<Warning />}
                  color={dashboardData.activeAlerts > 0 ? 'error' : 'default'}
                />
              </Grid>
            </Grid>
          ) : null}

          {/* Recent Activity Section */}
          {dashboardLoading ? (
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '8px', mb: 3 }} />
          ) : dashboardData ? (
            <Box sx={{ mb: 3 }}>
              <RecentActivityList
                entries={dashboardData.recentEntries}
                onViewAll={() => navigate('/audit-logs')}
              />
            </Box>
          ) : null}

          {/* Quick Actions Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.875rem' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                onClick={() => navigate('/reports')}
                sx={{
                  borderColor: '#ffd700',
                  color: '#ffd700',
                  '&:hover': {
                    borderColor: '#ffed4e',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  },
                }}
              >
                View Full Reports
              </Button>
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={() => navigate('/audit-logs')}
                sx={{
                  borderColor: '#ffd700',
                  color: '#ffd700',
                  '&:hover': {
                    borderColor: '#ffed4e',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  },
                }}
              >
                View Audit Logs
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  // Existing Dashboard View (for guards, admins, etc.)
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

