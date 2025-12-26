import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Pagination,
  Card,
  CardContent,
} from '@mui/material';
import { Search, Visibility, Clear, Edit, Delete, Translate } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { entryService, type Entry } from '../services/entryService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { useAuth } from '../contexts/AuthContext';
import type { EntryType, EntryStatus } from '../types/entry';
import { PhotoGallery } from '../components/PhotoGallery';
import { EntryForm } from '../components/EntryForm';

export const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [jobSiteId, setJobSiteId] = useState<string>('');
  const [entryType, setEntryType] = useState<EntryType | ''>('');
  const [status, setStatus] = useState<EntryStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [entries, setEntries] = useState<Entry[]>([]);
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadJobSites();
  }, []);

  const loadJobSites = async () => {
    try {
      const sites = await jobSiteService.getAllJobSites(true);
      const accessibleSites =
        user?.role === 'admin'
          ? sites
          : sites.filter((site) => user?.job_site_access?.includes(site.id));
      setJobSites(accessibleSites);
    } catch (err) {
      console.error('Failed to load job sites:', err);
    }
  };

  const handleSearch = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: pageNum.toString(),
        limit: '20',
      };

      if (searchTerm) {
        params.search_term = searchTerm;
      } else {
        if (licensePlate) params.license_plate = licensePlate;
        if (name) params.name = name;
        if (company) params.company = company;
      }

      if (jobSiteId) params.job_site_id = jobSiteId;
      if (entryType) params.entry_type = entryType;
      if (status) params.status = status;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await entryService.searchEntries(params as any);
      setEntries(response.entries || []);
      setPage(response.pagination?.page || 1);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || t('search.searchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setLicensePlate('');
    setName('');
    setCompany('');
    setJobSiteId('');
    setEntryType('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setEntries([]);
    setPage(1);
    setTotalPages(1);
    setTotal(0);
    setError(null);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    handleSearch(value);
  };

  const getEntryDisplayName = (entry: Entry): string => {
    const data = entry.entry_data;
    if (entry.entry_type === 'vehicle' || entry.entry_type === 'truck') {
      return `${data.license_plate || 'N/A'} - ${data.driver_name || 'N/A'}`;
    } else {
      return `${data.name || 'N/A'}${data.company ? ` (${data.company})` : ''}`;
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleUpdateEntry = async (entryId: string, data: any) => {
    try {
      setProcessing(true);
      setError(null);
      // Format data for update (only send changed fields)
      const updateData: any = {};
      if (data.job_site_id && data.job_site_id !== editEntry?.job_site_id) {
        updateData.job_site_id = data.job_site_id;
      }
      if (data.entry_type && data.entry_type !== editEntry?.entry_type) {
        updateData.entry_type = data.entry_type;
      }
      if (data.entry_data) {
        updateData.entry_data = data.entry_data;
      }
      if (data.photos !== undefined) {
        updateData.photos = data.photos;
      }
      await entryService.updateEntry(entryId, updateData);
      setEditEntry(null);
      await handleSearch(page); // Refresh the list
    } catch (err: any) {
      setError(err.message || t('search.failedToUpdate'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntryId) return;
    try {
      setProcessing(true);
      setError(null);
      await entryService.deleteEntry(deleteEntryId);
      setDeleteEntryId(null);
      await handleSearch(page); // Refresh the list
    } catch (err: any) {
      setError(err.message || t('search.failedToDelete'));
    } finally {
      setProcessing(false);
    }
  };

  const highlightText = (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} style={{ backgroundColor: '#ffeb3b', padding: '0 2px' }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('search.title')}
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
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('search.title')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('search.quickSearch')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(1);
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => handleSearch(1)}>
                      <Search />
                    </IconButton>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                {t('search.advancedFilters')}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('search.licensePlate')}
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('search.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('search.company')}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('search.jobSite')}</InputLabel>
                <Select
                  value={jobSiteId}
                  onChange={(e) => setJobSiteId(e.target.value)}
                  label={t('search.jobSite')}
                >
                  <MenuItem value="">{t('search.all')}</MenuItem>
                  {jobSites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('search.entryType')}</InputLabel>
                <Select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as EntryType | '')}
                  label={t('search.entryType')}
                >
                  <MenuItem value="">{t('search.all')}</MenuItem>
                  <MenuItem value="vehicle">{t('reports.vehicles')}</MenuItem>
                  <MenuItem value="visitor">{t('reports.visitors')}</MenuItem>
                  <MenuItem value="truck">{t('reports.trucks')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('search.status')}</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EntryStatus | '')}
                  label={t('search.status')}
                >
                  <MenuItem value="">{t('search.all')}</MenuItem>
                  <MenuItem value="active">{t('search.active')}</MenuItem>
                  <MenuItem value="exited">{t('search.exited')}</MenuItem>
                  <MenuItem value="emergency_exit">{t('search.emergencyExit')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('search.dateFrom')}
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('search.dateTo')}
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={() => handleSearch(1)} startIcon={<Search />}>
                  {t('search.search')}
                </Button>
                <Button variant="outlined" onClick={handleClear} startIcon={<Clear />}>
                  {t('search.clear')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : entries.length === 0 && total === 0 ? (
          <Alert severity="info">
            {t('search.noEntriesFound')}
          </Alert>
        ) : (
          <>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('search.foundResults', { count: total })}
              </Typography>
            </Paper>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('search.type')}</TableCell>
                    <TableCell>{t('search.details')}</TableCell>
                    <TableCell>{t('search.jobSite')}</TableCell>
                    <TableCell>{t('search.entryTime')}</TableCell>
                    <TableCell>{t('search.status')}</TableCell>
                    <TableCell align="right">{t('search.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      sx={{
                        backgroundColor: entry.status === 'active' ? 'action.hover' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Chip label={entry.entry_type} size="small" />
                      </TableCell>
                      <TableCell>
                        {searchTerm
                          ? highlightText(getEntryDisplayName(entry), searchTerm)
                          : getEntryDisplayName(entry)}
                      </TableCell>
                      <TableCell>{(entry as any).job_site_name || 'N/A'}</TableCell>
                      <TableCell>{formatDate(entry.entry_time)}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          color={
                            entry.status === 'active'
                              ? 'success'
                              : entry.status === 'emergency_exit'
                              ? 'error'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedEntry(entry)}
                          color="primary"
                          title={t('search.entryDetails')}
                        >
                          <Visibility />
                        </IconButton>
                        {(user?.role === 'admin' || user?.role === 'guard') && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => setEditEntry(entry)}
                              color="primary"
                              title={t('search.editEntry')}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setDeleteEntryId(entry.id)}
                              color="error"
                              title={t('search.deleteEntry')}
                            >
                              <Delete />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Entry Detail Dialog */}
      <Dialog
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('search.entryDetails')}</DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.type')}
                  </Typography>
                  <Typography variant="body1">
                    <Chip label={selectedEntry.entry_type} size="small" />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.status')}
                  </Typography>
                  <Typography variant="body1">
                    <Chip
                      label={selectedEntry.status}
                      color={
                        selectedEntry.status === 'active'
                          ? 'success'
                          : selectedEntry.status === 'emergency_exit'
                          ? 'error'
                          : 'default'
                      }
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.jobSite')}
                  </Typography>
                  <Typography variant="body1">
                    {(selectedEntry as any).job_site_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.entryTime')}
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedEntry.entry_time)}</Typography>
                </Grid>
                {selectedEntry.exit_time && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('search.exitTime')}
                    </Typography>
                    <Typography variant="body1">{formatDate(selectedEntry.exit_time)}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('search.guard')}
                  </Typography>
                  <Typography variant="body1">
                    {(selectedEntry as any).guard_username || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('search.entryData')}
                      </Typography>
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(selectedEntry.entry_data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </Grid>
                {selectedEntry.photos && selectedEntry.photos.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('search.photos')}
                    </Typography>
                    <PhotoGallery entryId={selectedEntry.id} allowDelete={false} />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEntry(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Entry Dialog */}
      {editEntry && (
        <Dialog
          open={!!editEntry}
          onClose={() => !processing && setEditEntry(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{t('search.editEntry')}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <EntryForm
                entryType={editEntry.entry_type}
                jobSiteId={editEntry.job_site_id}
                initialData={editEntry.entry_data}
                onSubmit={(data) => handleUpdateEntry(editEntry.id, data)}
                onCancel={() => setEditEntry(null)}
                entryId={editEntry.id}
              />
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteEntryId}
        onClose={() => !processing && setDeleteEntryId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('search.deleteEntry')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('search.deleteConfirm')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteEntryId(null)} disabled={processing}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleDeleteEntry}
            color="error"
            variant="contained"
            disabled={processing}
          >
            {processing ? t('search.deleting') : t('search.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};



