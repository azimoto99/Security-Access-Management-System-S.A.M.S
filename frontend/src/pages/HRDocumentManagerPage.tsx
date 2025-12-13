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
} from '@mui/icons-material';
import {
  hrDocumentService,
  type HRDocument,
} from '../services/hrDocumentService';
import { userService, type User } from '../services/userService';

export const HRDocumentManagerPage: React.FC = () => {
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
      setError(err.message || 'Failed to load data');
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
        setError('Please select a file');
        return;
      }

      if (selectedDocument) {
        // Update existing
        await hrDocumentService.updateDocument(selectedDocument.id, formData);
        setSuccess('Document updated successfully');
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
        setSuccess('Document created successfully');
      }

      setOpenDialog(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setError(null);
      await hrDocumentService.deleteDocument(id);
      setSuccess('Document deleted successfully');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
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
        setError('Please select at least one employee');
        return;
      }

      await hrDocumentService.createBulkAssignments({
        document_id: assignmentData.document_id,
        employee_ids: assignmentData.employee_ids,
        due_date: assignmentData.due_date || undefined,
      });

      setSuccess(`Document assigned to ${assignmentData.employee_ids.length} employees`);
      setOpenAssignmentDialog(false);
    } catch (err: any) {
      setError(err.message || 'Failed to assign document');
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          HR Document Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
          Upload Document
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
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Required</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No documents found
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
                      label={doc.is_required ? 'Required' : 'Optional'}
                      color={doc.is_required ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.is_active ? 'Active' : 'Inactive'}
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
                      title="Assign to employees"
                    >
                      <Assignment />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(doc.id)}
                      color="error"
                      title="Delete"
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
        <DialogTitle>{selectedDocument ? 'Edit Document' : 'Upload Document'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={formData.document_type}
                onChange={(e) =>
                  setFormData({ ...formData, document_type: e.target.value as any })
                }
                label="Document Type"
              >
                <MenuItem value="onboarding">Onboarding</MenuItem>
                <MenuItem value="policy">Policy</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            {!selectedDocument && (
              <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
                {selectedFile ? selectedFile.name : 'Select File'}
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedDocument ? 'Update' : 'Upload'}
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
        <DialogTitle>Assign Document to Employees</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Employees</InputLabel>
              <Select
                multiple
                value={assignmentData.employee_ids}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    employee_ids: e.target.value as string[],
                  })
                }
                label="Employees"
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
              label="Due Date (Optional)"
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
          <Button onClick={() => setOpenAssignmentDialog(false)}>Cancel</Button>
          <Button onClick={handleBulkAssign} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};


