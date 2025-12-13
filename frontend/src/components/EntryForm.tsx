import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import type { EntryType } from '../types/entry';
import { PhotoUpload } from './PhotoUpload';

interface EntryFormProps {
  entryType: EntryType;
  jobSiteId: string;
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
  initialData?: Record<string, any>;
  entryId?: string; // For uploading photos after entry is created
}

export const EntryForm: React.FC<EntryFormProps> = ({
  entryType,
  jobSiteId,
  onSubmit,
  onCancel,
  initialData,
  entryId,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Initialize form based on entry type
      switch (entryType) {
        case 'vehicle':
          setFormData({
            license_plate: '',
            vehicle_type: '',
            driver_name: '',
            company: '',
            purpose: '',
            expected_duration: '',
          });
          break;
        case 'visitor':
          setFormData({
            name: '',
            company: '',
            contact_phone: '',
            purpose: '',
            host_contact: '',
            expected_duration: '',
          });
          break;
        case 'truck':
          setFormData({
            license_plate: '',
            company: '',
            driver_name: '',
            cargo_description: '',
            delivery_pickup: 'delivery',
            expected_duration: '',
          });
          break;
      }
    }
  }, [entryType, initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (entryType === 'vehicle') {
      if (!formData.license_plate?.trim()) newErrors.license_plate = 'License plate is required';
      if (!formData.vehicle_type?.trim()) newErrors.vehicle_type = 'Vehicle type is required';
      if (!formData.driver_name?.trim()) newErrors.driver_name = 'Driver name is required';
      if (!formData.purpose?.trim()) newErrors.purpose = 'Purpose is required';
    } else if (entryType === 'visitor') {
      if (!formData.name?.trim()) newErrors.name = 'Name is required';
      if (!formData.purpose?.trim()) newErrors.purpose = 'Purpose is required';
    } else if (entryType === 'truck') {
      if (!formData.license_plate?.trim()) newErrors.license_plate = 'License plate is required';
      if (!formData.company?.trim()) newErrors.company = 'Company is required';
      if (!formData.driver_name?.trim()) newErrors.driver_name = 'Driver name is required';
      if (!formData.delivery_pickup) newErrors.delivery_pickup = 'Delivery/pickup type is required';
    }

    if (formData.expected_duration && (isNaN(formData.expected_duration) || formData.expected_duration < 0)) {
      newErrors.expected_duration = 'Expected duration must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData: Record<string, any> = {
      job_site_id: jobSiteId,
      entry_type: entryType,
      entry_data: { ...formData },
    };

    // Clean up expected_duration
    if (submitData.entry_data.expected_duration === '') {
      delete submitData.entry_data.expected_duration;
    } else if (submitData.entry_data.expected_duration) {
      submitData.entry_data.expected_duration = parseInt(submitData.entry_data.expected_duration);
    }

    // Remove empty optional fields
    Object.keys(submitData.entry_data).forEach((key) => {
      if (submitData.entry_data[key] === '') {
        delete submitData.entry_data[key];
      }
    });

    onSubmit(submitData);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderVehicleFields = () => (
    <>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="License Plate"
          value={formData.license_plate || ''}
          onChange={handleChange('license_plate')}
          error={!!errors.license_plate}
          helperText={errors.license_plate}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Vehicle Type"
          value={formData.vehicle_type || ''}
          onChange={handleChange('vehicle_type')}
          error={!!errors.vehicle_type}
          helperText={errors.vehicle_type}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Driver Name"
          value={formData.driver_name || ''}
          onChange={handleChange('driver_name')}
          error={!!errors.driver_name}
          helperText={errors.driver_name}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Company"
          value={formData.company || ''}
          onChange={handleChange('company')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Purpose"
          value={formData.purpose || ''}
          onChange={handleChange('purpose')}
          error={!!errors.purpose}
          helperText={errors.purpose}
          required
        />
      </Grid>
    </>
  );

  const renderVisitorFields = () => (
    <>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Name"
          value={formData.name || ''}
          onChange={handleChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Company"
          value={formData.company || ''}
          onChange={handleChange('company')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Contact Phone"
          value={formData.contact_phone || ''}
          onChange={handleChange('contact_phone')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Host Contact"
          value={formData.host_contact || ''}
          onChange={handleChange('host_contact')}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Purpose"
          value={formData.purpose || ''}
          onChange={handleChange('purpose')}
          error={!!errors.purpose}
          helperText={errors.purpose}
          required
        />
      </Grid>
    </>
  );

  const renderTruckFields = () => (
    <>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="License Plate"
          value={formData.license_plate || ''}
          onChange={handleChange('license_plate')}
          error={!!errors.license_plate}
          helperText={errors.license_plate}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Company"
          value={formData.company || ''}
          onChange={handleChange('company')}
          error={!!errors.company}
          helperText={errors.company}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Driver Name"
          value={formData.driver_name || ''}
          onChange={handleChange('driver_name')}
          error={!!errors.driver_name}
          helperText={errors.driver_name}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required error={!!errors.delivery_pickup}>
          <InputLabel>Delivery/Pickup</InputLabel>
          <Select
            value={formData.delivery_pickup || 'delivery'}
            onChange={handleSelectChange('delivery_pickup')}
            label="Delivery/Pickup"
          >
            <MenuItem value="delivery">Delivery</MenuItem>
            <MenuItem value="pickup">Pickup</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Cargo Description"
          value={formData.cargo_description || ''}
          onChange={handleChange('cargo_description')}
          multiline
          rows={2}
        />
      </Grid>
    </>
  );

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {entryType === 'vehicle' && renderVehicleFields()}
        {entryType === 'visitor' && renderVisitorFields()}
        {entryType === 'truck' && renderTruckFields()}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Expected Duration (minutes)"
            type="number"
            value={formData.expected_duration || ''}
            onChange={handleChange('expected_duration')}
            error={!!errors.expected_duration}
            helperText={errors.expected_duration}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Upload Photos (Optional)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <PhotoUpload
                entryId={entryId}
                maxPhotos={10}
                onUploadComplete={(photoIds) => {
                  // Photos uploaded successfully
                  console.log('Photos uploaded:', photoIds);
                }}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="contained">
              Submit Entry
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

