import React, { useState } from 'react';
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

interface ExitConfirmationDialogProps {
  open: boolean;
  entry: Entry | null;
  onClose: () => void;
  onConfirm: (exitNotes?: string, exitTrailerNumber?: string) => void;
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
  const [exitNotes, setExitNotes] = useState('');
  const [exitTrailerNumber, setExitTrailerNumber] = useState('');

  const handleClose = () => {
    if (!processing) {
      setExitNotes('');
      setExitTrailerNumber('');
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm(exitNotes.trim() || undefined, exitTrailerNumber.trim() || undefined);
    setExitNotes('');
    setExitTrailerNumber('');
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

        {entry.entry_type === 'truck' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              {t('exitDialog.entryTrailer')}
            </Typography>
            <Typography variant="body1">
              {entry.entry_data?.trailer_number || t('manualExit.none')}
            </Typography>
            <TextField
              label={t('exitDialog.exitTrailerNumber')}
              placeholder={t('exitDialog.exitTrailerPlaceholder')}
              value={exitTrailerNumber}
              onChange={(e) => setExitTrailerNumber(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              helperText={t('exitDialog.exitTrailerHelper')}
            />
          </Box>
        )}

        <TextField
          label={t('exitDialog.exitNotes')}
          placeholder={t('exitDialog.exitNotesPlaceholder')}
          value={exitNotes}
          onChange={(e) => setExitNotes(e.target.value)}
          fullWidth
          multiline
          rows={3}
          sx={{ mt: 2 }}
        />
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

