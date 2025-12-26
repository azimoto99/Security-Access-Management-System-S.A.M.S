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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  userService,
  type User,
  type CreateUserData,
  type UpdateUserData,
} from '../services/userService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { UserForm } from '../components/UserForm';
import { Translate, Logout } from '@mui/icons-material';

export const UserManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user: currentUser, logout } = useAuth();
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
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
      setError(err.message || t('userManagement.failedToLoad'));
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
        setSuccess(t('userManagement.userUpdated'));
      } else {
        await userService.createUser(data as CreateUserData);
        setSuccess(t('userManagement.userCreated'));
      }
      setOpenDialog(false);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || t('userManagement.failedToSave'));
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      setError(null);
      if (user.is_active) {
        await userService.deactivateUser(user.id);
        setSuccess(t('userManagement.userDeactivated'));
      } else {
        await userService.activateUser(user.id);
        setSuccess(t('userManagement.userActivated'));
      }
      handleMenuClose();
      await loadData();
    } catch (err: any) {
      setError(err.message || t('userManagement.failedToUpdateStatus'));
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
      setError(err.message || t('userManagement.failedToResetPassword'));
      handleMenuClose();
    }
  };

  const handleChangePassword = () => {
    if (!selectedUser) return;
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setChangePasswordDialogOpen(true);
    handleMenuClose();
  };

  const handleChangePasswordSubmit = async () => {
    if (!selectedUser) return;

    // Validate passwords
    if (!newPassword || newPassword.length < 8) {
      setPasswordError(t('userManagement.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('userManagement.passwordsDoNotMatch'));
      return;
    }

    try {
      setError(null);
      setPasswordError(null);
      await userService.changeUserPassword(selectedUser.id, newPassword);
      setSuccess(t('userManagement.passwordChanged'));
      setChangePasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || t('userManagement.failedToChangePassword'));
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
            {t('userManagement.title')}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {t('userManagement.users')}
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
            {t('userManagement.createUser')}
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
                <TableCell>{t('userManagement.username')}</TableCell>
                <TableCell>{t('userManagement.role')}</TableCell>
                <TableCell>{t('userManagement.jobSiteAccess')}</TableCell>
                <TableCell>{t('userManagement.employeeId')}</TableCell>
                <TableCell>{t('userManagement.onboardingStatus')}</TableCell>
                <TableCell>{t('userManagement.status')}</TableCell>
                <TableCell>{t('userManagement.created')}</TableCell>
                <TableCell align="right">{t('userManagement.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {t('userManagement.noUsersFound')}
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
                          label={`${user.job_site_access.length} ${t('userManagement.sites')}`}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t('userManagement.none')}
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
                        label={user.is_active ? t('userManagement.active') : t('userManagement.inactive')}
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
          <DialogTitle>{editingUser ? t('userManagement.editUser') : t('userManagement.createUser')}</DialogTitle>
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
            {t('userManagement.edit')}
          </MenuItem>
          <MenuItem
            onClick={() => selectedUser && handleToggleActive(selectedUser)}
            disabled={selectedUser?.id === currentUser?.id}
          >
            {selectedUser?.is_active ? (
              <>
                <Cancel sx={{ mr: 1 }} fontSize="small" />
                {t('userManagement.deactivate')}
              </>
            ) : (
              <>
                <CheckCircle sx={{ mr: 1 }} fontSize="small" />
                {t('userManagement.activate')}
              </>
            )}
          </MenuItem>
          <MenuItem onClick={handleChangePassword}>
            <LockReset sx={{ mr: 1 }} fontSize="small" />
            {t('userManagement.changePassword')}
          </MenuItem>
          <MenuItem onClick={handleResetPassword}>
            <LockReset sx={{ mr: 1 }} fontSize="small" />
            {t('userManagement.resetPassword')}
          </MenuItem>
        </Menu>

        {/* Change Password Dialog */}
        <Dialog open={changePasswordDialogOpen} onClose={() => setChangePasswordDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('userManagement.changePasswordFor', { username: selectedUser?.username })}</DialogTitle>
          <DialogContent>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError(null)}>
                {passwordError}
              </Alert>
            )}
            <TextField
              fullWidth
              label={t('userManagement.newPassword')}
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError(null);
              }}
              margin="normal"
              required
              helperText={t('userManagement.passwordMinLength')}
              autoFocus
            />
            <TextField
              fullWidth
              label={t('userManagement.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError(null);
              }}
              margin="normal"
              required
              error={!!passwordError && confirmPassword !== ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChangePasswordDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleChangePasswordSubmit}
              variant="contained"
              disabled={!newPassword || !confirmPassword || newPassword.length < 8}
            >
              {t('userManagement.changePassword')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Temporary Password Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
          <DialogTitle>{t('userManagement.passwordResetSuccess')}</DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('userManagement.tempPasswordGenerated')}
            </Alert>
            <TextField
              fullWidth
              label={t('userManagement.temporaryPassword')}
              value={tempPassword || ''}
              InputProps={{
                readOnly: true,
              }}
              helperText={t('userManagement.copyPasswordHelper')}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (tempPassword) {
                  navigator.clipboard.writeText(tempPassword);
                  setSuccess(t('userManagement.passwordCopied'));
                }
              }}
            >
              {t('userManagement.copy')}
            </Button>
            <Button onClick={() => setPasswordDialogOpen(false)} variant="contained">
              {t('userManagement.close')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};



