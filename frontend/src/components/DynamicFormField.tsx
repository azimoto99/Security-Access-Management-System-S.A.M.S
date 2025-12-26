import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { CustomField } from '../services/customFieldService';

interface DynamicFormFieldProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  gridSize?: { xs?: number; sm?: number; md?: number };
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  gridSize = { xs: 12, sm: 6 },
  size = 'medium',
  fullWidth = true,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue: any = e.target.value;
    
    // Convert to number if field type is number
    if (field.field_type === 'number') {
      newValue = newValue === '' ? '' : Number(newValue);
    }
    
    onChange(newValue);
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    onChange(e.target.value);
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const renderField = () => {
    switch (field.field_type) {
      case 'select':
        return (
          <FormControl fullWidth={fullWidth} size={size} error={!!error} required={field.is_required}>
            <InputLabel>{field.field_label}</InputLabel>
            <Select
              value={value || ''}
              onChange={handleSelectChange}
              label={field.field_label}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value || false}
                onChange={handleSwitchChange}
              />
            }
            label={field.field_label}
          />
        );

      case 'textarea':
        return (
          <TextField
            fullWidth={fullWidth}
            size={size}
            label={field.field_label}
            value={value || ''}
            onChange={handleChange}
            error={!!error}
            helperText={error || field.help_text}
            required={field.is_required}
            placeholder={field.placeholder}
            multiline
            rows={3}
            inputProps={{
              minLength: field.validation?.minLength,
              maxLength: field.validation?.maxLength,
            }}
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth={fullWidth}
            size={size}
            label={field.field_label}
            type="date"
            value={value || ''}
            onChange={handleChange}
            error={!!error}
            helperText={error || field.help_text}
            required={field.is_required}
            placeholder={field.placeholder}
            InputLabelProps={{
              shrink: true,
            }}
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth={fullWidth}
            size={size}
            label={field.field_label}
            type="number"
            value={value || ''}
            onChange={handleChange}
            error={!!error}
            helperText={error || field.help_text}
            required={field.is_required}
            placeholder={field.placeholder}
            inputProps={{
              min: field.validation?.min,
              max: field.validation?.max,
            }}
          />
        );

      case 'email':
        return (
          <TextField
            fullWidth={fullWidth}
            size={size}
            label={field.field_label}
            type="email"
            value={value || ''}
            onChange={handleChange}
            error={!!error}
            helperText={error || field.help_text}
            required={field.is_required}
            placeholder={field.placeholder}
            inputProps={{
              minLength: field.validation?.minLength,
              maxLength: field.validation?.maxLength,
              pattern: field.validation?.pattern,
            }}
          />
        );

      case 'phone':
        return (
          <TextField
            fullWidth={fullWidth}
            size={size}
            label={field.field_label}
            type="tel"
            value={value || ''}
            onChange={handleChange}
            error={!!error}
            helperText={error || field.help_text}
            required={field.is_required}
            placeholder={field.placeholder}
            inputProps={{
              minLength: field.validation?.minLength,
              maxLength: field.validation?.maxLength,
              pattern: field.validation?.pattern,
            }}
          />
        );

      case 'text':
      default:
        return (
          <TextField
            fullWidth={fullWidth}
            size={size}
            label={field.field_label}
            value={value || ''}
            onChange={handleChange}
            error={!!error}
            helperText={error || field.help_text}
            required={field.is_required}
            placeholder={field.placeholder}
            inputProps={{
              minLength: field.validation?.minLength,
              maxLength: field.validation?.maxLength,
              pattern: field.validation?.pattern,
            }}
          />
        );
    }
  };

  return (
    <Grid item {...gridSize}>
      {renderField()}
    </Grid>
  );
};

