import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CheckCircle,
  Refresh,
  Visibility,
  Add,
  Translate,
  Logout,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  alertService,
  type Alert as AlertType,
  type AlertType as AlertTypeEnum,
  type AlertSeverity,
} from '../services/alertService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';

export const AlertsPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '' as AlertTypeEnum | '',
    severity: '' as AlertSeverity | '',
    job_site_id: '',
    is_acknowledged: false,
  });
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: '' as AlertTypeEnum | '',
    severity: 'medium' as AlertSeverity,
    title: '',
    message: '',
    job_site_id: '',
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsData, jobSitesData] = await Promise.all([
        alertService.getAlerts({
          ...(filters.type && { type: filters.type }),
          ...(filters.severity && { severity: filters.severity }),
          ...(filters.job_site_id && { job_site_id: filters.job_site_id }),
          is_acknowledged: filters.is_acknowledged,
          limit: 100,
        }),
        jobSiteService.getAllJobSites(true),
      ]);
      setAlerts(alertsData.alerts);
      setTotal(alertsData.total);
      setJobSites(jobSitesData);
    } catch (err: any) {
      setError(err.message || t('alertsPage.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alert: AlertType) => {
    try {
      setError(null);
      await alertService.acknowledgeAlert(alert.id);
      setSuccess(t('alertsPage.alertAcknowledged'));
      await loadData();
    } catch (err: any) {
      setError(err.message || t('alertsPage.failedToAcknowledge'));
    }
  };

  const handleTriggerChecks = async () => {
    try {
      setError(null);
      await alertService.triggerAlertChecks();
      setSuccess(t('alertsPage.checksTriggered'));
      await loadData();
    } catch (err: any) {
      setError(err.message || t('alertsPage.failedToTrigger'));
    }
  };

  const handleViewDetails = (alert: AlertType) => {
    setSelectedAlert(alert);
    setDetailDialogOpen(true);
  };

  const handleCreateAlert = async () => {
    try {
      setError(null);
      if (!newAlert.type || !newAlert.title || !newAlert.message) {
        setError(t('alertsPage.required'));
        return;
      }
      setCreating(true);
      await alertService.createAlert({
        type: newAlert.type as AlertTypeEnum,
        severity: newAlert.severity,
        title: newAlert.title,
        message: newAlert.message,
        job_site_id: newAlert.job_site_id || undefined,
      });
      setSuccess(t('alertsPage.alertCreated'));
      setCreateDialogOpen(false);
      setNewAlert({
        type: '' as AlertTypeEnum | '',
        severity: 'medium' as AlertSeverity,
        title: '',
        message: '',
        job_site_id: '',
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || t('alertsPage.failedToCreate'));
    } finally {
      setCreating(false);
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: AlertTypeEnum) => {
    const labels: Record<AlertTypeEnum, string> = {
      overstay: t('alertsPage.overstay'),
      capacity_warning: t('alertsPage.capacityWarning'),
      watchlist_match: t('alertsPage.watchlistMatch'),
      invalid_exit: t('alertsPage.invalidExit'),
      failed_login: t('alertsPage.failedLogin'),
      account_locked: t('alertsPage.accountLocked'),
    };
    return labels[type] || type;
  };

  const unacknowledgedCount = alerts.filter((a) => !a.is_acknowledged).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && !a.is_acknowledged).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('alertsPage.title')}
          </Typography>
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
          {isAdmin && (
            <>
              <Button color="inherit" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
                {t('alertsPage.createAlert')}
              </Button>
              <Button color="inherit" startIcon={<Refresh />} onClick={handleTriggerChecks}>
                {t('alertsPage.triggerChecks')}
              </Button>
            </>
          )}
          <Button
            onClick={logout}
            color="inherit"
            startIcon={<Logout />}
            sx={{ ml: 1 }}
          >
            {t('common.logout')}
          </Button>
        </Toolbar>
      </AppBar>
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: 2, sm: 4 }, 
          mb: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2, md: 3 },
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden'
        }}
      >
        {/* Summary Cards */}
        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('alertsPage.title')}
                </Typography>
                <Typography variant="h4">{total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('alertsPage.unacknowledged')}
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {unacknowledgedCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {t('alertsPage.high')}
                </Typography>
                <Typography variant="h4" color="error.main">
                  {criticalCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('alertsPage.type')}</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as AlertTypeEnum | '' })}
                  label={t('alertsPage.type')}
                >
                  <MenuItem value="">{t('alertsPage.all')}</MenuItem>
                  <MenuItem value="overstay">{t('alertsPage.overstay')}</MenuItem>
                  <MenuItem value="capacity_warning">{t('alertsPage.capacityWarning')}</MenuItem>
                  <MenuItem value="watchlist_match">{t('alertsPage.watchlistMatch')}</MenuItem>
                  <MenuItem value="invalid_exit">{t('alertsPage.invalidExit')}</MenuItem>
                  <MenuItem value="failed_login">{t('alertsPage.failedLogin')}</MenuItem>
                  <MenuItem value="account_locked">{t('alertsPage.accountLocked')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('alertsPage.severity')}</InputLabel>
                <Select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value as AlertSeverity | '' })}
                  label={t('alertsPage.severity')}
                >
                  <MenuItem value="">{t('alertsPage.all')}</MenuItem>
                  <MenuItem value="low">{t('alertsPage.low')}</MenuItem>
                  <MenuItem value="medium">{t('alertsPage.medium')}</MenuItem>
                  <MenuItem value="high">{t('alertsPage.high')}</MenuItem>
                  <MenuItem value="critical">{t('alertsPage.high')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('alertsPage.jobSite')}</InputLabel>
                <Select
                  value={filters.job_site_id}
                  onChange={(e) => setFilters({ ...filters, job_site_id: e.target.value })}
                  label={t('alertsPage.jobSite')}
                >
                  <MenuItem value="">{t('alertsPage.allJobSites')}</MenuItem>
                  {jobSites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('alertsPage.status')}</InputLabel>
                <Select
                  value={filters.is_acknowledged ? 'acknowledged' : 'unacknowledged'}
                  onChange={(e) =>
                    setFilters({ ...filters, is_acknowledged: e.target.value === 'acknowledged' })
                  }
                  label={t('alertsPage.status')}
                >
                  <MenuItem value="unacknowledged">{t('alertsPage.unacknowledged')}</MenuItem>
                  <MenuItem value="acknowledged">{t('alertsPage.acknowledged')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess(null)}
            message={success}
          />
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('alertsPage.type')}</TableCell>
                <TableCell>{t('alertsPage.severity')}</TableCell>
                <TableCell>{t('alertsPage.title')}</TableCell>
                <TableCell>{t('alertsPage.message')}</TableCell>
                <TableCell>{t('alertsPage.status')}</TableCell>
                <TableCell>{t('common.created')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Chip label={getTypeLabel(alert.type)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.severity.toUpperCase()}
                        color={getSeverityColor(alert.severity) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{alert.title}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {alert.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.is_acknowledged ? t('alertsPage.acknowledged') : t('alertsPage.unacknowledged')}
                        color={alert.is_acknowledged ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(alert.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(alert)}
                        title={t('common.viewDetails')}
                      >
                        <Visibility />
                      </IconButton>
                      {!alert.is_acknowledged && (
                        <IconButton
                          size="small"
                          onClick={() => handleAcknowledge(alert)}
                          color="success"
                          title={t('alertsPage.acknowledge')}
                        >
                          <CheckCircle />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Alert Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{t('alertsPage.alertDetails')}</DialogTitle>
          <DialogContent>
            {selectedAlert && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t('alertsPage.type')}
                    </Typography>
                    <Typography variant="body1">{getTypeLabel(selectedAlert.type)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t('alertsPage.severity')}
                    </Typography>
                    <Chip
                      label={selectedAlert.severity.toUpperCase()}
                      color={getSeverityColor(selectedAlert.severity) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t('alertsPage.title')}
                    </Typography>
                    <Typography variant="body1">{selectedAlert.title}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t('alertsPage.message')}
                    </Typography>
                    <Typography variant="body1">{selectedAlert.message}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t('alertsPage.status')}
                    </Typography>
                    <Chip
                      label={selectedAlert.is_acknowledged ? t('alertsPage.acknowledged') : t('alertsPage.unacknowledged')}
                      color={selectedAlert.is_acknowledged ? 'success' : 'warning'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t('common.created')}
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedAlert.created_at).toLocaleString()}
                    </Typography>
                  </Grid>
                  {selectedAlert.acknowledged_at && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">
                        {t('alertsPage.acknowledged')} {t('common.at')}
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedAlert.acknowledged_at).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {Object.keys(selectedAlert.metadata || {}).length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Additional Information
                      </Typography>
                      <Paper sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(selectedAlert.metadata, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {selectedAlert && !selectedAlert.is_acknowledged && (
              <Button
                onClick={() => {
                  handleAcknowledge(selectedAlert);
                  setDetailDialogOpen(false);
                }}
                variant="contained"
                startIcon={<CheckCircle />}
              >
                {t('alertsPage.acknowledge')}
              </Button>
            )}
            <Button onClick={() => setDetailDialogOpen(false)}>{t('common.close')}</Button>
          </DialogActions>
        </Dialog>

        {/* Create Alert Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('alertsPage.createAlert')}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('alertsPage.type')}</InputLabel>
                    <Select
                      value={newAlert.type}
                      onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as AlertTypeEnum | '' })}
                      label={t('alertsPage.type')}
                    >
                      <MenuItem value="overstay">{t('alertsPage.overstay')}</MenuItem>
                      <MenuItem value="capacity_warning">{t('alertsPage.capacityWarning')}</MenuItem>
                      <MenuItem value="watchlist_match">{t('alertsPage.watchlistMatch')}</MenuItem>
                      <MenuItem value="invalid_exit">{t('alertsPage.invalidExit')}</MenuItem>
                      <MenuItem value="failed_login">{t('alertsPage.failedLogin')}</MenuItem>
                      <MenuItem value="account_locked">{t('alertsPage.accountLocked')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('alertsPage.severity')}</InputLabel>
                    <Select
                      value={newAlert.severity}
                      onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as AlertSeverity })}
                      label={t('alertsPage.severity')}
                    >
                      <MenuItem value="low">{t('alertsPage.low')}</MenuItem>
                      <MenuItem value="medium">{t('alertsPage.medium')}</MenuItem>
                      <MenuItem value="high">{t('alertsPage.high')}</MenuItem>
                      <MenuItem value="critical">{t('alertsPage.high')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('alertsPage.title')}
                    value={newAlert.title}
                    onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('alertsPage.message')}
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    multiline
                    rows={4}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>{t('alertsPage.jobSite')} ({t('common.optional')})</InputLabel>
                    <Select
                      value={newAlert.job_site_id}
                      onChange={(e) => setNewAlert({ ...newAlert, job_site_id: e.target.value })}
                      label={`${t('alertsPage.jobSite')} (${t('common.optional')})`}
                    >
                      <MenuItem value="">{t('common.none')}</MenuItem>
                      {jobSites.map((site) => (
                        <MenuItem key={site.id} value={site.id}>
                          {site.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAlert}
              variant="contained"
              disabled={creating || !newAlert.type || !newAlert.title || !newAlert.message}
            >
              {creating ? 'Creating...' : 'Create Alert'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};



