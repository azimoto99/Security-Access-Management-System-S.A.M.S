import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  ExitToApp,
  Translate,
  Logout,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  emergencyService,
  type EmergencyMode,
  type CreateEmergencyModeData,
} from '../services/emergencyService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { useWebSocket } from '../hooks/useWebSocket';

export const EmergencyManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { logout } = useAuth();
  const [activeEmergencyModes, setActiveEmergencyModes] = useState<EmergencyMode[]>([]);
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [bulkExitDialogOpen, setBulkExitDialogOpen] = useState(false);
  const [selectedEmergencyMode, setSelectedEmergencyMode] = useState<EmergencyMode | null>(null);
  const [formData, setFormData] = useState<CreateEmergencyModeData>({
    job_site_id: '',
    reason: '',
  });
  const [summaryReport, setSummaryReport] = useState('');
  const [selectedJobSiteForExit, setSelectedJobSiteForExit] = useState('');

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === 'emergency_mode') {
      loadActiveEmergencyModes();
      if (selectedEmergencyMode) {
        loadOccupancy(selectedEmergencyMode.job_site_id);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [emergencyModes, jobSitesData] = await Promise.all([
        emergencyService.getActiveEmergencyModes(),
        jobSiteService.getAllJobSites(true),
      ]);
      setActiveEmergencyModes(emergencyModes);
      setJobSites(jobSitesData);
    } catch (err: any) {
      setError(err.message || t('emergencyManagement.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const loadActiveEmergencyModes = async () => {
    try {
      const modes = await emergencyService.getActiveEmergencyModes();
      setActiveEmergencyModes(modes);
    } catch (err: any) {
      console.error('Failed to load emergency modes:', err);
    }
  };

  const loadOccupancy = async (jobSiteId?: string) => {
    try {
      const data = await emergencyService.getEmergencyOccupancy(jobSiteId);
      setOccupancy(data.occupancy || data.occupancies);
    } catch (err: any) {
      console.error('Failed to load occupancy:', err);
    }
  };

  const handleActivate = async () => {
    try {
      setError(null);
      const data: CreateEmergencyModeData = {
        job_site_id: formData.job_site_id || undefined,
        reason: formData.reason || undefined,
      };
      await emergencyService.activateEmergencyMode(data);
      setSuccess(t('emergencyManagement.emergencyActivated'));
      setActivateDialogOpen(false);
      setFormData({ job_site_id: '', reason: '' });
      await loadData();
    } catch (err: any) {
      setError(err.message || t('emergencyManagement.failedToActivate'));
    }
  };

  const handleDeactivate = async () => {
    if (!selectedEmergencyMode) return;

    try {
      setError(null);
      await emergencyService.deactivateEmergencyMode(selectedEmergencyMode.id, summaryReport);
      setSuccess(t('emergencyManagement.emergencyDeactivated'));
      setDeactivateDialogOpen(false);
      setSelectedEmergencyMode(null);
      setSummaryReport('');
      await loadData();
    } catch (err: any) {
      setError(err.message || t('emergencyManagement.failedToDeactivate'));
    }
  };

  const handleBulkExit = async () => {
    if (!selectedEmergencyMode || !selectedJobSiteForExit) return;

    try {
      setError(null);
      await emergencyService.processBulkExit({
        emergency_mode_id: selectedEmergencyMode.id,
        job_site_id: selectedJobSiteForExit,
      });
      setSuccess(t('emergencyManagement.bulkExitProcessed'));
      setBulkExitDialogOpen(false);
      setSelectedJobSiteForExit('');
      await loadOccupancy(selectedEmergencyMode.job_site_id);
    } catch (err: any) {
      setError(err.message || t('emergencyManagement.failedToProcessBulkExit'));
    }
  };

  const handleSelectEmergencyMode = (mode: EmergencyMode) => {
    setSelectedEmergencyMode(mode);
    loadOccupancy(mode.job_site_id);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const hasActiveEmergency = activeEmergencyModes.length > 0;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color={hasActiveEmergency ? 'error' : 'primary'}>
        <Toolbar>
          <Warning sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('emergencyManagement.title')}
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
          {!hasActiveEmergency && (
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => setActivateDialogOpen(true)}
              startIcon={<Warning />}
            >
              {t('emergencyManagement.activateEmergency')}
            </Button>
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
        {hasActiveEmergency && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('emergencyManagement.activeEmergencies')}
            </Typography>
            <Typography variant="body2">
              {t('emergencyManagement.normalEntryDisabled')}
            </Typography>
          </Alert>
        )}

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

        {hasActiveEmergency ? (
          <Grid container spacing={3}>
            {activeEmergencyModes.map((mode) => (
              <Grid item xs={12} key={mode.id}>
                <Card sx={{ border: '2px solid', borderColor: 'error.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h5" gutterBottom color="error">
                          {t('emergencyManagement.activeEmergencies')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {mode.job_site_name || t('emergencyManagement.allJobSites')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('emergencyManagement.activatedBy')} {mode.activated_by_username} {t('common.at')}{' '}
                          {new Date(mode.activated_at).toLocaleString()}
                        </Typography>
                        {mode.reason && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>{t('emergencyManagement.reason')}:</strong> {mode.reason}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                          setSelectedEmergencyMode(mode);
                          setDeactivateDialogOpen(true);
                        }}
                        startIcon={<CheckCircle />}
                      >
                        {t('emergencyManagement.deactivateEmergency')}
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => handleSelectEmergencyMode(mode)}
                        startIcon={<ExitToApp />}
                      >
                        {t('emergencyManagement.viewOccupancy')}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          setSelectedEmergencyMode(mode);
                          setBulkExitDialogOpen(true);
                        }}
                        startIcon={<ExitToApp />}
                      >
                        {t('emergencyManagement.bulkExit')}
                      </Button>
                    </Box>

                    {selectedEmergencyMode?.id === mode.id && occupancy && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          {t('emergencyManagement.currentOccupancy')}
                        </Typography>
                        {Array.isArray(occupancy) ? (
                          <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>{t('emergencyManagement.jobSite')}</TableCell>
                                  <TableCell align="right">{t('common.vehicles')}</TableCell>
                                  <TableCell align="right">{t('common.visitors')}</TableCell>
                                  <TableCell align="right">{t('common.trucks')}</TableCell>
                                  <TableCell align="right">{t('common.total')}</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {occupancy.map((occ: any) => (
                                  <TableRow key={occ.job_site_id}>
                                    <TableCell>{occ.job_site_name}</TableCell>
                                    <TableCell align="right">{occ.counts.vehicles}</TableCell>
                                    <TableCell align="right">{occ.counts.visitors}</TableCell>
                                    <TableCell align="right">{occ.counts.trucks}</TableCell>
                                    <TableCell align="right">{occ.counts.total}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Paper sx={{ p: 2, mt: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                  {t('common.vehicles')}
                                </Typography>
                                <Typography variant="h6">{occupancy.counts.vehicles}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                  {t('common.visitors')}
                                </Typography>
                                <Typography variant="h6">{occupancy.counts.visitors}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                  {t('common.trucks')}
                                </Typography>
                                <Typography variant="h6">{occupancy.counts.trucks}</Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h6" align="center" gutterBottom>
                {t('emergencyManagement.noActiveEmergency')}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                {t('emergencyManagement.canBeActivated')}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Activate Emergency Mode Dialog */}
        <Dialog open={activateDialogOpen} onClose={() => setActivateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('emergencyManagement.activateEmergency')}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('emergencyManagement.jobSite')} ({t('common.optional')})</InputLabel>
                <Select
                  value={formData.job_site_id}
                  onChange={(e) => setFormData({ ...formData, job_site_id: e.target.value })}
                  label={`${t('emergencyManagement.jobSite')} (${t('common.optional')})`}
                >
                  <MenuItem value="">{t('emergencyManagement.allJobSites')}</MenuItem>
                  {jobSites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label={`${t('emergencyManagement.reason')} (${t('common.optional')})`}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                multiline
                rows={3}
                helperText={t('emergencyManagement.reasonHelper')}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActivateDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleActivate} variant="contained" color="error">
              {t('emergencyManagement.activate')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Deactivate Emergency Mode Dialog */}
        <Dialog open={deactivateDialogOpen} onClose={() => setDeactivateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{t('emergencyManagement.deactivateEmergency')}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label={`${t('emergencyManagement.summaryReport')} (${t('common.optional')})`}
                value={summaryReport}
                onChange={(e) => setSummaryReport(e.target.value)}
                multiline
                rows={6}
                helperText={t('emergencyManagement.summaryReportHelper')}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeactivateDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleDeactivate} variant="contained" color="success">
              {t('emergencyManagement.deactivate')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Exit Dialog */}
        <Dialog open={bulkExitDialogOpen} onClose={() => setBulkExitDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('emergencyManagement.processBulkExit')}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('emergencyManagement.bulkExitWarning')}
              </Alert>
              <FormControl fullWidth>
                <InputLabel>{t('emergencyManagement.jobSite')}</InputLabel>
                <Select
                  value={selectedJobSiteForExit}
                  onChange={(e) => setSelectedJobSiteForExit(e.target.value)}
                  label={t('emergencyManagement.jobSite')}
                >
                  {jobSites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkExitDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleBulkExit} variant="contained" color="error" disabled={!selectedJobSiteForExit}>
              {t('emergencyManagement.processBulkExit')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};


