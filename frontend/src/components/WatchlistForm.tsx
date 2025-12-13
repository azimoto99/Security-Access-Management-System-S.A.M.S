import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { WatchlistEntry, CreateWatchlistData, UpdateWatchlistData } from '../services/watchlistService';

interface WatchlistFormProps {
  entry?: WatchlistEntry | null;
  onSubmit: (data: CreateWatchlistData | UpdateWatchlistData) => void;
  onCancel: () => void;
}

export const WatchlistForm: React.FC<WatchlistFormProps> = ({ entry, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'person' as 'person' | 'vehicle',
    identifier: '',
    reason: '',
    alert_level: 'medium' as 'low' | 'medium' | 'high',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entry) {
      setFormData({
        type: entry.type,
        identifier: entry.identifier,
        reason: entry.reason,
        alert_level: entry.alert_level,
      });
    }
  }, [entry]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Identifier is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData: CreateWatchlistData | UpdateWatchlistData = {
      type: formData.type,
      identifier: formData.identifier.trim(),
      reason: formData.reason.trim(),
      alert_level: formData.alert_level,
    };

    // For updates, only include changed fields
    if (entry) {
      const updateData: UpdateWatchlistData = {};
      if (formData.identifier !== entry.identifier) updateData.identifier = formData.identifier.trim();
      if (formData.reason !== entry.reason) updateData.reason = formData.reason.trim();
      if (formData.alert_level !== entry.alert_level) updateData.alert_level = formData.alert_level;
      onSubmit(updateData);
    } else {
      onSubmit(submitData);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (field: string) => (e: SelectChangeEvent) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!errors.type}>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={handleSelectChange('type')}
              label="Type"
              disabled={!!entry} // Type cannot be changed after creation
            >
              <MenuItem value="person">Person</MenuItem>
              <MenuItem value="vehicle">Vehicle</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!errors.alert_level}>
            <InputLabel>Alert Level</InputLabel>
            <Select
              value={formData.alert_level}
              onChange={handleSelectChange('alert_level')}
              label="Alert Level"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label={formData.type === 'person' ? 'Name' : 'License Plate'}
            value={formData.identifier}
            onChange={handleChange('identifier')}
            error={!!errors.identifier}
            helperText={errors.identifier || (formData.type === 'person' ? 'Full name of the person' : 'License plate number')}
            required
            disabled={!!entry} // Identifier cannot be changed after creation
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Reason"
            value={formData.reason}
            onChange={handleChange('reason')}
            error={!!errors.reason}
            helperText={errors.reason || 'Reason for adding to watchlist'}
            required
            multiline
            rows={3}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="contained">
              {entry ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};



