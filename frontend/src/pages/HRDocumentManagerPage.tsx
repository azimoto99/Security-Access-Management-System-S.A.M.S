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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Delete,
  Description,
  Assignment,
  Translate,
  Logout,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  hrDocumentService,
  type HRDocument,
} from '../services/hrDocumentService';
import { userService, type User } from '../services/userService';
import { AppBar, Toolbar } from '@mui/material';

export const HRDocumentManagerPage: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { logout } = useAuth();
  const [documents, setDocuments] = useState<HRDocument[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<HRDocument | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'onboarding' as 'onboarding' | 'policy' | 'contract' | 'other',
    is_required: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assignmentData, setAssignmentData] = useState({
    document_id: '',
    employee_ids: [] as string[],
    due_date: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [docsData, employeesData] = await Promise.all([
        hrDocumentService.getAllDocuments(true),
        userService.getAllUsers().then((users) => users.filter((u) => u.role === 'employee')),
      ]);
      setDocuments(docsData);
      setEmployees(employeesData);
    } catch (err: any) {
      setError(err.message || t('hrDocumentManager.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedDocument(null);
    setFormData({
      title: '',
      description: '',
      document_type: 'onboarding',
      is_required: false,
    });
    setSelectedFile(null);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (!selectedFile && !selectedDocument) {
        setError(t('hrDocumentManager.selectFile'));
        return;
      }

      if (selectedDocument) {
        // Update existing
        await hrDocumentService.updateDocument(selectedDocument.id, formData);
        setSuccess(t('hrDocumentManager.documentUpdated'));
      } else {
        // Create new
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('document_type', formData.document_type);
        formDataToSend.append('is_required', formData.is_required.toString());
        if (selectedFile) {
          formDataToSend.append('document', selectedFile);
        }

        await hrDocumentService.createDocument(formDataToSend);
        setSuccess(t('hrDocumentManager.documentCreated'));
      }

      setOpenDialog(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || t('hrDocumentManager.failedToSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('hrDocumentManager.deleteConfirm'))) {
      return;
    }

    try {
      setError(null);
      await hrDocumentService.deleteDocument(id);
      setSuccess(t('hrDocumentManager.documentDeleted'));
      await loadData();
    } catch (err: any) {
      setError(err.message || t('hrDocumentManager.failedToDelete'));
    }
  };

  const handleAssign = (document: HRDocument) => {
    setAssignmentData({
      document_id: document.id,
      employee_ids: [],
      due_date: '',
    });
    setOpenAssignmentDialog(true);
  };

  const handleBulkAssign = async () => {
    try {
      setError(null);
      if (assignmentData.employee_ids.length === 0) {
        setError(t('hrDocumentManager.selectEmployees'));
        return;
      }

      await hrDocumentService.createBulkAssignments({
        document_id: assignmentData.document_id,
        employee_ids: assignmentData.employee_ids,
        due_date: assignmentData.due_date || undefined,
      });

      setSuccess(t('hrDocumentManager.documentAssigned'));
      setOpenAssignmentDialog(false);
    } catch (err: any) {
      setError(err.message || t('hrDocumentManager.failedToAssign'));
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
            {t('hrDocumentManager.title')}
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {t('hrDocumentManager.title')}
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
            {t('hrDocumentManager.createDocument')}
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
                <TableCell>{t('hrDocumentManager.title')}</TableCell>
                <TableCell>{t('hrDocumentManager.documentType')}</TableCell>
                <TableCell>{t('hrDocumentManager.required')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('common.created')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description />
                      <Typography variant="body2" fontWeight="bold">
                        {doc.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={doc.document_type} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.is_required ? t('hrDocumentManager.required') : t('hrDocumentManager.optional')}
                      color={doc.is_required ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.is_active ? t('common.active') : t('common.inactive')}
                      color={doc.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleAssign(doc)}
                      title={t('hrDocumentManager.assignDocument')}
                    >
                      <Assignment />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(doc.id)}
                      color="error"
                      title={t('common.delete')}
                    >
                      <Delete />
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
        <DialogTitle>{selectedDocument ? t('hrDocumentManager.editDocument') : t('hrDocumentManager.createDocument')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t('hrDocumentManager.title')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('hrDocumentManager.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('hrDocumentManager.documentType')}</InputLabel>
              <Select
                value={formData.document_type}
                onChange={(e) =>
                  setFormData({ ...formData, document_type: e.target.value as any })
                }
                label={t('hrDocumentManager.documentType')}
              >
                <MenuItem value="onboarding">{t('hrDocumentManager.onboarding')}</MenuItem>
                <MenuItem value="policy">{t('hrDocumentManager.policy')}</MenuItem>
                <MenuItem value="contract">{t('hrDocumentManager.contract')}</MenuItem>
                <MenuItem value="other">{t('hrDocumentManager.other')}</MenuItem>
              </Select>
            </FormControl>
            {!selectedDocument && (
              <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
                {selectedFile ? selectedFile.name : t('common.selectFile')}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedDocument ? t('common.update') : t('common.upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog
        open={openAssignmentDialog}
        onClose={() => setOpenAssignmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('hrDocumentManager.assignDocument')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('common.employees')}</InputLabel>
              <Select
                multiple
                value={assignmentData.employee_ids}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    employee_ids: e.target.value as string[],
                  })
                }
                label={t('common.employees')}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={`${t('common.dueDate')} (${t('common.optional')})`}
              type="date"
              value={assignmentData.due_date}
              onChange={(e) =>
                setAssignmentData({ ...assignmentData, due_date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignmentDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleBulkAssign} variant="contained">
            {t('hrDocumentManager.assignDocument')}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};


