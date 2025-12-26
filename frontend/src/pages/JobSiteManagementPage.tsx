import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Edit, Delete, Add, CheckCircle, Cancel, Translate, Logout } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { jobSiteService, type JobSite, type CreateJobSiteData, type UpdateJobSiteData } from '../services/jobSiteService';
import { JobSiteForm } from '../components/JobSiteForm';

export const JobSiteManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingJobSite, setEditingJobSite] = useState<JobSite | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<JobSite | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadJobSites();
  }, []);

  const loadJobSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobSiteService.getAllJobSites();
      setJobSites(data);
    } catch (err: any) {
      setError(err.message || t('jobSiteManagement.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingJobSite(null);
    setOpenDialog(true);
  };

  const handleEdit = (jobSite: JobSite) => {
    setEditingJobSite(jobSite);
    setOpenDialog(true);
  };

  const handleSave = async (data: CreateJobSiteData | UpdateJobSiteData) => {
    try {
      setError(null);
      if (editingJobSite) {
        await jobSiteService.updateJobSite(editingJobSite.id, data as UpdateJobSiteData);
      } else {
        await jobSiteService.createJobSite(data as CreateJobSiteData);
      }
      setOpenDialog(false);
      setEditingJobSite(null);
      await loadJobSites();
    } catch (err: any) {
      setError(err.message || t('jobSiteManagement.failedToSave'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setError(null);
      await jobSiteService.deleteJobSite(deleteConfirm.id);
      setDeleteConfirm(null);
      await loadJobSites();
    } catch (err: any) {
      setError(err.message || t('jobSiteManagement.failedToDelete'));
    }
  };

  const handleToggleActive = async (jobSite: JobSite) => {
    try {
      setError(null);
      if (jobSite.is_active) {
        await jobSiteService.deactivateJobSite(jobSite.id);
      } else {
        await jobSiteService.activateJobSite(jobSite.id);
      }
      await loadJobSites();
    } catch (err: any) {
      setError(err.message || t('jobSiteManagement.failedToUpdateStatus'));
    }
  };

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
            {t('jobSiteManagement.title')}
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {t('jobSiteManagement.jobSites')}
          </Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
              {t('jobSiteManagement.createJobSite')}
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('jobSiteManagement.name')}</TableCell>
                <TableCell>{t('jobSiteManagement.address')}</TableCell>
                <TableCell>{t('jobSiteManagement.vehicleCapacity')}</TableCell>
                <TableCell>{t('jobSiteManagement.visitorCapacity')}</TableCell>
                <TableCell>{t('jobSiteManagement.truckCapacity')}</TableCell>
                <TableCell>{t('jobSiteManagement.status')}</TableCell>
                {isAdmin && <TableCell align="right">{t('jobSiteManagement.actions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {jobSites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} align="center">
                    {t('jobSiteManagement.noJobSitesFound')}
                  </TableCell>
                </TableRow>
              ) : (
                jobSites.map((jobSite) => (
                  <TableRow key={jobSite.id}>
                    <TableCell>{jobSite.name}</TableCell>
                    <TableCell>{jobSite.address}</TableCell>
                    <TableCell>{jobSite.vehicle_capacity}</TableCell>
                    <TableCell>{jobSite.visitor_capacity}</TableCell>
                    <TableCell>{jobSite.truck_capacity}</TableCell>
                    <TableCell>
                      <Chip
                        label={jobSite.is_active ? t('jobSiteManagement.active') : t('jobSiteManagement.inactive')}
                        color={jobSite.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleToggleActive(jobSite)}
                          color={jobSite.is_active ? 'error' : 'success'}
                          title={jobSite.is_active ? t('jobSiteManagement.deactivate') : t('jobSiteManagement.activate')}
                        >
                          {jobSite.is_active ? <Cancel /> : <CheckCircle />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(jobSite)}
                          color="primary"
                          title={t('jobSiteManagement.edit')}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirm(jobSite)}
                          color="error"
                          title={t('jobSiteManagement.delete')}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingJobSite ? t('jobSiteManagement.editJobSite') : t('jobSiteManagement.createJobSite')}</DialogTitle>
          <DialogContent>
            <JobSiteForm
              jobSite={editingJobSite}
              onSubmit={handleSave}
              onCancel={() => {
                setOpenDialog(false);
                setEditingJobSite(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
          <DialogTitle>{t('jobSiteManagement.deleteJobSite')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('jobSiteManagement.deleteConfirm', { name: deleteConfirm?.name })}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              {t('jobSiteManagement.delete')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};



