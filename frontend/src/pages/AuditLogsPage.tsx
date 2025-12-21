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
} from '@mui/material';
import { Clear, Download, PictureAsPdf } from '@mui/icons-material';
import { auditLogService, type AuditLog, type AuditLogFilters } from '../services/auditLogService';
import { entryService, type Entry } from '../services/entryService';
import { PhotoGallery } from '../components/PhotoGallery';
import { generateAuditLogsPDF } from '../utils/pdfGenerator';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
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

  useEffect(() => {
    loadLogs();
  }, [filters]);

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
      setError(err.message || 'Failed to load audit logs');
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
    setFilters({ page: 1, limit: 50 });
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
      setError(err.message || 'Failed to export logs');
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
      setError(err.message || 'Failed to export PDF');
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
            Audit Logs
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Audit Logs</Typography>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={exporting || exportingPDF}
              sx={{ mr: 1 }}
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdf />}
              onClick={handleExportPDF}
              disabled={exporting || exportingPDF}
            >
              {exportingPDF ? 'Exporting...' : 'Export PDF'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Action"
              value={filters.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              size="small"
            />
            <TextField
              label="Resource Type"
              value={filters.resource_type || ''}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              size="small"
            />
            <TextField
              label="Date From"
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Date To"
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="outlined" startIcon={<Clear />} onClick={handleClear}>
              Clear
            </Button>
          </Box>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Alert severity="info">No audit logs found</Alert>
        ) : (
          <>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Found {total} log{total !== 1 ? 's' : ''}
              </Typography>
            </Paper>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource Type</TableCell>
                    <TableCell>Resource ID</TableCell>
                    <TableCell align="right">Actions</TableCell>
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
                          View Details
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
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedLog.timestamp)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    User
                  </Typography>
                  <Typography variant="body1">{selectedLog.username || selectedLog.user_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Action
                  </Typography>
                  <Typography variant="body1">
                    <Chip label={selectedLog.action} size="small" />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Resource Type
                  </Typography>
                  <Typography variant="body1">{selectedLog.resource_type}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Resource ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.resource_id}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Details
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
                          Photos ({relatedEntry.photos.length})
                        </Typography>
                        <PhotoGallery entryId={selectedLog.resource_id} allowDelete={false} />
                      </>
                    ) : relatedEntry ? (
                      <Typography variant="body2" color="text.secondary">
                        No photos available for this entry
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
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

