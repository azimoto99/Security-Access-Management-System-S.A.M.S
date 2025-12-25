import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SelectChangeEvent } from '@mui/material';

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
  const { t } = useTranslation();
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
      newErrors.license_plate = t('entryForm.licensePlateRequired');
    }

    if (entryType === 'truck' && !formData.truck_number.trim()) {
      newErrors.truck_number = t('manualExit.truckNumberRequired');
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
        {t('manualExit.logExitInfo')}
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>{t('manualExit.entryType')}</InputLabel>
            <Select value={entryType} onChange={handleEntryTypeChange} label={t('manualExit.entryType')}>
              <MenuItem value="vehicle">{t('entryForm.vehicle')}</MenuItem>
              <MenuItem value="truck">{t('entryForm.truck')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('manualExit.licensePlate')}
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
                label={t('manualExit.truckNumber')}
                value={formData.truck_number}
                onChange={handleChange('truck_number')}
                required
                error={!!errors.truck_number}
                helperText={errors.truck_number}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('manualExit.destination')}</InputLabel>
                <Select
                  value={formData.destination}
                  onChange={handleDestinationChange}
                  label={t('manualExit.destination')}
                >
                  <MenuItem value="">{t('manualExit.none')}</MenuItem>
                  <MenuItem value="north">{t('manualExit.north')}</MenuItem>
                  <MenuItem value="south">{t('manualExit.south')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('manualExit.trailerNumber')}
            value={formData.trailer_number}
            onChange={handleChange('trailer_number')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('manualExit.driverName')}
            value={formData.driver_name}
            onChange={handleChange('driver_name')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('manualExit.company')}
            value={formData.company}
            onChange={handleChange('company')}
          />
        </Grid>

        {entryType === 'truck' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('manualExit.cargoDescription')}
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
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? t('manualExit.loggingExit') : t('manualExit.logExit')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

