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
  Chip,
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
  History,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  emergencyService,
  EmergencyMode,
  CreateEmergencyModeData,
} from '../services/emergencyService';
import { jobSiteService, JobSite } from '../services/jobSiteService';
import { useWebSocket } from '../hooks/useWebSocket';

export const EmergencyManagementPage: React.FC = () => {
  const { user } = useAuth();
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
      setError(err.message || 'Failed to load emergency data');
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
      setSuccess('Emergency mode activated successfully');
      setActivateDialogOpen(false);
      setFormData({ job_site_id: '', reason: '' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to activate emergency mode');
    }
  };

  const handleDeactivate = async () => {
    if (!selectedEmergencyMode) return;

    try {
      setError(null);
      await emergencyService.deactivateEmergencyMode(selectedEmergencyMode.id, summaryReport);
      setSuccess('Emergency mode deactivated successfully');
      setDeactivateDialogOpen(false);
      setSelectedEmergencyMode(null);
      setSummaryReport('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate emergency mode');
    }
  };

  const handleBulkExit = async () => {
    if (!selectedEmergencyMode || !selectedJobSiteForExit) return;

    try {
      setError(null);
      const result = await emergencyService.processBulkExit({
        emergency_mode_id: selectedEmergencyMode.id,
        job_site_id: selectedJobSiteForExit,
      });
      setSuccess(`Bulk exit processed: ${result.exited_count} entries exited`);
      setBulkExitDialogOpen(false);
      setSelectedJobSiteForExit('');
      await loadOccupancy(selectedEmergencyMode.job_site_id);
    } catch (err: any) {
      setError(err.message || 'Failed to process bulk exit');
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
            Emergency Management
          </Typography>
          {!hasActiveEmergency && (
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => setActivateDialogOpen(true)}
              startIcon={<Warning />}
            >
              Activate Emergency Mode
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {hasActiveEmergency && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              EMERGENCY MODE ACTIVE
            </Typography>
            <Typography variant="body2">
              Normal entry processing is disabled. Use bulk exit to process evacuations.
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
                          Emergency Mode Active
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {mode.job_site_name || 'All Job Sites'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Activated by: {mode.activated_by_username} at{' '}
                          {new Date(mode.activated_at).toLocaleString()}
                        </Typography>
                        {mode.reason && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Reason:</strong> {mode.reason}
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
                        Deactivate
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => handleSelectEmergencyMode(mode)}
                        startIcon={<ExitToApp />}
                      >
                        View Occupancy
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
                        Bulk Exit
                      </Button>
                    </Box>

                    {selectedEmergencyMode?.id === mode.id && occupancy && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Current Occupancy
                        </Typography>
                        {Array.isArray(occupancy) ? (
                          <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Job Site</TableCell>
                                  <TableCell align="right">Vehicles</TableCell>
                                  <TableCell align="right">Visitors</TableCell>
                                  <TableCell align="right">Trucks</TableCell>
                                  <TableCell align="right">Total</TableCell>
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
                                  Vehicles
                                </Typography>
                                <Typography variant="h6">{occupancy.counts.vehicles}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Visitors
                                </Typography>
                                <Typography variant="h6">{occupancy.counts.visitors}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Trucks
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
                No Active Emergency Mode
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Emergency mode can be activated to handle evacuations or lockdowns.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Activate Emergency Mode Dialog */}
        <Dialog open={activateDialogOpen} onClose={() => setActivateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Activate Emergency Mode</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Job Site (Optional)</InputLabel>
                <Select
                  value={formData.job_site_id}
                  onChange={(e) => setFormData({ ...formData, job_site_id: e.target.value })}
                  label="Job Site (Optional)"
                >
                  <MenuItem value="">All Job Sites</MenuItem>
                  {jobSites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Reason (Optional)"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                multiline
                rows={3}
                helperText="Provide a reason for activating emergency mode"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActivateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleActivate} variant="contained" color="error">
              Activate Emergency Mode
            </Button>
          </DialogActions>
        </Dialog>

        {/* Deactivate Emergency Mode Dialog */}
        <Dialog open={deactivateDialogOpen} onClose={() => setDeactivateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Deactivate Emergency Mode</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Summary Report (Optional)"
                value={summaryReport}
                onChange={(e) => setSummaryReport(e.target.value)}
                multiline
                rows={6}
                helperText="Provide a summary of actions taken during the emergency"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeactivateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeactivate} variant="contained" color="success">
              Deactivate Emergency Mode
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Exit Dialog */}
        <Dialog open={bulkExitDialogOpen} onClose={() => setBulkExitDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Process Bulk Exit</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will exit all active entries at the selected job site. This action cannot be undone.
              </Alert>
              <FormControl fullWidth>
                <InputLabel>Job Site</InputLabel>
                <Select
                  value={selectedJobSiteForExit}
                  onChange={(e) => setSelectedJobSiteForExit(e.target.value)}
                  label="Job Site"
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
            <Button onClick={() => setBulkExitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkExit} variant="contained" color="error" disabled={!selectedJobSiteForExit}>
              Process Bulk Exit
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};


