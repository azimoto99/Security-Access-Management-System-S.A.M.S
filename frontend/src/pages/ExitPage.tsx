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
import { Add, Translate } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { entryService, type Entry } from '../services/entryService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { useAuth } from '../contexts/AuthContext';
import type { EntryType } from '../types/entry';
import { ManualExitForm } from '../components/ManualExitForm';

export const ExitPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
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
      setError(err.message || t('exit.failedToLoadJobSites'));
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
      setError(err.message || t('exit.failedToLoadEntries'));
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
      setError(err.message || t('exit.failedToProcess'));
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
      setSuccess(t('exit.manualExitSuccess', { entryId: entry.id.substring(0, 8) }));
      await loadActiveEntries();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || t('exit.failedToLogManualExit'));
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
            {t('exit.title')}
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
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              {t('exit.processExits')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setManualExitDialog(true)}
              disabled={!selectedJobSiteId}
            >
              {t('exit.logManualExit')}
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
              <InputLabel>{t('exit.selectJobSite')}</InputLabel>
              <Select
                value={selectedJobSiteId}
                onChange={(e) => setSelectedJobSiteId(e.target.value)}
                label={t('exit.selectJobSite')}
                required
                displayEmpty
              >
                {!selectedJobSiteId && (
                  <MenuItem value="" disabled>
                    <em>{t('exit.chooseJobSite')}</em>
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
                  ? t('exit.selectJobSiteDescription')
                  : t('exit.selectJobSiteDescriptionClient')}
              </Typography>
            </FormControl>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={entryType}
              onChange={(_e, newValue) => setEntryType(newValue)}
            >
              <Tab label={t('exit.all')} value="all" />
              <Tab label={t('exit.vehicles')} value="vehicle" />
              <Tab label={t('exit.visitors')} value="visitor" />
              <Tab label={t('exit.trucks')} value="truck" />
            </Tabs>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder={t('exit.searchPlaceholder')}
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
                  <TableCell>{t('exit.type')}</TableCell>
                  <TableCell>{t('exit.details')}</TableCell>
                  <TableCell>{t('exit.entryTime')}</TableCell>
                  <TableCell>{t('exit.duration')}</TableCell>
                  <TableCell align="right">{t('exit.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {entries.length === 0
                        ? t('exit.noActiveEntries')
                        : t('exit.noEntriesMatch')}
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
                          {t('exit.processExit')}
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
        <DialogTitle>{t('exit.logManualExitTitle')}</DialogTitle>
        <DialogContent>
          {selectedJobSiteId ? (
            <ManualExitForm
              jobSiteId={selectedJobSiteId}
              onSubmit={handleManualExit}
              onCancel={() => setManualExitDialog(false)}
            />
          ) : (
            <Alert severity="warning">{t('exit.selectJobSiteFirst')}</Alert>
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
        <DialogTitle>{t('exit.processExitTitle')}</DialogTitle>
        <DialogContent>
          {exitDialog && (
            <>
              <Typography variant="body1" gutterBottom>
                <strong>{t('exit.typeLabel')}</strong> {exitDialog.entry_type}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>{t('exit.detailsLabel')}</strong> {getEntryDisplayName(exitDialog)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>{t('exit.entryTimeLabel')}</strong> {exitDialog.entry_time ? new Date(exitDialog.entry_time).toLocaleString() : 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>{t('exit.durationLabel')}</strong> {formatDuration(exitDialog)}
              </Typography>
              {exitDialog.entry_type === 'truck' && (
                <>
                  <Typography variant="body2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                    <strong>{t('exit.entryTrailer')}</strong> {exitDialog.entry_data.trailer_number || 'None'}
                  </Typography>
                  <TextField
                    fullWidth
                    label={t('exit.exitTrailerNumber')}
                    value={exitTrailerNumber}
                    onChange={(e) => setExitTrailerNumber(e.target.value)}
                    placeholder={t('exit.exitTrailerPlaceholder')}
                    sx={{ mt: 1 }}
                    helperText={t('exit.exitTrailerHelper')}
                  />
                </>
              )}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant={useOverride ? 'contained' : 'outlined'}
                  onClick={() => setUseOverride(!useOverride)}
                  size="small"
                >
                  {t('exit.manualOverride')}
                </Button>
              </Box>
              {useOverride && (
                <TextField
                  fullWidth
                  label={t('exit.overrideReason')}
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
            {t('common.cancel')}
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
            {processing ? t('exit.processing') : t('exit.confirmExit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};



