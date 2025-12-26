import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Entry } from '../services/entryService';
import { exitFieldService } from '../services/exitFieldService';
import type { CustomField } from '../services/customFieldService';
import { DynamicFormField } from './DynamicFormField';

interface ExitConfirmationDialogProps {
  open: boolean;
  entry: Entry | null;
  onClose: () => void;
  onConfirm: (exitData: Record<string, any>) => void;
  processing?: boolean;
}

const getIdentifier = (entry: Entry): string => {
  if (entry.entry_type === 'visitor') {
    return entry.entry_data?.name || 'Unknown';
  }
  return entry.entry_data?.license_plate || 'Unknown';
};

export const ExitConfirmationDialog: React.FC<ExitConfirmationDialogProps> = ({
  open,
  entry,
  onClose,
  onConfirm,
  processing = false,
}) => {
  const { t } = useTranslation();
  const [exitFieldConfigs, setExitFieldConfigs] = useState<CustomField[]>([]);
  const [exitData, setExitData] = useState<Record<string, any>>({});
  const [loadingFields, setLoadingFields] = useState(false);

  useEffect(() => {
    if (open && entry) {
      loadExitFields();
      // Initialize exit data
      setExitData({});
    } else {
      setExitData({});
      setExitFieldConfigs([]);
    }
  }, [open, entry]);

  const loadExitFields = async () => {
    if (!entry?.job_site_id || !entry?.entry_type) return;
    
    try {
      setLoadingFields(true);
      const configs = await exitFieldService.getExitFields(entry.job_site_id, entry.entry_type);
      const activeConfigs = configs.filter((f) => f.is_active);
      setExitFieldConfigs(activeConfigs);
      
      // Initialize exit data with default values
      const initialData: Record<string, any> = {};
      activeConfigs.forEach((field) => {
        if (field.field_type === 'boolean') {
          initialData[field.field_key] = false;
        } else if (field.field_type === 'select' && field.options && field.options.length > 0) {
          initialData[field.field_key] = field.options[0].value;
        } else {
          initialData[field.field_key] = '';
        }
      });
      setExitData(initialData);
    } catch (error) {
      console.error('Failed to load exit field configurations:', error);
      // Fallback: initialize with exit_trailer_number for trucks
      if (entry.entry_type === 'truck') {
        setExitData({ exit_trailer_number: '' });
      }
    } finally {
      setLoadingFields(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setExitData({});
      onClose();
    }
  };

  const handleConfirm = () => {
    // Clean up empty values
    const cleanedData: Record<string, any> = {};
    Object.keys(exitData).forEach((key) => {
      const value = exitData[key];
      if (value !== undefined && value !== null && value !== '') {
        cleanedData[key] = value;
      }
    });
    onConfirm(cleanedData);
    setExitData({});
  };

  if (!entry) return null;

  const identifier = getIdentifier(entry);
  const company = entry.entry_data?.company || '';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('exitDialog.processExit')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
            {t('exitDialog.entryType')}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
            {entry.entry_type}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
            {t('exitDialog.identifier')}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {identifier}
          </Typography>
        </Box>

        {company && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              {t('exitDialog.company')}
            </Typography>
            <Typography variant="body1">{company}</Typography>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
            {t('exitDialog.entryTime')}
          </Typography>
          <Typography variant="body1">
            {new Date(entry.entry_time).toLocaleString()}
          </Typography>
        </Box>

        {/* Show entry trailer for trucks */}
        {entry.entry_type === 'truck' && entry.entry_data?.trailer_number && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              {t('exitDialog.entryTrailer')}
            </Typography>
            <Typography variant="body1">
              {entry.entry_data.trailer_number}
            </Typography>
          </Box>
        )}

        {/* Dynamic Exit Fields */}
        {loadingFields ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : exitFieldConfigs.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            {exitFieldConfigs
              .sort((a, b) => a.display_order - b.display_order)
              .map((field) => (
                <Box key={field.id} sx={{ mb: 2 }}>
                  <DynamicFormField
                    field={field}
                    value={exitData[field.field_key]}
                    onChange={(value) => {
                      setExitData((prev) => ({ ...prev, [field.field_key]: value }));
                    }}
                    gridSize={{}}
                    size="medium"
                    fullWidth
                  />
                </Box>
              ))}
          </Box>
        ) : (
          // Fallback: show exit_trailer_number for trucks if no configs
          entry.entry_type === 'truck' && (
            <TextField
              label={t('exitDialog.exitTrailerNumber')}
              placeholder={t('exitDialog.exitTrailerPlaceholder')}
              value={exitData.exit_trailer_number || ''}
              onChange={(e) => setExitData({ ...exitData, exit_trailer_number: e.target.value })}
              fullWidth
              sx={{ mt: 2, mb: 2 }}
              helperText={t('exitDialog.exitTrailerHelper')}
            />
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={processing}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={processing}
          startIcon={processing ? <CircularProgress size={16} /> : null}
        >
          {processing ? t('exitDialog.processing') : t('exitDialog.confirmExit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

