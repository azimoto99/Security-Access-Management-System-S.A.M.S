import React, { useState, useEffect } from 'react';
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
  TextField,
  Button,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Pagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Clear, Download, PictureAsPdf, Translate } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { auditLogService, type AuditLog, type AuditLogFilters } from '../services/auditLogService';
import { entryService, type Entry } from '../services/entryService';
import { PhotoGallery } from '../components/PhotoGallery';
import { generateAuditLogsPDF } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';

export const AuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  // Available resource types in the system
  const RESOURCE_TYPES = [
    { value: 'entry', label: t('auditLogs.entry') },
    { value: 'job_site', label: t('auditLogs.jobSite') },
    { value: 'user', label: t('auditLogs.user') },
    { value: 'watchlist', label: t('auditLogs.watchlist') },
    { value: 'hr_document', label: t('auditLogs.hrDocument') },
    { value: 'document_assignment', label: t('auditLogs.documentAssignment') },
    { value: 'emergency_mode', label: t('auditLogs.emergencyMode') },
  ];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [relatedEntry, setRelatedEntry] = useState<Entry | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Set default resource type to 'entry' for clients when user is loaded
  useEffect(() => {
    if (user) {
      if (user.role === 'client' && !filters.resource_type) {
        // Set default filter for clients
        setFilters((prev) => ({
          ...prev,
          resource_type: 'entry',
        }));
        // Mark as initialized after setting filter
        setFiltersInitialized(true);
      } else if (user.role !== 'client') {
        // For non-clients, mark as initialized immediately
        setFiltersInitialized(true);
      }
    }
  }, [user]);

  useEffect(() => {
    // Only load logs after filters are properly initialized
    if (filtersInitialized) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, filtersInitialized]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await auditLogService.getAuditLogs(filters);
      setLogs(result.logs);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || t('auditLogs.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
      page: 1, // Reset to first page on filter change
    }));
    setPage(1);
  };

  const handleClear = () => {
    const clearedFilters: AuditLogFilters = {
      page: 1,
      limit: 50,
      ...(user?.role === 'client' ? { resource_type: 'entry' } : {}),
    };
    setFilters(clearedFilters);
    setPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    setFilters((prev) => ({ ...prev, page: value }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await auditLogService.exportAuditLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || t('auditLogs.failedToExport'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      // Load all logs for PDF (or use current page logs)
      const allLogs = logs; // You could fetch all logs here if needed
      const doc = generateAuditLogsPDF(allLogs, filters);
      doc.save(`audit-logs-${Date.now()}.pdf`);
    } catch (err: any) {
      setError(err.message || t('auditLogs.failedToExportPDF'));
    } finally {
      setExportingPDF(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewDetails = async (log: AuditLog) => {
    setSelectedLog(log);
    setRelatedEntry(null);
    
    // If this log is related to an entry, fetch the entry to show photos
    if (log.resource_type === 'entry' && log.resource_id) {
      try {
        setLoadingEntry(true);
        const entry = await entryService.getEntryById(log.resource_id);
        setRelatedEntry(entry);
      } catch (err) {
        console.error('Failed to load entry:', err);
        // Don't show error to user, just continue without entry data
      } finally {
        setLoadingEntry(false);
      }
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('auditLogs.title')}
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">{t('auditLogs.title')}</Typography>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={exporting || exportingPDF}
              sx={{ mr: 1 }}
            >
              {exporting ? t('reports.exporting') : t('auditLogs.exportCSV')}
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdf />}
              onClick={handleExportPDF}
              disabled={exporting || exportingPDF}
            >
              {exportingPDF ? t('reports.exporting') : t('auditLogs.exportPDF')}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label={t('auditLogs.action')}
              value={filters.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t('auditLogs.resourceType')}</InputLabel>
              <Select
                value={filters.resource_type || ''}
                label={t('auditLogs.resourceType')}
                onChange={(e) => handleFilterChange('resource_type', e.target.value || undefined)}
              >
                <MenuItem value="">
                  <em>{t('auditLogs.allTypes')}</em>
                </MenuItem>
                {RESOURCE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('auditLogs.dateFrom')}
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t('auditLogs.dateTo')}
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="outlined" startIcon={<Clear />} onClick={handleClear}>
              {t('auditLogs.clear')}
            </Button>
          </Box>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Alert severity="info">{t('auditLogs.noLogsFound')}</Alert>
        ) : (
          <>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('auditLogs.foundLogs', { count: total })}
              </Typography>
            </Paper>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('auditLogs.timestamp')}</TableCell>
                    <TableCell>{t('auditLogs.user')}</TableCell>
                    <TableCell>{t('auditLogs.action')}</TableCell>
                    <TableCell>{t('auditLogs.resourceType')}</TableCell>
                    <TableCell>{t('auditLogs.resourceId')}</TableCell>
                    <TableCell align="right">{t('auditLogs.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell>{log.username || log.user_id}</TableCell>
                      <TableCell>
                        <Chip label={log.action} size="small" />
                      </TableCell>
                      <TableCell>{log.resource_type}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {log.resource_id.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleViewDetails(log)}>
                          {t('auditLogs.viewDetails')}
                        </Button>
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

      {/* Log Detail Dialog */}
      <Dialog
        open={!!selectedLog}
        onClose={() => {
          setSelectedLog(null);
          setRelatedEntry(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('auditLogs.logDetails')}</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('auditLogs.timestamp')}
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedLog.timestamp)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('auditLogs.user')}
                  </Typography>
                  <Typography variant="body1">{selectedLog.username || selectedLog.user_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('auditLogs.action')}
                  </Typography>
                  <Typography variant="body1">
                    <Chip label={selectedLog.action} size="small" />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    {t('auditLogs.resourceType')}
                  </Typography>
                  <Typography variant="body1">{selectedLog.resource_type}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    {t('auditLogs.resourceId')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.resource_id}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('auditLogs.details')}
                      </Typography>
                      <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </Grid>
                {selectedLog.resource_type === 'entry' && (
                  <Grid item xs={12}>
                    {loadingEntry ? (
                      <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : relatedEntry && relatedEntry.photos && relatedEntry.photos.length > 0 ? (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          {t('auditLogs.photos', { count: relatedEntry.photos.length })}
                        </Typography>
                        <PhotoGallery entryId={selectedLog.resource_id} allowDelete={false} />
                      </>
                    ) : relatedEntry ? (
                      <Typography variant="body2" color="text.secondary">
                        {t('auditLogs.noPhotosAvailable')}
                      </Typography>
                    ) : null}
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSelectedLog(null);
              setRelatedEntry(null);
            }}
          >
            {t('auditLogs.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

