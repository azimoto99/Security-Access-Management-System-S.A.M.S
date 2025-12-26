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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { EntryForm } from '../components/EntryForm';
import { Translate } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import type { EntryType } from '../types/entry';
import { entryService } from '../services/entryService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { useAuth } from '../contexts/AuthContext';

export const EntryPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const [entryType, setEntryType] = useState<EntryType>('vehicle');
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [selectedJobSiteId, setSelectedJobSiteId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdEntryId, setCreatedEntryId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); // Key to force form reset

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
      setError(err.message || t('entry.failedToLoadJobSites'));
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
      setError(t('entry.selectJobSite'));
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
      setSuccess(t('entry.entryLoggedSuccess', { entryId: entry.id.substring(0, 8) }));
      
      // Reset form after a delay to allow user to see success message
      setTimeout(() => {
        setSuccess(null);
        setCreatedEntryId(null);
        // Reset form by changing the key, which will remount the component
        setFormKey((prev) => prev + 1);
      }, 5000);
    } catch (err: any) {
      setError(err.message || t('entry.failedToCreate'));
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
              {t('entry.title')}
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
          maxWidth="md" 
          sx={{ 
            mt: { xs: 2, sm: 4 },
            px: { xs: 1, sm: 2, md: 3 },
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
          <Alert severity="warning">{t('entry.noActiveJobSites')}</Alert>
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
              {t('entry.title')}
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
          maxWidth="md" 
          sx={{ 
            mt: { xs: 2, sm: 4 },
            px: { xs: 1, sm: 2, md: 3 },
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
          <Alert severity="warning">{t('entry.noAccessToJobSites')}</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('entry.title')}
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
        maxWidth="md" 
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
          <Typography variant="h5" gutterBottom>
            {t('entry.logEntry')}
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
            <FormControl fullWidth>
              <InputLabel>{t('entry.jobSite')}</InputLabel>
              <Select
                value={selectedJobSiteId}
                onChange={(e) => setSelectedJobSiteId(e.target.value)}
                label={t('entry.jobSite')}
                required
              >
                {accessibleJobSites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={entryType} onChange={handleEntryTypeChange}>
              <Tab label={t('entry.vehicle')} value="vehicle" />
              <Tab label={t('entry.visitor')} value="visitor" />
              <Tab label={t('entry.truck')} value="truck" />
            </Tabs>
          </Box>

          {selectedJobSiteId && (
            <EntryForm
              key={formKey}
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

