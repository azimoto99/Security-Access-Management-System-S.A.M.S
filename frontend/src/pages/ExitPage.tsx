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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
} from '@mui/material';
import { entryService, Entry } from '../services/entryService';
import { jobSiteService, JobSite } from '../services/jobSiteService';
import { useAuth } from '../contexts/AuthContext';
import { EntryType } from '../types/entry';

export const ExitPage: React.FC = () => {
  const { user } = useAuth();
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [selectedJobSiteId, setSelectedJobSiteId] = useState<string>('');
  const [entryType, setEntryType] = useState<EntryType | 'all'>('all');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitDialog, setExitDialog] = useState<Entry | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [useOverride, setUseOverride] = useState(false);

  useEffect(() => {
    loadJobSites();
  }, []);

  useEffect(() => {
    if (selectedJobSiteId) {
      loadActiveEntries();
    }
  }, [selectedJobSiteId, entryType]);

  const loadJobSites = async () => {
    try {
      setLoading(true);
      const sites = await jobSiteService.getAllJobSites(true);
      setJobSites(sites);

      if (sites.length > 0 && user) {
        if (user.role === 'admin') {
          setSelectedJobSiteId(sites[0].id);
        } else {
          const accessibleSite = sites.find((site) =>
            user.job_site_access?.includes(site.id)
          );
          if (accessibleSite) {
            setSelectedJobSiteId(accessibleSite.id);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job sites');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const activeEntries = await entryService.getActiveEntries(
        selectedJobSiteId,
        entryType === 'all' ? undefined : entryType
      );
      setEntries(activeEntries);
    } catch (err: any) {
      setError(err.message || 'Failed to load active entries');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async (entry: Entry, override = false) => {
    try {
      setProcessing(true);
      setError(null);

      await entryService.processExit({
        entry_id: entry.id,
        override,
        override_reason: override ? overrideReason : undefined,
      });

      setExitDialog(null);
      setOverrideReason('');
      setUseOverride(false);
      await loadActiveEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to process exit');
    } finally {
      setProcessing(false);
    }
  };

  const formatDuration = (entry: Entry): string => {
    const entryTime = new Date(entry.entry_time);
    const now = new Date();
    const diffMs = now.getTime() - entryTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getEntryDisplayName = (entry: Entry): string => {
    const data = entry.entry_data;
    if (entry.entry_type === 'vehicle' || entry.entry_type === 'truck') {
      return `${data.license_plate} - ${data.driver_name}`;
    } else {
      return `${data.name}${data.company ? ` (${data.company})` : ''}`;
    }
  };

  if (loading && entries.length === 0) {
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
            Exit Processing
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Process Exits
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Job Site: {jobSites.find((s) => s.id === selectedJobSiteId)?.name || 'Not selected'}
            </Typography>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={entryType}
              onChange={(e, newValue) => setEntryType(newValue)}
            >
              <Tab label="All" value="all" />
              <Tab label="Vehicles" value="vehicle" />
              <Tab label="Visitors" value="visitor" />
              <Tab label="Trucks" value="truck" />
            </Tabs>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Entry Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No active entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Chip label={entry.entry_type} size="small" />
                      </TableCell>
                      <TableCell>{getEntryDisplayName(entry)}</TableCell>
                      <TableCell>
                        {new Date(entry.entry_time).toLocaleString()}
                      </TableCell>
                      <TableCell>{formatDuration(entry)}</TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => setExitDialog(entry)}
                        >
                          Process Exit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      {/* Exit Confirmation Dialog */}
      <Dialog open={!!exitDialog} onClose={() => setExitDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Exit</DialogTitle>
        <DialogContent>
          {exitDialog && (
            <>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong> {exitDialog.entry_type}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Details:</strong> {getEntryDisplayName(exitDialog)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Entry Time:</strong> {new Date(exitDialog.entry_time).toLocaleString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Duration:</strong> {formatDuration(exitDialog)}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant={useOverride ? 'contained' : 'outlined'}
                  onClick={() => setUseOverride(!useOverride)}
                  size="small"
                >
                  Manual Override
                </Button>
              </Box>
              {useOverride && (
                <TextField
                  fullWidth
                  label="Override Reason"
                  multiline
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  sx={{ mt: 2 }}
                  required
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExitDialog(null)}>Cancel</Button>
          <Button
            onClick={() => exitDialog && handleExit(exitDialog, useOverride)}
            variant="contained"
            disabled={processing || (useOverride && !overrideReason.trim())}
          >
            {processing ? 'Processing...' : 'Confirm Exit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};



