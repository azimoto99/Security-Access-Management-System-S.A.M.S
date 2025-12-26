import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  Check,
  Close,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  customFieldService,
  type CustomField,
  type CreateCustomFieldData,
  type UpdateCustomFieldData,
  type EntryType,
  type CustomFieldType,
} from '../services/customFieldService';

interface CustomFieldsManagerProps {
  open: boolean;
  jobSiteId: string;
  jobSiteName: string;
  onClose: () => void;
}

export const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({
  open,
  jobSiteId,
  jobSiteName,
  onClose,
}) => {
  const { t } = useTranslation();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntryType, setSelectedEntryType] = useState<EntryType>('vehicle');
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<Partial<CreateCustomFieldData>>({
    field_key: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    is_active: true,
    options: [],
    validation: {},
    display_order: 0,
  });

  useEffect(() => {
    if (open && jobSiteId) {
      loadCustomFields();
    }
  }, [open, jobSiteId, selectedEntryType]);

  const loadCustomFields = async () => {
    try {
      setLoading(true);
      setError(null);
      const fields = await customFieldService.getCustomFields(jobSiteId, selectedEntryType);
      setCustomFields(fields);
    } catch (err: any) {
      setError(err.message || 'Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingField(null);
    setFormData({
      field_key: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      is_active: true,
      options: [],
      validation: {},
      display_order: customFields.length,
    });
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      is_active: field.is_active,
      options: field.options || [],
      validation: field.validation || {},
      display_order: field.display_order,
      placeholder: field.placeholder,
      help_text: field.help_text,
    });
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (editingField) {
        await customFieldService.updateCustomField(editingField.id, formData as UpdateCustomFieldData);
      } else {
        if (!formData.field_key || !formData.field_label) {
          setError('Field key and label are required');
          return;
        }
        await customFieldService.createCustomField({
          ...formData,
          job_site_id: jobSiteId,
          entry_type: selectedEntryType,
        } as CreateCustomFieldData);
      }
      setEditingField(null);
      setFormData({
        field_key: '',
        field_label: '',
        field_type: 'text',
        is_required: false,
        is_active: true,
        options: [],
        validation: {},
        display_order: 0,
      });
      await loadCustomFields();
    } catch (err: any) {
      setError(err.message || 'Failed to save custom field');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom field?')) return;

    try {
      setError(null);
      await customFieldService.deleteCustomField(id);
      await loadCustomFields();
    } catch (err: any) {
      setError(err.message || 'Failed to delete custom field');
    }
  };

  const filteredFields = customFields.filter((f) => f.entry_type === selectedEntryType);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('customFields.manageCustomFields', { siteName: jobSiteName })}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs value={selectedEntryType} onChange={(_, value) => setSelectedEntryType(value)} sx={{ mb: 2 }}>
          <Tab label={t('entry.vehicle')} value="vehicle" />
          <Tab label={t('entry.visitor')} value="visitor" />
          <Tab label={t('entry.truck')} value="truck" />
        </Tabs>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {t('customFields.customFields')} ({filteredFields.length})
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={handleCreate}
            sx={{
              borderColor: '#ffd700',
              color: '#ffd700',
            }}
          >
            {t('customFields.addField')}
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredFields.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              {t('customFields.noCustomFields')}
            </Typography>
          </Paper>
        ) : (
          <List>
            {filteredFields.map((field, index) => (
              <React.Fragment key={field.id}>
                <ListItem>
                  <DragIndicator sx={{ color: '#666', mr: 1, cursor: 'grab' }} />
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {field.field_label}
                        </Typography>
                        <Chip
                          label={field.field_key}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        <Chip
                          label={field.field_type}
                          size="small"
                          color="primary"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        {field.is_required && (
                          <Chip
                            label="Required"
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                        {!field.is_active && (
                          <Chip
                            label="Inactive"
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {field.placeholder && (
                          <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                            Placeholder: {field.placeholder}
                          </Typography>
                        )}
                        {field.help_text && (
                          <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                            {field.help_text}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(field)}
                      sx={{ color: '#ffd700', mr: 1 }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(field.id)}
                      sx={{ color: '#ff4444' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredFields.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Create/Edit Form Dialog */}
        <Dialog
          open={!!editingField || (formData.field_key !== undefined && formData.field_key !== '')}
          onClose={() => {
            setEditingField(null);
            setFormData({
              field_key: '',
              field_label: '',
              field_type: 'text',
              is_required: false,
              is_active: true,
              options: [],
              validation: {},
              display_order: 0,
            });
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingField ? t('customFields.editField') : t('customFields.addField')}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              {!editingField && (
                <TextField
                  fullWidth
                  label={t('customFields.fieldKey')}
                  value={formData.field_key || ''}
                  onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  margin="normal"
                  required
                  helperText={t('customFields.fieldKeyHelper')}
                  inputProps={{ pattern: '^[a-z][a-z0-9_]*$' }}
                />
              )}
              <TextField
                fullWidth
                label={t('customFields.fieldLabel')}
                value={formData.field_label || ''}
                onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                margin="normal"
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('customFields.fieldType')}</InputLabel>
                <Select
                  value={formData.field_type || 'text'}
                  onChange={(e) => setFormData({ ...formData, field_type: e.target.value as CustomFieldType })}
                  label={t('customFields.fieldType')}
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="select">Select (Dropdown)</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="boolean">Boolean (Yes/No)</MenuItem>
                  <MenuItem value="textarea">Textarea</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="phone">Phone</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_required || false}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  />
                }
                label={t('customFields.isRequired')}
                sx={{ mt: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label={t('customFields.isActive')}
                sx={{ mt: 1 }}
              />
              <TextField
                fullWidth
                label={t('customFields.placeholder')}
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label={t('customFields.helpText')}
                value={formData.help_text || ''}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setEditingField(null);
                setFormData({
                  field_key: '',
                  field_label: '',
                  field_type: 'text',
                  is_required: false,
                  is_active: true,
                  options: [],
                  validation: {},
                  display_order: 0,
                });
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!formData.field_label || (!editingField && !formData.field_key)}
            >
              {t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

