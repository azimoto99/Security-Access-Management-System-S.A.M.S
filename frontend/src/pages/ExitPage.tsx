import React, { useState, useEffect, useMemo } from 'react';
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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Add } from '@mui/icons-material';
import { entryService, type Entry } from '../services/entryService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { useAuth } from '../contexts/AuthContext';
import type { EntryType } from '../types/entry';
import { ManualExitForm } from '../components/ManualExitForm';

export const ExitPage: React.FC = () => {
  const { user } = useAuth();
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [selectedJobSiteId, setSelectedJobSiteId] = useState<string>('');
  const [entryType, setEntryType] = useState<EntryType | 'all'>('all');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exitDialog, setExitDialog] = useState<Entry | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [useOverride, setUseOverride] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualExitDialog, setManualExitDialog] = useState(false);
  const [exitTrailerNumber, setExitTrailerNumber] = useState('');

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
        trailer_number: entry.entry_type === 'truck' && exitTrailerNumber.trim() ? exitTrailerNumber.trim() : undefined,
      });

      setExitDialog(null);
      setOverrideReason('');
      setUseOverride(false);
      setExitTrailerNumber('');
      await loadActiveEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to process exit');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualExit = async (data: any) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const entry = await entryService.createManualExit(data);

      setManualExitDialog(false);
      setSuccess(`✓ Manual exit logged successfully! Entry ID: ${entry.id.substring(0, 8)}...`);
      await loadActiveEntries();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to log manual exit');
    } finally {
      setProcessing(false);
    }
  };

  const formatDuration = (entry: Entry): string => {
    if (!entry.entry_time) return 'N/A';
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

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) {
      return entries;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return entries.filter((entry) => {
      const data = entry.entry_data;
      
      if (entry.entry_type === 'vehicle' || entry.entry_type === 'truck') {
        // Search in license plate and driver name
        const licensePlate = (data.license_plate || '').toLowerCase();
        const driverName = (data.driver_name || '').toLowerCase();
        return licensePlate.includes(searchLower) || driverName.includes(searchLower);
      } else {
        // Search in visitor name and company
        const name = (data.name || '').toLowerCase();
        const company = (data.company || '').toLowerCase();
        return name.includes(searchLower) || company.includes(searchLower);
      }
    });
  }, [entries, searchTerm]);

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Process Exits
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setManualExitDialog(true)}
              disabled={!selectedJobSiteId}
            >
              Log Manual Exit
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth sx={{ maxWidth: 500 }}>
              <InputLabel>Select Job Site</InputLabel>
              <Select
                value={selectedJobSiteId}
                onChange={(e) => setSelectedJobSiteId(e.target.value)}
                label="Select Job Site"
                required
                displayEmpty
              >
                {!selectedJobSiteId && (
                  <MenuItem value="" disabled>
                    <em>Choose a job site to view entries</em>
                  </MenuItem>
                )}
                {user?.role === 'admin'
                  ? jobSites.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))
                  : jobSites
                      .filter((site) => user?.job_site_access?.includes(site.id))
                      .map((site) => (
                        <MenuItem key={site.id} value={site.id}>
                          {site.name}
                        </MenuItem>
                      ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {user?.role === 'admin'
                  ? 'Select any job site to view and process exits'
                  : 'Select a job site to view and process exits for entries you have access to'}
              </Typography>
            </FormControl>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={entryType}
              onChange={(_e, newValue) => setEntryType(newValue)}
            >
              <Tab label="All" value="all" />
              <Tab label="Vehicles" value="vehicle" />
              <Tab label="Visitors" value="visitor" />
              <Tab label="Trucks" value="truck" />
            </Tabs>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search by license plate, driver name, visitor name, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 600 }}
            />
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
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {entries.length === 0
                        ? 'No active entries found'
                        : 'No entries match your search'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Chip label={entry.entry_type} size="small" />
                      </TableCell>
                      <TableCell>{getEntryDisplayName(entry)}</TableCell>
                      <TableCell>
                        {entry.entry_time ? new Date(entry.entry_time).toLocaleString() : 'N/A'}
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

      {/* Manual Exit Dialog */}
      <Dialog
        open={manualExitDialog}
        onClose={() => setManualExitDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Log Manual Exit</DialogTitle>
        <DialogContent>
          {selectedJobSiteId ? (
            <ManualExitForm
              jobSiteId={selectedJobSiteId}
              onSubmit={handleManualExit}
              onCancel={() => setManualExitDialog(false)}
            />
          ) : (
            <Alert severity="warning">Please select a job site first</Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog 
        open={!!exitDialog} 
        onClose={processing ? undefined : () => {
          setExitDialog(null);
          setExitTrailerNumber('');
          setOverrideReason('');
          setUseOverride(false);
        }} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown={processing}
      >
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
                <strong>Entry Time:</strong> {exitDialog.entry_time ? new Date(exitDialog.entry_time).toLocaleString() : 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Duration:</strong> {formatDuration(exitDialog)}
              </Typography>
              {exitDialog.entry_type === 'truck' && (
                <>
                  <Typography variant="body2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                    <strong>Entry Trailer:</strong> {exitDialog.entry_data.trailer_number || 'None'}
                  </Typography>
                  <TextField
                    fullWidth
                    label="Exit Trailer Number (Optional)"
                    value={exitTrailerNumber}
                    onChange={(e) => setExitTrailerNumber(e.target.value)}
                    placeholder="Enter trailer number if different from entry"
                    sx={{ mt: 1 }}
                    helperText="Leave blank if same as entry trailer"
                  />
                </>
              )}
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
          <Button 
            onClick={() => {
              if (!processing) {
                setExitDialog(null);
                setExitTrailerNumber('');
                setOverrideReason('');
                setUseOverride(false);
              }
            }}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (exitDialog && !processing) {
                handleExit(exitDialog, useOverride);
              }
            }}
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



