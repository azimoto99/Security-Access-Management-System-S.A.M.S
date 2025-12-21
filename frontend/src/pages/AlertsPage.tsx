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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  alertService,
  type Alert as AlertType,
  type AlertType as AlertTypeEnum,
  type AlertSeverity,
} from '../services/alertService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
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
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alert: AlertType) => {
    try {
      setError(null);
      await alertService.acknowledgeAlert(alert.id);
      setSuccess('Alert acknowledged successfully');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to acknowledge alert');
    }
  };

  const handleTriggerChecks = async () => {
    try {
      setError(null);
      await alertService.triggerAlertChecks();
      setSuccess('Alert checks triggered successfully');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger alert checks');
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
        setError('Type, title, and message are required');
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
      setSuccess('Alert created successfully');
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
      setError(err.message || 'Failed to create alert');
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
      overstay: 'Overstay',
      capacity_warning: 'Capacity Warning',
      watchlist_match: 'Watchlist Match',
      invalid_exit: 'Invalid Exit',
      failed_login: 'Failed Login',
      account_locked: 'Account Locked',
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
            Security Alerts
          </Typography>
          {isAdmin && (
            <>
              <Button color="inherit" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
                Create Alert
              </Button>
              <Button color="inherit" startIcon={<Refresh />} onClick={handleTriggerChecks}>
                Trigger Checks
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Alerts
                </Typography>
                <Typography variant="h4">{total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Unacknowledged
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
                  Critical
                </Typography>
                <Typography variant="h4" color="error.main">
                  {criticalCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as AlertTypeEnum | '' })}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="overstay">Overstay</MenuItem>
                  <MenuItem value="capacity_warning">Capacity Warning</MenuItem>
                  <MenuItem value="watchlist_match">Watchlist Match</MenuItem>
                  <MenuItem value="invalid_exit">Invalid Exit</MenuItem>
                  <MenuItem value="failed_login">Failed Login</MenuItem>
                  <MenuItem value="account_locked">Account Locked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value as AlertSeverity | '' })}
                  label="Severity"
                >
                  <MenuItem value="">All Severities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Job Site</InputLabel>
                <Select
                  value={filters.job_site_id}
                  onChange={(e) => setFilters({ ...filters, job_site_id: e.target.value })}
                  label="Job Site"
                >
                  <MenuItem value="">All Job Sites</MenuItem>
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.is_acknowledged ? 'acknowledged' : 'unacknowledged'}
                  onChange={(e) =>
                    setFilters({ ...filters, is_acknowledged: e.target.value === 'acknowledged' })
                  }
                  label="Status"
                >
                  <MenuItem value="unacknowledged">Unacknowledged</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
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
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No alerts found
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
                        label={alert.is_acknowledged ? 'Acknowledged' : 'Unacknowledged'}
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
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      {!alert.is_acknowledged && (
                        <IconButton
                          size="small"
                          onClick={() => handleAcknowledge(alert)}
                          color="success"
                          title="Acknowledge"
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
          <DialogTitle>Alert Details</DialogTitle>
          <DialogContent>
            {selectedAlert && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Type
                    </Typography>
                    <Typography variant="body1">{getTypeLabel(selectedAlert.type)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Severity
                    </Typography>
                    <Chip
                      label={selectedAlert.severity.toUpperCase()}
                      color={getSeverityColor(selectedAlert.severity) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Title
                    </Typography>
                    <Typography variant="body1">{selectedAlert.title}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Message
                    </Typography>
                    <Typography variant="body1">{selectedAlert.message}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedAlert.is_acknowledged ? 'Acknowledged' : 'Unacknowledged'}
                      color={selectedAlert.is_acknowledged ? 'success' : 'warning'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedAlert.created_at).toLocaleString()}
                    </Typography>
                  </Grid>
                  {selectedAlert.acknowledged_at && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Acknowledged At
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
                Acknowledge
              </Button>
            )}
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create Alert Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Alert</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Alert Type</InputLabel>
                    <Select
                      value={newAlert.type}
                      onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as AlertTypeEnum | '' })}
                      label="Alert Type"
                    >
                      <MenuItem value="overstay">Overstay</MenuItem>
                      <MenuItem value="capacity_warning">Capacity Warning</MenuItem>
                      <MenuItem value="watchlist_match">Watchlist Match</MenuItem>
                      <MenuItem value="invalid_exit">Invalid Exit</MenuItem>
                      <MenuItem value="failed_login">Failed Login</MenuItem>
                      <MenuItem value="account_locked">Account Locked</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Severity</InputLabel>
                    <Select
                      value={newAlert.severity}
                      onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as AlertSeverity })}
                      label="Severity"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={newAlert.title}
                    onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message"
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    multiline
                    rows={4}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Job Site (Optional)</InputLabel>
                    <Select
                      value={newAlert.job_site_id}
                      onChange={(e) => setNewAlert({ ...newAlert, job_site_id: e.target.value })}
                      label="Job Site (Optional)"
                    >
                      <MenuItem value="">None</MenuItem>
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



