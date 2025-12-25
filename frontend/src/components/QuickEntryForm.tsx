import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  CameraAlt,
  ExpandMore,
  ExpandLess,
  CheckCircle,
} from '@mui/icons-material';
import {
  Snackbar,
  Alert,
} from '@mui/material';
import type { EntryType } from '../types/entry';
import { entryService } from '../services/entryService';
import { PhotoUpload, type PhotoUploadRef } from './PhotoUpload';

interface QuickEntryFormProps {
  jobSiteId: string;
  onEntryCreated?: (entry: any) => void;
}

export const QuickEntryForm: React.FC<QuickEntryFormProps> = ({
  jobSiteId,
  onEntryCreated,
}) => {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [entryType, setEntryType] = useState<EntryType>('vehicle');
  const [identifier, setIdentifier] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEntryId, setCreatedEntryId] = useState<string | null>(null);
  const identifierInputRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<PhotoUploadRef>(null);

  // Auto-focus identifier field on mount and after submission
  useEffect(() => {
    identifierInputRef.current?.focus();
  }, [entryType]);

  const getIdentifierLabel = () => {
    switch (entryType) {
      case 'vehicle':
      case 'truck':
        return 'License Plate';
      case 'visitor':
        return 'Visitor Name';
      default:
        return 'Identifier';
    }
  };

  const getIdentifierPlaceholder = () => {
    switch (entryType) {
      case 'vehicle':
        return 'ABC-123';
      case 'truck':
        return 'TRK-456';
      case 'visitor':
        return 'John Doe';
      default:
        return '';
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const validate = (): boolean => {
    if (!identifier.trim()) {
      showSnackbar(`${getIdentifierLabel()} is required`, 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build entry_data based on entry type
      const entryData: Record<string, any> = {
        company: company.trim() || undefined,
        purpose: notes.trim() || 'Site visit',
      };

      if (entryType === 'vehicle') {
        entryData.license_plate = identifier.trim().toUpperCase();
        entryData.vehicle_type = 'car';
        entryData.driver_name = '';
      } else if (entryType === 'truck') {
        entryData.license_plate = identifier.trim().toUpperCase();
        entryData.truck_number = '';
      } else if (entryType === 'visitor') {
        entryData.name = identifier.trim();
      }

      // Remove undefined values
      Object.keys(entryData).forEach((key) => {
        if (entryData[key] === undefined || entryData[key] === '') {
          delete entryData[key];
        }
      });

      const entry = await entryService.createEntry({
        job_site_id: jobSiteId,
        entry_type: entryType,
        entry_data: entryData,
      });

      setCreatedEntryId(entry.id);
      
      // Show success message
      const identifierValue = identifier.trim().toUpperCase();
      showSnackbar(`✓ ${identifierValue} logged successfully`, 'success');

      // Upload photos if any
      if (photoUploadRef.current?.hasPhotos()) {
        try {
          await photoUploadRef.current.uploadPhotos();
        } catch (photoError) {
          console.error('Photo upload error:', photoError);
          // Don't fail the whole submission if photos fail
        }
      }

      // Callback to parent
      if (onEntryCreated) {
        onEntryCreated(entry);
      }

      // Reset form
      setIdentifier('');
      setCompany('');
      setNotes('');
      setShowNotes(false);
      setCreatedEntryId(null);
      
      // Refocus identifier field
      setTimeout(() => {
        identifierInputRef.current?.focus();
      }, 100);

    } catch (error: any) {
      showSnackbar(error.message || 'Failed to create entry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter key (unless in textarea)
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Log New Entry
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}
        >
          {/* Entry Type */}
          <FormControl fullWidth size="small">
            <InputLabel>Entry Type</InputLabel>
            <Select
              value={entryType}
              onChange={(e) => {
                setEntryType(e.target.value as EntryType);
                setIdentifier('');
                setTimeout(() => identifierInputRef.current?.focus(), 100);
              }}
              label="Entry Type"
            >
              <MenuItem value="vehicle">Vehicle</MenuItem>
              <MenuItem value="visitor">Visitor</MenuItem>
              <MenuItem value="truck">Truck</MenuItem>
            </Select>
          </FormControl>

          {/* Identifier */}
          <TextField
            inputRef={identifierInputRef}
            label={getIdentifierLabel()}
            placeholder={getIdentifierPlaceholder()}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            fullWidth
            size="small"
            autoFocus
            autoComplete="off"
          />

          {/* Company */}
          <TextField
            label="Company/Organization"
            placeholder="Optional"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            fullWidth
            size="small"
            autoComplete="off"
          />

          {/* Photo Upload */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: '#b0b0b0' }}>
              Photos (Optional)
            </Typography>
            {createdEntryId && (
              <PhotoUpload
                ref={photoUploadRef}
                entryId={createdEntryId}
                maxPhotos={5}
              />
            )}
            {!createdEntryId && (
              <Button
                variant="outlined"
                startIcon={<CameraAlt />}
                fullWidth
                size="small"
                disabled
                sx={{ py: 1.5 }}
              >
                Photos will be available after entry is created
              </Button>
            )}
          </Box>

          {/* Notes (Collapsible) */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                mb: showNotes ? 1 : 0,
              }}
              onClick={() => setShowNotes(!showNotes)}
            >
              <Typography variant="body2" sx={{ color: '#b0b0b0', flexGrow: 1 }}>
                Notes (Optional)
              </Typography>
              <IconButton size="small">
                {showNotes ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={showNotes}>
              <TextField
                label="Notes"
                placeholder="Additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
                autoComplete="off"
              />
            </Collapse>
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || !identifier.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircle />}
            sx={{
              mt: 'auto',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {isSubmitting ? 'Logging...' : 'LOG ENTRY'}
          </Button>
        </Box>
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

