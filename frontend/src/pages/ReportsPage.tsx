import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Download, Assessment, PictureAsPdf, Translate } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { reportService, type ReportData, type ReportFilters } from '../services/reportService';
import { jobSiteService, type JobSite } from '../services/jobSiteService';
import { useAuth } from '../contexts/AuthContext';
import { generateReportPDF, generateEntriesPDF } from '../utils/pdfGenerator';
import { entryService } from '../services/entryService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    date_from: new Date().toISOString().split('T')[0], // Today
    date_to: new Date().toISOString().split('T')[0], // Today
    time_from: '00:00',
    time_to: '23:59',
  });
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingDetailed, setExportingDetailed] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingDetailedPDF, setExportingDetailedPDF] = useState(false);

  useEffect(() => {
    loadJobSites();
  }, []);

  const loadJobSites = async () => {
    try {
      const sites = await jobSiteService.getAllJobSites(true);
      setJobSites(sites);
    } catch (err) {
      console.error('Failed to load job sites:', err);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportService.generateReport(filters);
      setReport(result.report);
    } catch (err: any) {
      setError(err.message || t('reports.failedToGenerate'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await reportService.exportReport(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || t('reports.failedToExport'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportDetailed = async () => {
    try {
      setExportingDetailed(true);
      setError(null);
      const exportFilters: Record<string, any> = {
        date_from: filters.date_from,
        date_to: filters.date_to,
      };
      
      if (filters.time_from) {
        exportFilters.time_from = filters.time_from;
      }
      if (filters.time_to) {
        exportFilters.time_to = filters.time_to;
      }
      if (filters.job_site_id) {
        exportFilters.job_site_id = filters.job_site_id;
      }
      if (filters.entry_type) {
        exportFilters.entry_type = filters.entry_type;
      }

      const blob = await reportService.exportEntries(exportFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = filters.date_from === filters.date_to 
        ? filters.date_from 
        : `${filters.date_from}_to_${filters.date_to}`;
      a.download = `detailed-logs-${dateStr}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || t('reports.failedToExportDetailed'));
    } finally {
      setExportingDetailed(false);
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;
    try {
      setExportingPDF(true);
      const doc = generateReportPDF(report, filters);
      const dateStr = filters.date_from === filters.date_to 
        ? filters.date_from 
        : `${filters.date_from}_to_${filters.date_to}`;
      doc.save(`report-${dateStr}-${Date.now()}.pdf`);
    } catch (err: any) {
      setError(err.message || t('reports.failedToExportPDF'));
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportDetailedPDF = async () => {
    try {
      setExportingDetailedPDF(true);
      setError(null);
      
      // Build date filters with time if provided
      let dateFrom = filters.date_from;
      let dateTo = filters.date_to;
      
      if (filters.time_from) {
        dateFrom = `${filters.date_from} ${filters.time_from}`;
      } else {
        dateFrom = `${filters.date_from} 00:00:00`;
      }
      
      if (filters.time_to) {
        dateTo = `${filters.date_to} ${filters.time_to}`;
      } else {
        dateTo = `${filters.date_to} 23:59:59`;
      }
      
      const exportFilters: Record<string, any> = {
        date_from: dateFrom,
        date_to: dateTo,
        limit: '1000', // Request more entries for PDF export
      };
      
      if (filters.job_site_id) {
        exportFilters.job_site_id = filters.job_site_id;
      }
      if (filters.entry_type) {
        exportFilters.entry_type = filters.entry_type;
      }

      // Fetch entries for PDF
      const response = await entryService.searchEntries(exportFilters);
      
      if (!response || !response.entries || response.entries.length === 0) {
        setError(t('reports.noEntriesFound'));
        return;
      }
      
      const doc = generateEntriesPDF(response.entries, {
        ...filters,
        date_from: filters.date_from,
        date_to: filters.date_to,
      });
      const dateStr = filters.date_from === filters.date_to 
        ? filters.date_from 
        : `${filters.date_from}_to_${filters.date_to}`;
      doc.save(`detailed-logs-${dateStr}-${Date.now()}.pdf`);
    } catch (err: any) {
      setError(err.message || t('reports.failedToExportDetailedPDF'));
    } finally {
      setExportingDetailedPDF(false);
    }
  };

  const formatHour = (hour: number): string => {
    return `${hour}:00`;
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('reports.title')}
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
          <Typography variant="h5" gutterBottom>
            {t('reports.generateReport')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('reports.jobSite')}</InputLabel>
                <Select
                  value={filters.job_site_id || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, job_site_id: e.target.value || undefined })
                  }
                  label={t('reports.jobSite')}
                >
                  <MenuItem value="">{t('reports.allJobSites')}</MenuItem>
                  {(user?.role === 'admin'
                    ? jobSites
                    : jobSites.filter((site) => user?.job_site_access?.includes(site.id))
                  ).map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('reports.entryType')}</InputLabel>
                <Select
                  value={filters.entry_type || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, entry_type: (e.target.value as 'vehicle' | 'visitor' | 'truck' | undefined) || undefined })
                  }
                  label={t('reports.entryType')}
                >
                  <MenuItem value="">{t('reports.allTypes')}</MenuItem>
                  <MenuItem value="vehicle">{t('reports.vehicles')}</MenuItem>
                  <MenuItem value="visitor">{t('reports.visitors')}</MenuItem>
                  <MenuItem value="truck">{t('reports.trucks')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('reports.dateFrom')}
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('reports.dateTo')}
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('reports.timeFrom')}
                type="time"
                value={filters.time_from || '00:00'}
                onChange={(e) => setFilters({ ...filters, time_from: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('reports.timeTo')}
                type="time"
                value={filters.time_to || '23:59'}
                onChange={(e) => setFilters({ ...filters, time_to: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<Assessment />}
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? t('reports.generating') : t('reports.generateReportButton')}
                </Button>
                {report && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={handleExport}
                      disabled={exporting || exportingPDF || exportingDetailedPDF}
                    >
                      {exporting ? t('reports.exporting') : t('reports.exportSummaryCSV')}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PictureAsPdf />}
                      onClick={handleExportPDF}
                      disabled={exporting || exportingPDF || exportingDetailedPDF}
                    >
                      {exportingPDF ? t('reports.exporting') : t('reports.exportSummaryPDF')}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<Download />}
                      onClick={handleExportDetailed}
                      disabled={exporting || exportingPDF || exportingDetailed || exportingDetailedPDF}
                    >
                      {exportingDetailed ? t('reports.exporting') : t('reports.downloadDetailedLogsCSV')}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<PictureAsPdf />}
                      onClick={handleExportDetailedPDF}
                      disabled={exporting || exportingPDF || exportingDetailed || exportingDetailedPDF}
                    >
                      {exportingDetailedPDF ? t('reports.exporting') : t('reports.downloadDetailedLogsPDF')}
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{report.summary.total_entries}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('reports.totalEntries')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{report.summary.total_exits}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('reports.totalExits')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{report.summary.active_entries}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('reports.activeEntries')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{report.average_duration}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('reports.avgDuration')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('reports.entriesByType')}
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: t('reports.vehicles'), count: report.summary.by_type.vehicles },
                      { name: t('reports.visitors'), count: report.summary.by_type.visitors },
                      { name: t('reports.trucks'), count: report.summary.by_type.trucks },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('reports.peakHours')}
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={report.peak_hours.map((ph) => ({ hour: formatHour(ph.hour), count: ph.count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#dc004e" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {report.daily_breakdown.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {t('reports.dailyBreakdown')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={report.daily_breakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="entries" stroke="#1976d2" name={t('reports.entries')} />
                        <Line type="monotone" dataKey="exits" stroke="#dc004e" name={t('reports.exits')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              )}
            </Grid>

            {/* Job Site Breakdown */}
            {report.by_job_site && report.by_job_site.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t('reports.breakdownByJobSite')}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('reports.jobSiteName')}</TableCell>
                        <TableCell align="right">{t('reports.entries')}</TableCell>
                        <TableCell align="right">{t('reports.exits')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.by_job_site.map((site) => (
                        <TableRow key={site.job_site_id}>
                          <TableCell>{site.job_site_name}</TableCell>
                          <TableCell align="right">{site.entries}</TableCell>
                          <TableCell align="right">{site.exits}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        ) : (
          <Alert severity="info">{t('reports.generateReportToView')}</Alert>
        )}
      </Container>
    </Box>
  );
};



