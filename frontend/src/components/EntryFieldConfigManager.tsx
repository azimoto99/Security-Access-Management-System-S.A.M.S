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
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
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

interface EntryFieldConfigManagerProps {
  open: boolean;
  jobSiteId: string;
  jobSiteName: string;
  onClose: () => void;
}

export const EntryFieldConfigManager: React.FC<EntryFieldConfigManagerProps> = ({
  open,
  jobSiteId,
  jobSiteName,
  onClose,
}) => {
  const { t } = useTranslation();
  const [fieldConfigs, setFieldConfigs] = useState<CustomField[]>([]);
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
      loadFieldConfigs();
    }
  }, [open, jobSiteId, selectedEntryType]);

  const loadFieldConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const fields = await customFieldService.getCustomFields(jobSiteId, selectedEntryType);
      setFieldConfigs(fields);
    } catch (err: any) {
      setError(err.message || 'Failed to load field configurations');
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
      display_order: fieldConfigs.length,
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
      placeholder: field.placeholder ?? '',
      help_text: field.help_text ?? '',
    });
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (editingField) {
        // Only send allowed fields for update (exclude field_key, job_site_id, entry_type, is_custom)
        const updateData: UpdateCustomFieldData = {};
        if (formData.field_label !== undefined) updateData.field_label = formData.field_label;
        if (formData.field_type !== undefined) updateData.field_type = formData.field_type;
        if (formData.is_required !== undefined) updateData.is_required = formData.is_required;
        if (formData.is_active !== undefined) updateData.is_active = formData.is_active;
        if (formData.options !== undefined) updateData.options = formData.options;
        if (formData.validation !== undefined) updateData.validation = formData.validation;
        if (formData.display_order !== undefined) updateData.display_order = formData.display_order;
        // Convert null to empty string for placeholder and help_text
        if (formData.placeholder !== undefined) {
          updateData.placeholder = formData.placeholder ?? '';
        }
        if (formData.help_text !== undefined) {
          updateData.help_text = formData.help_text ?? '';
        }
        await customFieldService.updateCustomField(editingField.id, updateData);
      } else {
        if (!formData.field_key || !formData.field_label) {
          setError('Field key and label are required');
          return;
        }
        await customFieldService.createCustomField({
          ...formData,
          job_site_id: jobSiteId,
          entry_type: selectedEntryType,
          placeholder: formData.placeholder ?? '',
          help_text: formData.help_text ?? '',
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
      await loadFieldConfigs();
    } catch (err: any) {
      setError(err.message || 'Failed to save field configuration');
    }
  };

  const handleDelete = async (id: string, isCustom: boolean) => {
    if (!isCustom) {
      setError('Standard fields cannot be deleted. You can hide them by setting them to inactive.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this custom field?')) return;

    try {
      setError(null);
      await customFieldService.deleteCustomField(id);
      await loadFieldConfigs();
    } catch (err: any) {
      setError(err.message || 'Failed to delete custom field');
    }
  };

  const filteredFields = fieldConfigs
    .filter((f) => f.entry_type === selectedEntryType)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t('customFields.manageFields', { defaultValue: 'Manage Entry Fields' })} - {jobSiteName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs value={selectedEntryType} onChange={(_, value) => setSelectedEntryType(value)} sx={{ mb: 2 }}>
          <Tab label={t('entry.vehicle', { defaultValue: 'Vehicle' })} value="vehicle" />
          <Tab label={t('entry.visitor', { defaultValue: 'Visitor' })} value="visitor" />
          <Tab label={t('entry.truck', { defaultValue: 'Truck' })} value="truck" />
        </Tabs>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {t('customFields.fields', { defaultValue: 'Fields' })} ({filteredFields.length})
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
            {t('customFields.addCustomField', { defaultValue: 'Add Custom Field' })}
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredFields.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              {t('customFields.noFields', { defaultValue: 'No fields configured' })}
            </Typography>
          </Paper>
        ) : (
          <List>
            {filteredFields.map((field, index) => (
              <React.Fragment key={field.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                            label="Hidden"
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                        {field.is_custom && (
                          <Chip
                            label="Custom"
                            size="small"
                            color="secondary"
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
                    <Tooltip title={t('customFields.edit', { defaultValue: 'Edit' })}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(field)}
                        sx={{ color: '#ffd700', mr: 1 }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {field.is_custom && (
                      <Tooltip title={t('customFields.delete', { defaultValue: 'Delete' })}>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(field.id, field.is_custom)}
                          sx={{ color: '#ff4444' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
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
            {editingField
              ? t('customFields.editField', { defaultValue: 'Edit Field' })
              : t('customFields.addCustomField', { defaultValue: 'Add Custom Field' })}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              {!editingField && (
                <TextField
                  fullWidth
                  label={t('customFields.fieldKey', { defaultValue: 'Field Key' })}
                  value={formData.field_key || ''}
                  onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  margin="normal"
                  required
                  helperText={t('customFields.fieldKeyHelper', { defaultValue: 'Lowercase letters, numbers, and underscores only. Must start with a letter.' })}
                  inputProps={{ pattern: '^[a-z][a-z0-9_]*$' }}
                />
              )}
              {editingField && (
                <TextField
                  fullWidth
                  label={t('customFields.fieldKey', { defaultValue: 'Field Key' })}
                  value={editingField.field_key}
                  margin="normal"
                  disabled
                  helperText="Field key cannot be changed"
                />
              )}
              <TextField
                fullWidth
                label={t('customFields.fieldLabel', { defaultValue: 'Field Label' })}
                value={formData.field_label || ''}
                onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                margin="normal"
                required
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('customFields.fieldType', { defaultValue: 'Field Type' })}</InputLabel>
                <Select
                  value={formData.field_type || 'text'}
                  onChange={(e) => setFormData({ ...formData, field_type: e.target.value as CustomFieldType })}
                  label={t('customFields.fieldType', { defaultValue: 'Field Type' })}
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
                label={t('customFields.isRequired', { defaultValue: 'Required' })}
                sx={{ mt: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label={t('customFields.isActive', { defaultValue: 'Active (Visible)' })}
                sx={{ mt: 1 }}
              />
              <TextField
                fullWidth
                label={t('customFields.placeholder', { defaultValue: 'Placeholder Text' })}
                value={formData.placeholder || ''}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label={t('customFields.helpText', { defaultValue: 'Help Text' })}
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
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!formData.field_label || (!editingField && !formData.field_key)}
            >
              {t('common.save', { defaultValue: 'Save' })}
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close', { defaultValue: 'Close' })}</Button>
      </DialogActions>
    </Dialog>
  );
};

