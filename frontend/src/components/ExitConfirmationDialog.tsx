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
import type { Entry } from '../services/entryService';

interface ExitConfirmationDialogProps {
  open: boolean;
  entry: Entry | null;
  onClose: () => void;
  onConfirm: (exitNotes?: string) => void;
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
  const [exitNotes, setExitNotes] = useState('');

  const handleClose = () => {
    if (!processing) {
      setExitNotes('');
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm(exitNotes.trim() || undefined);
    setExitNotes('');
  };

  if (!entry) return null;

  const identifier = getIdentifier(entry);
  const company = entry.entry_data?.company || '';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Process Exit</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
            Entry Type
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
            {entry.entry_type}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
            Identifier
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {identifier}
          </Typography>
        </Box>

        {company && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              Company
            </Typography>
            <Typography variant="body1">{company}</Typography>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
            Entry Time
          </Typography>
          <Typography variant="body1">
            {new Date(entry.entry_time).toLocaleString()}
          </Typography>
        </Box>

        <TextField
          label="Exit Notes (Optional)"
          placeholder="Add any notes about this exit..."
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
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={processing}
          startIcon={processing ? <CircularProgress size={16} /> : null}
        >
          {processing ? 'Processing...' : 'Confirm Exit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

