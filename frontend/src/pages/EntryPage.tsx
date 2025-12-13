import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { EntryForm } from '../components/EntryForm';
import type { EntryType } from '../types/entry';
import { entryService } from '../services/entryService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { useAuth } from '../contexts/AuthContext';

export const EntryPage: React.FC = () => {
  const { user } = useAuth();
  const [entryType, setEntryType] = useState<EntryType>('vehicle');
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [selectedJobSiteId, setSelectedJobSiteId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdEntryId, setCreatedEntryId] = useState<string | null>(null);

  useEffect(() => {
    loadJobSites();
  }, []);

  const loadJobSites = async () => {
    try {
      setLoading(true);
      const sites = await jobSiteService.getAllJobSites(true); // Only active sites
      setJobSites(sites);

      // Auto-select first job site if user has access
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

  const handleEntryTypeChange = (_event: React.SyntheticEvent, newValue: EntryType) => {
    setEntryType(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    if (!selectedJobSiteId) {
      setError('Please select a job site');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const entry = await entryService.createEntry({
        entry_type: data.entry_type,
        entry_data: data.entry_data,
        job_site_id: selectedJobSiteId,
      });

      setCreatedEntryId(entry.id);
      setSuccess('Entry logged successfully! You can now upload photos if needed.');
      // Reset form after a delay
      setTimeout(() => {
        setSuccess(null);
        setCreatedEntryId(null);
        // Optionally navigate or reset form
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to create entry');
    }
  };

  const handleCancel = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (jobSites.length === 0) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Entry Logging
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="warning">No active job sites available</Alert>
        </Container>
      </Box>
    );
  }

  const accessibleJobSites =
    user?.role === 'admin'
      ? jobSites
      : jobSites.filter((site) => user?.job_site_access?.includes(site.id));

  if (accessibleJobSites.length === 0) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Entry Logging
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="warning">You don't have access to any job sites</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Entry Logging
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Log Entry
          </Typography>

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
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Job Site: {jobSites.find((s) => s.id === selectedJobSiteId)?.name || 'Not selected'}
            </Typography>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={entryType} onChange={handleEntryTypeChange}>
              <Tab label="Vehicle" value="vehicle" />
              <Tab label="Visitor" value="visitor" />
              <Tab label="Truck" value="truck" />
            </Tabs>
          </Box>

          {selectedJobSiteId && (
            <EntryForm
              entryType={entryType}
              jobSiteId={selectedJobSiteId}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              entryId={createdEntryId || undefined}
            />
          )}
        </Paper>
      </Container>
    </Box>
  );
};

