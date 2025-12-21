import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { EntryType } from '../types/entry';

interface ManualExitFormProps {
  jobSiteId: string;
  onSubmit: (data: {
    job_site_id: string;
    entry_type: 'vehicle' | 'truck';
    entry_data: {
      license_plate: string;
      truck_number?: string;
      trailer_number?: string;
      destination?: 'north' | 'south';
      driver_name?: string;
      company?: string;
      cargo_description?: string;
    };
  }) => void;
  onCancel: () => void;
}

export const ManualExitForm: React.FC<ManualExitFormProps> = ({
  jobSiteId,
  onSubmit,
  onCancel,
}) => {
  const [entryType, setEntryType] = useState<'vehicle' | 'truck'>('vehicle');
  const [formData, setFormData] = useState({
    license_plate: '',
    truck_number: '',
    trailer_number: '',
    destination: '' as 'north' | 'south' | '',
    driver_name: '',
    company: '',
    cargo_description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleEntryTypeChange = (e: SelectChangeEvent<'vehicle' | 'truck'>) => {
    setEntryType(e.target.value as 'vehicle' | 'truck');
    // Clear truck-specific fields when switching to vehicle
    if (e.target.value === 'vehicle') {
      setFormData((prev) => ({
        ...prev,
        truck_number: '',
        destination: '',
      }));
    }
  };

  const handleDestinationChange = (e: SelectChangeEvent) => {
    setFormData((prev) => ({ ...prev, destination: e.target.value as 'north' | 'south' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.license_plate.trim()) {
      newErrors.license_plate = 'License plate is required';
    }

    if (entryType === 'truck' && !formData.truck_number.trim()) {
      newErrors.truck_number = 'Truck number is required for trucks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: any = {
        job_site_id: jobSiteId,
        entry_type: entryType,
        entry_data: {
          license_plate: formData.license_plate.trim().toUpperCase(),
        },
      };

      // Add truck-specific required fields
      if (entryType === 'truck') {
        submitData.entry_data.truck_number = formData.truck_number.trim();
      }

      // Add optional fields if provided
      if (formData.trailer_number.trim()) {
        submitData.entry_data.trailer_number = formData.trailer_number.trim();
      }

      if (entryType === 'truck' && formData.destination) {
        submitData.entry_data.destination = formData.destination;
      }

      if (formData.driver_name.trim()) {
        submitData.entry_data.driver_name = formData.driver_name.trim();
      }

      if (formData.company.trim()) {
        submitData.entry_data.company = formData.company.trim();
      }

      if (formData.cargo_description.trim()) {
        submitData.entry_data.cargo_description = formData.cargo_description.trim();
      }

      onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting manual exit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Log an exit for a vehicle or truck that wasn't logged in as an entry.
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Entry Type</InputLabel>
            <Select value={entryType} onChange={handleEntryTypeChange} label="Entry Type">
              <MenuItem value="vehicle">Vehicle</MenuItem>
              <MenuItem value="truck">Truck</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="License Plate"
            value={formData.license_plate}
            onChange={handleChange('license_plate')}
            required
            error={!!errors.license_plate}
            helperText={errors.license_plate}
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
        </Grid>

        {entryType === 'truck' && (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Truck Number"
                value={formData.truck_number}
                onChange={handleChange('truck_number')}
                required
                error={!!errors.truck_number}
                helperText={errors.truck_number}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Destination</InputLabel>
                <Select
                  value={formData.destination}
                  onChange={handleDestinationChange}
                  label="Destination"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="north">North</MenuItem>
                  <MenuItem value="south">South</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Trailer Number"
            value={formData.trailer_number}
            onChange={handleChange('trailer_number')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Driver Name"
            value={formData.driver_name}
            onChange={handleChange('driver_name')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Company"
            value={formData.company}
            onChange={handleChange('company')}
          />
        </Grid>

        {entryType === 'truck' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Cargo Description"
              value={formData.cargo_description}
              onChange={handleChange('cargo_description')}
              multiline
              rows={2}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Logging Exit...' : 'Log Exit'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

