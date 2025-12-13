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
} from '@mui/icons-material';
import {
  hrDocumentService,
  type DocumentAssignment,
} from '../services/hrDocumentService';

export const OnboardingDashboardPage: React.FC = () => {
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
      setError(err.message || 'Failed to load assignments');
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
        setError('Please allow popups to sign documents');
        return;
      }

      // Poll for signing completion
      const checkStatus = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(checkStatus);
            // Refresh assignments after popup closes
            await loadAssignments();
            setSuccess('Document signing completed. Please refresh if status has not updated.');
          } else {
            // Check if signing is complete by polling the status
            const status = await hrDocumentService.getSigningStatus(assignment.id);
            if (status && status.docusign_envelope_status === 'completed') {
              clearInterval(checkStatus);
              popup.close();
              await loadAssignments();
              setSuccess('Document signed successfully!');
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
      setError(err.message || 'Failed to initiate signing');
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
      setError(err.message || 'Failed to download document');
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Onboarding Documents
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
                Total Documents
              </Typography>
              <Typography variant="h4">{assignments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
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
                Completed
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
              <TableCell>Document</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No documents assigned
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
                      Download
                    </Button>
                    {(assignment.status === 'pending' || assignment.status === 'in_progress') && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => handleSign(assignment)}
                      >
                        {assignment.status === 'in_progress' ? 'Continue Signing' : 'Sign with DocuSign'}
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
  );
};


