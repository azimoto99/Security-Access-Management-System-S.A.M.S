import React, { useState, useEffect } from 'react';
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
  Chip,
  Autocomplete,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { User, CreateUserData, UpdateUserData } from '../services/userService';
import type { JobSite } from '../services/jobSiteService';

interface UserFormProps {
  user?: User | null;
  jobSites: JobSite[];
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, jobSites, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'guard' as 'guard' | 'admin' | 'employee' | 'client',
    job_site_access: [] as string[],
    employee_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedJobSites, setSelectedJobSites] = useState<JobSite[]>([]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '', // Don't populate password
        role: user.role || 'guard',
        job_site_access: user.job_site_access || [],
        employee_id: user.employee_id || '',
      });
      // Set selected job sites
      const sites = jobSites.filter((site) => user.job_site_access?.includes(site.id));
      setSelectedJobSites(sites);
    }
  }, [user, jobSites]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Password required only for new users
    if (!user && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (!user && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData: CreateUserData | UpdateUserData = {
      username: formData.username.trim(),
      role: formData.role,
      job_site_access: selectedJobSites.map((site) => site.id),
      employee_id: formData.employee_id.trim() || undefined,
    };

    // Include password only for new users
    if (!user && formData.password) {
      (submitData as CreateUserData).password = formData.password;
    }

    onSubmit(submitData);
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

  const handleJobSitesChange = (_event: any, newValue: JobSite[]) => {
    setSelectedJobSites(newValue);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            onChange={handleChange('username')}
            error={!!errors.username}
            helperText={errors.username}
            required
            disabled={!!user} // Username cannot be changed after creation
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!errors.role}>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={handleSelectChange('role')}
              label="Role"
            >
              <MenuItem value="guard">Guard</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="client">Client</MenuItem>
            </Select>
            {errors.role && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {errors.role}
              </Typography>
            )}
          </FormControl>
        </Grid>
        {!user && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              error={!!errors.password}
              helperText={errors.password || 'Minimum 8 characters'}
              required
            />
          </Grid>
        )}
        {formData.role === 'employee' && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Employee ID"
              value={formData.employee_id}
              onChange={handleChange('employee_id')}
              helperText="Optional: Link to HR system"
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <Autocomplete
            multiple
            options={jobSites.filter((site) => site.is_active)}
            getOptionLabel={(option) => option.name}
            value={selectedJobSites}
            onChange={handleJobSitesChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Job Site Access"
                helperText="Select job sites this user can access"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="contained">
              {user ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};



