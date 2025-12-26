import React, { useState, useEffect, useRef } from 'react';
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
import { useTranslation } from 'react-i18next';
import type { EntryType } from '../types/entry';
import { PhotoUpload, type PhotoUploadRef } from './PhotoUpload';
import { entryService } from '../services/entryService';
import { customFieldService, type CustomField } from '../services/customFieldService';
import { DynamicFormField } from './DynamicFormField';

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
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [fieldConfigs, setFieldConfigs] = useState<CustomField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const autofillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutofilledRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const photoUploadRef = useRef<PhotoUploadRef | null>(null);
  const lastAutofilledSearchRef = useRef<string | null>(null);

  // Load field configurations
  useEffect(() => {
    const loadFieldConfigs = async () => {
      try {
        setLoadingFields(true);
        const configs = await customFieldService.getCustomFields(jobSiteId, entryType);
        setFieldConfigs(configs.filter((f) => f.is_active));
        
        // Initialize form data based on field configurations
        const initialFormData: Record<string, any> = {};
        configs
          .filter((f) => f.is_active)
          .forEach((field) => {
            if (initialData && initialData[field.field_key] !== undefined) {
              initialFormData[field.field_key] = initialData[field.field_key];
            } else {
              // Set default values based on field type
              if (field.field_type === 'boolean') {
                initialFormData[field.field_key] = false;
              } else if (field.field_type === 'select' && field.options && field.options.length > 0) {
                initialFormData[field.field_key] = field.options[0].value;
              } else {
                initialFormData[field.field_key] = '';
              }
            }
          });
        
        setFormData(initialFormData);
      } catch (error) {
        console.error('Failed to load field configurations:', error);
        // Fallback to default initialization
        if (initialData) {
          setFormData(initialData);
        } else {
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
                truck_number: '',
                trailer_number: '',
                company: '',
                driver_name: '',
                cargo_description: '',
                delivery_pickup: 'delivery',
                expected_duration: '',
              });
              break;
          }
        }
      } finally {
        setLoadingFields(false);
      }
    };

    if (jobSiteId && entryType) {
      loadFieldConfigs();
    }
    hasAutofilledRef.current = false;
    lastAutofilledSearchRef.current = null;
  }, [entryType, jobSiteId, initialData]);

  // Autofill from previous entries when license plate or truck number is entered
  useEffect(() => {
    // Only autofill for vehicle and truck entry types
    if (entryType !== 'vehicle' && entryType !== 'truck') {
      return;
    }

    const licensePlate = formData.license_plate?.trim().toUpperCase();
    const truckNumber = entryType === 'truck' ? formData.truck_number?.trim() : null;
    
    // Create a search key from the current input
    const currentSearchKey = entryType === 'truck' 
      ? `${licensePlate || ''}|${truckNumber || ''}`
      : licensePlate || '';
    
    // Don't autofill if both license plate and truck number are empty or too short
    const hasSearchValue = 
      (licensePlate && licensePlate.length >= 2) || 
      (truckNumber && truckNumber.length >= 2);
    
    // If user changed the search value after autofill, clear autofilled fields
    if (lastAutofilledSearchRef.current && currentSearchKey !== lastAutofilledSearchRef.current && hasSearchValue) {
      setFormData((prev) => {
        const updated = { ...prev };
        if (entryType === 'vehicle') {
          // Clear autofilled fields for vehicles
          if (hasAutofilledRef.current) {
            updated.driver_name = '';
            updated.company = '';
            updated.vehicle_type = '';
          }
        } else if (entryType === 'truck') {
          // Clear autofilled fields for trucks (but not license_plate or truck_number as those are search fields)
          if (hasAutofilledRef.current) {
            updated.driver_name = '';
            updated.company = '';
          }
        }
        hasAutofilledRef.current = false;
        return updated;
      });
    }
    
    if (!hasSearchValue) {
      lastAutofilledSearchRef.current = null;
      return;
    }

    // Clear previous timeout
    if (autofillTimeoutRef.current) {
      clearTimeout(autofillTimeoutRef.current);
    }

    // Debounce the search
    autofillTimeoutRef.current = setTimeout(async () => {
      try {
        // Build search params - search by license plate or truck number
        const searchParams: any = {
          entry_type: entryType,
          limit: '1', // Get the most recent entry
        };

        if (licensePlate && licensePlate.length >= 2) {
          searchParams.license_plate = licensePlate;
        }

        // For trucks, also search by truck_number if provided
        if (entryType === 'truck' && truckNumber && truckNumber.length >= 2) {
          // Use search_term to search in entry_data JSONB
          searchParams.search_term = truckNumber;
        }

        const response = await entryService.searchEntries(searchParams);

        if (response.entries && response.entries.length > 0) {
          const previousEntry = response.entries[0];
          const entryData = previousEntry.entry_data || {};

          // Only autofill if we haven't already autofilled for this search
          // and the fields are currently empty
          setFormData((prev) => {
            const updated = { ...prev };
            let hasChanges = false;

            if (entryType === 'vehicle') {
              // Autofill vehicle fields if they're empty
              if (!prev.driver_name && entryData.driver_name) {
                updated.driver_name = entryData.driver_name;
                hasChanges = true;
              }
              if (!prev.company && entryData.company) {
                updated.company = entryData.company;
                hasChanges = true;
              }
              if (!prev.vehicle_type && entryData.vehicle_type) {
                updated.vehicle_type = entryData.vehicle_type;
                hasChanges = true;
              }
            } else if (entryType === 'truck') {
              // Autofill truck fields if they're empty
              if (!prev.license_plate && entryData.license_plate) {
                updated.license_plate = entryData.license_plate;
                hasChanges = true;
              }
              if (!prev.truck_number && entryData.truck_number) {
                updated.truck_number = entryData.truck_number;
                hasChanges = true;
              }
              if (!prev.driver_name && entryData.driver_name) {
                updated.driver_name = entryData.driver_name;
                hasChanges = true;
              }
              if (!prev.company && entryData.company) {
                updated.company = entryData.company;
                hasChanges = true;
              }
            }

            if (hasChanges) {
              hasAutofilledRef.current = true;
              lastAutofilledSearchRef.current = currentSearchKey;
            }

            return updated;
          });
        }
      } catch (error) {
        // Silently fail - autofill is a convenience feature
        console.log('Autofill search failed:', error);
      }
    }, 2000); // 2 second delay for autocomplete

    return () => {
      if (autofillTimeoutRef.current) {
        clearTimeout(autofillTimeoutRef.current);
      }
    };
  }, [formData.license_plate, formData.truck_number, entryType]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate based on field configurations
    fieldConfigs.forEach((field) => {
      if (field.is_required) {
        const value = formData[field.field_key];
        if (field.field_type === 'boolean') {
          // Boolean fields are always valid (they default to false)
        } else if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[field.field_key] = `${field.field_label} is required`;
        }
      }

      // Validate field type specific rules
      const value = formData[field.field_key];
      if (value !== undefined && value !== null && value !== '') {
        if (field.field_type === 'number') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            newErrors[field.field_key] = `${field.field_label} must be a number`;
          } else {
            if (field.validation?.min !== undefined && numValue < field.validation.min) {
              newErrors[field.field_key] = `${field.field_label} must be at least ${field.validation.min}`;
            }
            if (field.validation?.max !== undefined && numValue > field.validation.max) {
              newErrors[field.field_key] = `${field.field_label} must be at most ${field.validation.max}`;
            }
          }
        } else if (typeof value === 'string') {
          if (field.validation?.minLength && value.length < field.validation.minLength) {
            newErrors[field.field_key] = `${field.field_label} must be at least ${field.validation.minLength} characters`;
          }
          if (field.validation?.maxLength && value.length > field.validation.maxLength) {
            newErrors[field.field_key] = `${field.field_label} must be at most ${field.validation.maxLength} characters`;
          }
          if (field.validation?.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(value)) {
              newErrors[field.field_key] = `${field.field_label} format is invalid`;
            }
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmittingRef.current || isSubmitting || isUploadingPhotos) {
      return;
    }

    if (!validate()) return;

    // Check if there are photos waiting to be uploaded
    const hasPhotos = photoUploadRef.current?.hasPhotos() || false;
    
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
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

      // Submit entry - if there are photos, we'll wait for entryId to be set
      // and then photos will auto-upload
      onSubmit(submitData);
      
      // If no photos, we can reset the submitting state immediately
      // Otherwise, it will be reset when photos finish uploading
      if (!hasPhotos) {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      }
    } catch (error) {
      console.error('Error submitting entry:', error);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
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

  const renderDynamicFields = () => {
    if (loadingFields) {
      return <Grid item xs={12}><Typography>Loading fields...</Typography></Grid>;
    }

    if (fieldConfigs.length > 0) {
      return fieldConfigs
        .sort((a, b) => a.display_order - b.display_order)
        .map((field) => (
          <DynamicFormField
            key={field.id}
            field={field}
            value={formData[field.field_key]}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, [field.field_key]: value }));
              if (errors[field.field_key]) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors[field.field_key];
                  return newErrors;
                });
              }
            }}
            error={errors[field.field_key]}
          />
        ));
    }

    // Fallback to hardcoded fields if no configurations
    if (entryType === 'vehicle') {
      return (
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
    } else if (entryType === 'visitor') {
      return (
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
    } else if (entryType === 'truck') {
      return (
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
              label="Truck Number"
              value={formData.truck_number || ''}
              onChange={handleChange('truck_number')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Trailer Number"
              value={formData.trailer_number || ''}
              onChange={handleChange('trailer_number')}
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
              label="Driver Name"
              value={formData.driver_name || ''}
              onChange={handleChange('driver_name')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
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
    }
    return null;
  };


  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {renderDynamicFields()}
        {!fieldConfigs.length && (
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
        )}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>{t('entryForm.uploadPhotos')}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <PhotoUpload
                entryId={entryId}
                maxPhotos={10}
                onUploadStart={() => {
                  setIsUploadingPhotos(true);
                }}
                onUploadComplete={(photoIds: string[]) => {
                  // Photos uploaded successfully
                  console.log('Photos uploaded:', photoIds);
                  setIsUploadingPhotos(false);
                  setIsSubmitting(false);
                  isSubmittingRef.current = false;
                }}
                onUploadError={() => {
                  setIsUploadingPhotos(false);
                  setIsSubmitting(false);
                  isSubmittingRef.current = false;
                }}
                onPhotosChange={(_hasPhotos: boolean) => {
                  // Track if there are photos ready to upload
                  // This callback is used to notify parent of photo state changes
                }}
                ref={photoUploadRef}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={onCancel} disabled={isSubmitting || isUploadingPhotos}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={isSubmitting || isUploadingPhotos}
            >
              {isUploadingPhotos ? 'Uploading Photos...' : isSubmitting ? 'Submitting...' : 'Submit Entry'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

