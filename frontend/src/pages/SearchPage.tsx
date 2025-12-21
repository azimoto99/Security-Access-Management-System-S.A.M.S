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
import { Search, Visibility, Clear } from '@mui/icons-material';
import { entryService, type Entry } from '../services/entryService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { useAuth } from '../contexts/AuthContext';
import type { EntryType, EntryStatus } from '../types/entry';
import { PhotoGallery } from '../components/PhotoGallery';

export const SearchPage: React.FC = () => {
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
      setError(err.message || 'Search failed');
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
            Search Entries
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Search Entries
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quick Search (License Plate, Name, Company)"
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
                Advanced Filters
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="License Plate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Job Site</InputLabel>
                <Select
                  value={jobSiteId}
                  onChange={(e) => setJobSiteId(e.target.value)}
                  label="Job Site"
                >
                  <MenuItem value="">All</MenuItem>
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
                <InputLabel>Entry Type</InputLabel>
                <Select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as EntryType | '')}
                  label="Entry Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="vehicle">Vehicle</MenuItem>
                  <MenuItem value="visitor">Visitor</MenuItem>
                  <MenuItem value="truck">Truck</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EntryStatus | '')}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="exited">Exited</MenuItem>
                  <MenuItem value="emergency_exit">Emergency Exit</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Date From"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Date To"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={() => handleSearch(1)} startIcon={<Search />}>
                  Search
                </Button>
                <Button variant="outlined" onClick={handleClear} startIcon={<Clear />}>
                  Clear
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
            No entries found. Try adjusting your search criteria.
          </Alert>
        ) : (
          <>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Found {total} result{total !== 1 ? 's' : ''}
              </Typography>
            </Paper>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Job Site</TableCell>
                    <TableCell>Entry Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
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
                        >
                          <Visibility />
                        </IconButton>
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
        <DialogTitle>Entry Details</DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1">
                    <Chip label={selectedEntry.entry_type} size="small" />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
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
                    Job Site
                  </Typography>
                  <Typography variant="body1">
                    {(selectedEntry as any).job_site_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Entry Time
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedEntry.entry_time)}</Typography>
                </Grid>
                {selectedEntry.exit_time && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Exit Time
                    </Typography>
                    <Typography variant="body1">{formatDate(selectedEntry.exit_time)}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Guard
                  </Typography>
                  <Typography variant="body1">
                    {(selectedEntry as any).guard_username || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Entry Data
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
                      Photos
                    </Typography>
                    <PhotoGallery entryId={selectedEntry.id} allowDelete={false} />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEntry(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};



