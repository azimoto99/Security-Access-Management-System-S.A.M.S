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
  Button,
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
  Translate,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
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
            {t('adminDashboard.title')}
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
          <Button
            onClick={toggleLanguage}
            size="small"
            startIcon={<Translate fontSize="small" />}
            variant="outlined"
            sx={{
              borderColor: '#ffd700',
              color: '#ffd700',
              mr: 1,
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#ffed4e',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
              },
            }}
          >
            {language === 'en' ? 'EN' : 'ES'}
          </Button>
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
              placeholder={t('adminDashboard.searchSites')}
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
              <InputLabel>{t('adminDashboard.jobSite')}</InputLabel>
              <Select
                value={jobSiteFilter}
                onChange={(e) => setJobSiteFilter(e.target.value)}
                label={t('adminDashboard.jobSite')}
              >
                <MenuItem value="all">{t('adminDashboard.allSites')}</MenuItem>
                {sitesStatus?.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('adminDashboard.status')}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label={t('adminDashboard.status')}
              >
                <MenuItem value="all">{t('adminDashboard.allStatus')}</MenuItem>
                <MenuItem value="active">{t('adminDashboard.active')}</MenuItem>
                <MenuItem value="moderate">{t('adminDashboard.moderate')}</MenuItem>
                <MenuItem value="quiet">{t('adminDashboard.quiet')}</MenuItem>
                <MenuItem value="alert">{t('adminDashboard.alert')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('adminDashboard.period')}</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'today' | 'week' | 'month')}
                label={t('adminDashboard.period')}
              >
                <MenuItem value="today">{t('adminDashboard.today')}</MenuItem>
                <MenuItem value="week">{t('adminDashboard.thisWeek')}</MenuItem>
                <MenuItem value="month">{t('adminDashboard.thisMonth')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Card>

        {/* Error Display */}
        {metricsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {t('adminDashboard.failedToLoad')}
          </Alert>
        )}

        {/* Key Metrics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AdminMetricCard
              title={t('adminDashboard.activeSites')}
              value={metrics?.activeSites || 0}
              subtitle={t('adminDashboard.ofTotalSites', { total: metrics?.totalSites || 0 })}
              icon={<Business />}
              color="info"
              loading={metricsLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminMetricCard
              title={t('adminDashboard.totalEntriesToday')}
              value={metrics?.todayEntries || 0}
              subtitle={metrics?.entriesChange ? t('adminDashboard.vsYesterday', { change: `${metrics.entriesChange > 0 ? '+' : ''}${metrics.entriesChange}` }) : t('adminDashboard.noData')}
              icon={<Login />}
              color="success"
              loading={metricsLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminMetricCard
              title={t('adminDashboard.currentlyOnSite')}
              value={metrics?.currentOccupancy || 0}
              subtitle={t('adminDashboard.acrossAllSites')}
              icon={<DirectionsCar />}
              color="secondary"
              loading={metricsLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminMetricCard
              title={t('adminDashboard.activeAlerts')}
              value={metrics?.activeAlerts || 0}
              subtitle={t('adminDashboard.requiringAttention')}
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

