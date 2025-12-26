import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
} from '@mui/material';
import {
  Description,
  CheckCircle,
  Pending,
  Error,
  Download,
  Edit,
  Translate,
  Logout,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  hrDocumentService,
  type DocumentAssignment,
} from '../services/hrDocumentService';
import { AppBar, Toolbar } from '@mui/material';

export const OnboardingDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { logout } = useAuth();
  const [assignments, setAssignments] = useState<DocumentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hrDocumentService.getEmployeeAssignments();
      setAssignments(data);
    } catch (err: any) {
      setError(err.message || t('onboardingDashboard.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (assignment: DocumentAssignment) => {
    try {
      setError(null);
      const { signing_url } = await hrDocumentService.initiateSigning(assignment.id);
      
      // Open DocuSign in a popup window
      const width = 800;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        signing_url,
        'DocuSign',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        setError(t('onboardingDashboard.allowPopups'));
        return;
      }

      // Poll for signing completion
      const checkStatus = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(checkStatus);
            // Refresh assignments after popup closes
            await loadAssignments();
            setSuccess(t('onboardingDashboard.documentSigningCompleted'));
          } else {
            // Check if signing is complete by polling the status
            const status = await hrDocumentService.getSigningStatus(assignment.id);
            if (status && status.docusign_envelope_status === 'completed') {
              clearInterval(checkStatus);
              popup.close();
              await loadAssignments();
              setSuccess(t('onboardingDashboard.documentSigned'));
            }
          }
        } catch (err) {
          // Ignore errors during polling
        }
      }, 2000); // Check every 2 seconds

      // Cleanup interval after 10 minutes
      setTimeout(() => {
        clearInterval(checkStatus);
        if (!popup.closed) {
          popup.close();
        }
      }, 600000);
    } catch (err: any) {
      setError(err.message || t('onboardingDashboard.failedToInitiateSigning'));
    }
  };

  const handleDownload = async (assignment: DocumentAssignment) => {
    try {
      setError(null);
      const blob = await hrDocumentService.downloadDocument(assignment.document_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = assignment.document_title || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || t('onboardingDashboard.failedToDownload'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'declined':
      case 'expired':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'declined':
      case 'expired':
        return <Error />;
      default:
        return <Pending />;
    }
  };

  const pendingCount = assignments.filter((a) => a.status === 'pending').length;
  const completedCount = assignments.filter((a) => a.status === 'completed').length;

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
            {t('onboardingDashboard.title')}
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
        <Typography variant="h4" component="h1" gutterBottom>
          {t('onboardingDashboard.myDocuments')}
        </Typography>

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

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('onboardingDashboard.myDocuments')}
              </Typography>
              <Typography variant="h4">{assignments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('onboardingDashboard.pending')}
              </Typography>
              <Typography variant="h4" color="warning.main">
                {pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('onboardingDashboard.completed')}
              </Typography>
              <Typography variant="h4" color="success.main">
                {completedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Documents Table */}
      <TableContainer component={Paper}>
        <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('onboardingDashboard.document')}</TableCell>
                <TableCell>{t('onboardingDashboard.status')}</TableCell>
                <TableCell>{t('onboardingDashboard.assignedDate')}</TableCell>
                <TableCell>{t('onboardingDashboard.dueDate')}</TableCell>
                <TableCell align="right">{t('onboardingDashboard.actions')}</TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {t('onboardingDashboard.noAssignments')}
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description />
                      <Typography variant="body2" fontWeight="bold">
                        {assignment.document_title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(assignment.status)}
                      label={assignment.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(assignment.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.assigned_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {assignment.due_date
                      ? new Date(assignment.due_date).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownload(assignment)}
                      sx={{ mr: 1 }}
                    >
                      {t('onboardingDashboard.download')}
                    </Button>
                    {(assignment.status === 'pending' || assignment.status === 'in_progress') && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => handleSign(assignment)}
                      >
                        {assignment.status === 'in_progress' ? t('onboardingDashboard.continueSigning') : t('onboardingDashboard.sign')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Container>
    </Box>
  );
};


