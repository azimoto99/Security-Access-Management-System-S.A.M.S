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
  TextField,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Edit, Delete, Add, CheckCircle, Cancel } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { jobSiteService, JobSite, CreateJobSiteData, UpdateJobSiteData } from '../services/jobSiteService';
import { JobSiteForm } from '../components/JobSiteForm';

export const JobSiteManagementPage: React.FC = () => {
  const { user } = useAuth();
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
      setError(err.message || 'Failed to load job sites');
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
      setError(err.message || 'Failed to save job site');
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
      setError(err.message || 'Failed to delete job site');
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
      setError(err.message || 'Failed to update job site status');
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
            Job Site Management
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Job Sites
          </Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
              Create Job Site
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
                <TableCell>Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Vehicle Capacity</TableCell>
                <TableCell>Visitor Capacity</TableCell>
                <TableCell>Truck Capacity</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {jobSites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} align="center">
                    No job sites found
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
                        label={jobSite.is_active ? 'Active' : 'Inactive'}
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
                          title={jobSite.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {jobSite.is_active ? <Cancel /> : <CheckCircle />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(jobSite)}
                          color="primary"
                          title="Edit"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirm(jobSite)}
                          color="error"
                          title="Delete"
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
          <DialogTitle>{editingJobSite ? 'Edit Job Site' : 'Create Job Site'}</DialogTitle>
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
          <DialogTitle>Delete Job Site</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{deleteConfirm?.name}"? This will deactivate the job
              site and preserve historical data.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};



