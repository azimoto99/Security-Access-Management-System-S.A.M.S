import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
} from '@mui/material';
import type { JobSite, CreateJobSiteData, UpdateJobSiteData } from '../services/jobSiteService';

interface JobSiteFormProps {
  jobSite?: JobSite | null;
  onSubmit: (data: CreateJobSiteData | UpdateJobSiteData) => void;
  onCancel: () => void;
}

export const JobSiteForm: React.FC<JobSiteFormProps> = ({ jobSite, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    vehicle_capacity: 0,
    visitor_capacity: 0,
    truck_capacity: 0,
    contact_phone: '',
    contact_email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (jobSite) {
      setFormData({
        name: jobSite.name || '',
        address: jobSite.address || '',
        vehicle_capacity: jobSite.vehicle_capacity || 0,
        visitor_capacity: jobSite.visitor_capacity || 0,
        truck_capacity: jobSite.truck_capacity || 0,
        contact_phone: jobSite.contact_info?.phone || '',
        contact_email: jobSite.contact_info?.email || '',
      });
    }
  }, [jobSite]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.vehicle_capacity < 0) {
      newErrors.vehicle_capacity = 'Vehicle capacity must be 0 or greater';
    }

    if (formData.visitor_capacity < 0) {
      newErrors.visitor_capacity = 'Visitor capacity must be 0 or greater';
    }

    if (formData.truck_capacity < 0) {
      newErrors.truck_capacity = 'Truck capacity must be 0 or greater';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const contact_info: Record<string, any> = {};
    if (formData.contact_phone) contact_info.phone = formData.contact_phone;
    if (formData.contact_email) contact_info.email = formData.contact_email;

    const submitData: CreateJobSiteData | UpdateJobSiteData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      vehicle_capacity: formData.vehicle_capacity,
      visitor_capacity: formData.visitor_capacity,
      truck_capacity: formData.truck_capacity,
      contact_info: Object.keys(contact_info).length > 0 ? contact_info : undefined,
    };

    onSubmit(submitData);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: field.includes('capacity') ? parseInt(value) || 0 : value,
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
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            value={formData.address}
            onChange={handleChange('address')}
            error={!!errors.address}
            helperText={errors.address}
            required
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Vehicle Capacity"
            type="number"
            value={formData.vehicle_capacity}
            onChange={handleChange('vehicle_capacity')}
            error={!!errors.vehicle_capacity}
            helperText={errors.vehicle_capacity}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Visitor Capacity"
            type="number"
            value={formData.visitor_capacity}
            onChange={handleChange('visitor_capacity')}
            error={!!errors.visitor_capacity}
            helperText={errors.visitor_capacity}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Truck Capacity"
            type="number"
            value={formData.truck_capacity}
            onChange={handleChange('truck_capacity')}
            error={!!errors.truck_capacity}
            helperText={errors.truck_capacity}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Contact Information (Optional)
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone"
            value={formData.contact_phone}
            onChange={handleChange('contact_phone')}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.contact_email}
            onChange={handleChange('contact_email')}
            error={!!errors.contact_email}
            helperText={errors.contact_email}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="contained">
              {jobSite ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};



