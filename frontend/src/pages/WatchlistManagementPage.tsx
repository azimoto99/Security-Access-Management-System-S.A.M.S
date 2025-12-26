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
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Snackbar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Edit,
  Add,
  Delete,
  MoreVert,
  Translate,
  Logout,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  watchlistService,
  type WatchlistEntry,
  type CreateWatchlistData,
  type UpdateWatchlistData,
} from '../services/watchlistService';
import { WatchlistForm } from '../components/WatchlistForm';

export const WatchlistManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WatchlistEntry | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<WatchlistEntry | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadEntries();
  }, [activeOnly]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await watchlistService.getAllEntries(activeOnly);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || t('watchlistManagement.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setOpenDialog(true);
  };

  const handleEdit = (entry: WatchlistEntry) => {
    setEditingEntry(entry);
    setOpenDialog(true);
    setAnchorEl(null);
    setSelectedEntry(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, entry: WatchlistEntry) => {
    setAnchorEl(event.currentTarget);
    setSelectedEntry(entry);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEntry(null);
  };

  const handleSave = async (data: CreateWatchlistData | UpdateWatchlistData) => {
    try {
      setError(null);
      if (editingEntry) {
        await watchlistService.updateEntry(editingEntry.id, data as UpdateWatchlistData);
        setSuccess(t('watchlistManagement.entryUpdated'));
      } else {
        await watchlistService.createEntry(data as CreateWatchlistData);
        setSuccess(t('watchlistManagement.entryCreated'));
      }
      setOpenDialog(false);
      setEditingEntry(null);
      await loadEntries();
    } catch (err: any) {
      setError(err.message || t('watchlistManagement.failedToSave'));
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;

    try {
      setError(null);
      await watchlistService.deleteEntry(selectedEntry.id);
      setSuccess(t('watchlistManagement.entryDeleted'));
      handleMenuClose();
      await loadEntries();
    } catch (err: any) {
      setError(err.message || t('watchlistManagement.failedToDelete'));
      handleMenuClose();
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
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
            {t('watchlistManagement.title')}
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
            {t('watchlistManagement.watchlist')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
              }
              label={t('watchlistManagement.activeOnly')}
            />
            {isAdmin && (
              <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
                {t('watchlistManagement.addEntry')}
              </Button>
            )}
          </Box>
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
                <TableCell>{t('watchlistManagement.type')}</TableCell>
                <TableCell>{t('watchlistManagement.identifier')}</TableCell>
                <TableCell>{t('watchlistManagement.reason')}</TableCell>
                <TableCell>{t('watchlistManagement.alertLevel')}</TableCell>
                <TableCell>{t('watchlistManagement.status')}</TableCell>
                <TableCell>{t('watchlistManagement.createdBy')}</TableCell>
                <TableCell>{t('watchlistManagement.created')}</TableCell>
                {isAdmin && <TableCell align="right">{t('watchlistManagement.actions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} align="center">
                    {t('watchlistManagement.noEntriesFound')}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Chip
                        label={entry.type === 'person' ? t('watchlistManagement.person') : t('watchlistManagement.vehicle')}
                        size="small"
                        color={entry.type === 'person' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {entry.identifier}
                      </Typography>
                    </TableCell>
                    <TableCell>{entry.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={entry.alert_level.toUpperCase()}
                        color={getAlertLevelColor(entry.alert_level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.is_active ? t('watchlistManagement.active') : t('watchlistManagement.inactive')}
                        color={entry.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{entry.created_by_username || '-'}</TableCell>
                    <TableCell>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, entry)}
                        >
                          <MoreVert />
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
          <DialogTitle>{editingEntry ? t('watchlistManagement.editEntry') : t('watchlistManagement.addWatchlistEntry')}</DialogTitle>
          <DialogContent>
            <WatchlistForm
              entry={editingEntry}
              onSubmit={handleSave}
              onCancel={() => {
                setOpenDialog(false);
                setEditingEntry(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Actions Menu */}
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleMenuClose}>
          <MenuItem onClick={() => selectedEntry && handleEdit(selectedEntry)}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            {t('watchlistManagement.edit')}
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            {t('watchlistManagement.delete')}
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};



