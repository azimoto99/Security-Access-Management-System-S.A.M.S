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
  Alert,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Badge,
} from '@mui/material';
import {
  Logout,
  Business,
  Login,
  DirectionsCar,
  Warning,
  Notifications,
  Search,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { adminDashboardService } from '../services/adminDashboardService';
import { AdminMetricCard } from '../components/AdminMetricCard';
import { SiteStatusGrid } from '../components/SiteStatusGrid';
import { RecentActivityFeed } from '../components/RecentActivityFeed';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { SecurityAlertsPanel } from '../components/SecurityAlertsPanel';
import { QuickActionsPanel } from '../components/QuickActionsPanel';

export const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobSiteFilter, setJobSiteFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['adminDashboard', 'metrics'],
    queryFn: () => adminDashboardService.getMetrics(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000,
  });

  // Fetch sites status
  const { data: sitesStatus, isLoading: sitesLoading } = useQuery({
    queryKey: ['adminDashboard', 'sitesStatus'],
    queryFn: () => adminDashboardService.getSitesStatus(),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch recent activity
  const { data: recentActivityData, isLoading: activityLoading } = useQuery({
    queryKey: ['adminDashboard', 'recentActivity'],
    queryFn: () => adminDashboardService.getRecentActivity(20, 0),
    refetchInterval: 15000, // More frequent for activity
    staleTime: 5000,
  });
  
  const recentActivity = recentActivityData?.activities || [];
  const recentActivityHasMore = recentActivityData?.hasMore ?? false;

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['adminDashboard', 'analytics', dateFilter],
    queryFn: () => adminDashboardService.getAnalytics(dateFilter),
    staleTime: 30000,
  });

  // Fetch active alerts
  const { data: activeAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['adminDashboard', 'alerts'],
    queryFn: () => adminDashboardService.getActiveAlerts(),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // WebSocket for real-time updates
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'entry:created' || message.type === 'entry:updated') {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    }
  }, [queryClient]);

  useWebSocket(handleWebSocketMessage);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filter sites based on search and filters
  const filteredSites = sitesStatus?.filter((site) => {
    if (searchTerm && !site.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (jobSiteFilter !== 'all' && site.id !== jobSiteFilter) {
      return false;
    }
    if (statusFilter !== 'all' && site.status !== statusFilter) {
      return false;
    }
    return true;
  }) || [];

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
            Shield Canine Services - Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              {currentTime.toLocaleString()}
            </Typography>
            <Badge badgeContent={activeAlerts?.length || 0} color="error">
              <Notifications sx={{ color: '#ffd700' }} />
            </Badge>
          </Box>
          <Chip
            label={`${user?.username} (Admin)`}
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

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Filters Section */}
        <Card sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Job Site</InputLabel>
              <Select
                value={jobSiteFilter}
                onChange={(e) => setJobSiteFilter(e.target.value)}
                label="Job Site"
              >
                <MenuItem value="all">All Sites</MenuItem>
                {sitesStatus?.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="quiet">Quiet</MenuItem>
                <MenuItem value="alert">Alert</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'today' | 'week' | 'month')}
                label="Period"
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Card>

        {/* Error Display */}
        {metricsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load dashboard data. Please refresh the page.
          </Alert>
        )}

        {/* Key Metrics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AdminMetricCard
              title="Active Sites"
              value={metrics?.activeSites || 0}
              subtitle={`of ${metrics?.totalSites || 0} total sites`}
              icon={<Business />}
              color="info"
              loading={metricsLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminMetricCard
              title="Total Entries Today"
              value={metrics?.todayEntries || 0}
              subtitle={metrics?.entriesChange ? `${metrics.entriesChange > 0 ? '+' : ''}${metrics.entriesChange}% vs yesterday` : 'No data'}
              icon={<Login />}
              color="success"
              loading={metricsLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminMetricCard
              title="Currently On Site"
              value={metrics?.currentOccupancy || 0}
              subtitle="across all sites"
              icon={<DirectionsCar />}
              color="secondary"
              loading={metricsLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminMetricCard
              title="Active Alerts"
              value={metrics?.activeAlerts || 0}
              subtitle="requiring attention"
              icon={<Warning />}
              color={metrics?.activeAlerts && metrics.activeAlerts > 0 ? 'error' : 'default'}
              loading={metricsLoading}
              onClick={() => navigate('/alerts')}
            />
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Sites Status and Recent Activity */}
          <Grid item xs={12} lg={8}>
            <SiteStatusGrid
              sites={filteredSites}
              loading={sitesLoading}
              onSiteClick={(siteId) => navigate(`/job-sites/${siteId}`)}
            />

            <Box sx={{ mt: 3 }}>
              <RecentActivityFeed
                activities={recentActivity || []}
                loading={activityLoading}
                onActivityClick={(entryId) => navigate(`/search?entry_id=${entryId}`)}
                initialHasMore={recentActivityHasMore}
              />
            </Box>
          </Grid>

          {/* Right Column - Alerts, Charts, Client Usage, Quick Actions */}
          <Grid item xs={12} lg={4}>
            <SecurityAlertsPanel
              alerts={activeAlerts || []}
              loading={alertsLoading}
              onAlertClick={(alertId) => navigate(`/alerts?id=${alertId}`)}
            />

            <Box sx={{ mt: 3 }}>
              <AnalyticsCharts
                data={analytics}
                loading={analyticsLoading}
                period={dateFilter}
                onPeriodChange={setDateFilter}
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <QuickActionsPanel />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

