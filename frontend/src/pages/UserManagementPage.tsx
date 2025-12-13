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
  Menu,
  MenuItem,
  Snackbar,
  TextField,
} from '@mui/material';
import {
  Edit,
  Add,
  CheckCircle,
  Cancel,
  LockReset,
  MoreVert,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  userService,
  type User,
  type CreateUserData,
  type UpdateUserData,
} from '../services/userService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { UserForm } from '../components/UserForm';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, jobSitesData] = await Promise.all([
        userService.getAllUsers(),
        jobSiteService.getAllJobSites(),
      ]);
      setUsers(usersData);
      setJobSites(jobSitesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setOpenDialog(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setOpenDialog(true);
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleSave = async (data: CreateUserData | UpdateUserData) => {
    try {
      setError(null);
      if (editingUser) {
        await userService.updateUser(editingUser.id, data as UpdateUserData);
        setSuccess('User updated successfully');
      } else {
        await userService.createUser(data as CreateUserData);
        setSuccess('User created successfully');
      }
      setOpenDialog(false);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      setError(null);
      if (user.is_active) {
        await userService.deactivateUser(user.id);
        setSuccess('User deactivated successfully');
      } else {
        await userService.activateUser(user.id);
        setSuccess('User activated successfully');
      }
      handleMenuClose();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      const result = await userService.resetUserPassword(selectedUser.id);
      setTempPassword(result.temporary_password);
      setPasswordDialogOpen(true);
      handleMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      handleMenuClose();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'guard':
        return 'primary';
      case 'employee':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getOnboardingStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
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
            User Management
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Users
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
            Create User
          </Button>
        </Box>

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
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Job Site Access</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Onboarding Status</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                    </TableCell>
                    <TableCell>
                      {user.job_site_access && user.job_site_access.length > 0 ? (
                        <Chip
                          label={`${user.job_site_access.length} site(s)`}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{user.employee_id || '-'}</TableCell>
                    <TableCell>
                      {user.onboarding_status ? (
                        <Chip
                          label={user.onboarding_status.replace('_', ' ')}
                          color={getOnboardingStatusColor(user.onboarding_status)}
                          size="small"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user)}
                        disabled={user.id === currentUser?.id}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogContent>
            <UserForm
              user={editingUser}
              jobSites={jobSites}
              onSubmit={handleSave}
              onCancel={() => {
                setOpenDialog(false);
                setEditingUser(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Actions Menu */}
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleMenuClose}>
          <MenuItem onClick={() => selectedUser && handleEdit(selectedUser)}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
          <MenuItem
            onClick={() => selectedUser && handleToggleActive(selectedUser)}
            disabled={selectedUser?.id === currentUser?.id}
          >
            {selectedUser?.is_active ? (
              <>
                <Cancel sx={{ mr: 1 }} fontSize="small" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle sx={{ mr: 1 }} fontSize="small" />
                Activate
              </>
            )}
          </MenuItem>
          <MenuItem onClick={handleResetPassword}>
            <LockReset sx={{ mr: 1 }} fontSize="small" />
            Reset Password
          </MenuItem>
        </Menu>

        {/* Temporary Password Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
          <DialogTitle>Password Reset Successful</DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 2 }}>
              A temporary password has been generated. Please copy it now as it will not be shown again.
            </Alert>
            <TextField
              fullWidth
              label="Temporary Password"
              value={tempPassword || ''}
              InputProps={{
                readOnly: true,
              }}
              helperText="Copy this password and share it securely with the user"
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (tempPassword) {
                  navigator.clipboard.writeText(tempPassword);
                  setSuccess('Password copied to clipboard');
                }
              }}
            >
              Copy
            </Button>
            <Button onClick={() => setPasswordDialogOpen(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};



