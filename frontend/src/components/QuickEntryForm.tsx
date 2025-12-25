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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
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
  const [entryType, setEntryType] = useState<EntryType>('truck');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [createdEntryId, setCreatedEntryId] = useState<string | null>(null);
  const identifierInputRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<PhotoUploadRef | null>(null);
  const autofillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutofilledRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // Initialize form data when entry type changes
  useEffect(() => {
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
    setErrors({});
    hasAutofilledRef.current = false;
    setTimeout(() => identifierInputRef.current?.focus(), 100);
  }, [entryType]);

  // Autofill from previous entries
  useEffect(() => {
    if (entryType !== 'vehicle' && entryType !== 'truck') {
      return;
    }

    const licensePlate = formData.license_plate?.trim().toUpperCase();
    const truckNumber = entryType === 'truck' ? formData.truck_number?.trim() : null;
    
    const hasSearchValue = 
      (licensePlate && licensePlate.length >= 2) || 
      (truckNumber && truckNumber.length >= 2);
    
    if (!hasSearchValue) {
      return;
    }

    if (autofillTimeoutRef.current) {
      clearTimeout(autofillTimeoutRef.current);
    }

    autofillTimeoutRef.current = setTimeout(async () => {
      try {
        const searchParams: any = {
          entry_type: entryType,
          limit: '1',
        };

        if (licensePlate && licensePlate.length >= 2) {
          searchParams.license_plate = licensePlate;
        }

        if (entryType === 'truck' && truckNumber && truckNumber.length >= 2) {
          searchParams.search_term = truckNumber;
        }

        const response = await entryService.searchEntries(searchParams);

        if (response.entries && response.entries.length > 0) {
          const previousEntry = response.entries[0];
          const entryData = previousEntry.entry_data || {};

          setFormData((prev) => {
            const updated = { ...prev };
            let hasChanges = false;

            if (entryType === 'vehicle') {
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
            }

            return updated;
          });
        }
      } catch (error) {
        console.log('Autofill search failed:', error);
      }
    }, 4000);

    return () => {
      if (autofillTimeoutRef.current) {
        clearTimeout(autofillTimeoutRef.current);
      }
    };
  }, [formData.license_plate, formData.truck_number, entryType]);

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

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
    if (Object.keys(newErrors).length > 0) {
      showSnackbar('Please fill in all required fields', 'error');
      return false;
    }
    return true;
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSelectChange = (field: string) => (e: any) => {
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
      const entryData: Record<string, any> = { ...formData };

      // Clean up expected_duration
      if (entryData.expected_duration === '') {
        delete entryData.expected_duration;
      } else if (entryData.expected_duration) {
        entryData.expected_duration = parseInt(entryData.expected_duration);
      }

      // Remove empty optional fields
      Object.keys(entryData).forEach((key) => {
        if (entryData[key] === '') {
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
      const identifier = entryType === 'visitor' 
        ? formData.name 
        : formData.license_plate?.toUpperCase() || '';
      showSnackbar(`✓ ${identifier} logged successfully`, 'success');

      // Callback to parent
      if (onEntryCreated) {
        onEntryCreated(entry);
      }

      // If no photos, we can reset the submitting state immediately
      // Otherwise, it will be reset when photos finish uploading
      if (!hasPhotos) {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        
        // Reset form
        setEntryType('truck');
        setShowOptionalFields(false);
        setCreatedEntryId(null);
        
        // Refocus identifier field
        setTimeout(() => {
          identifierInputRef.current?.focus();
        }, 100);
      }
      // If there are photos, the form will reset after photos finish uploading via callbacks

    } catch (error: any) {
      showSnackbar(error.message || 'Failed to create entry', 'error');
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter key (unless in textarea or multiline field)
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement && !e.shiftKey) {
      // Check if it's a textarea by checking the tagName
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleSubmit(e as any);
      }
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, overflowY: 'auto', overflowX: 'hidden' }}>
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
              onChange={(e) => setEntryType(e.target.value as EntryType)}
              label="Entry Type"
            >
              <MenuItem value="vehicle">Vehicle</MenuItem>
              <MenuItem value="visitor">Visitor</MenuItem>
              <MenuItem value="truck">Truck</MenuItem>
            </Select>
          </FormControl>

          {/* Vehicle Fields */}
          {entryType === 'vehicle' && (
            <>
              <TextField
                inputRef={identifierInputRef}
                label="License Plate"
                placeholder="ABC-123"
                value={formData.license_plate || ''}
                onChange={handleChange('license_plate')}
                error={!!errors.license_plate}
                helperText={errors.license_plate}
                required
                fullWidth
                size="small"
                autoFocus
                autoComplete="off"
              />
              <TextField
                label="Vehicle Type"
                placeholder="Car, SUV, Van, etc."
                value={formData.vehicle_type || ''}
                onChange={handleChange('vehicle_type')}
                error={!!errors.vehicle_type}
                helperText={errors.vehicle_type}
                required
                fullWidth
                size="small"
                autoComplete="off"
              />
              <TextField
                label="Driver Name"
                value={formData.driver_name || ''}
                onChange={handleChange('driver_name')}
                error={!!errors.driver_name}
                helperText={errors.driver_name}
                required
                fullWidth
                size="small"
                autoComplete="off"
              />
              <TextField
                label="Company"
                value={formData.company || ''}
                onChange={handleChange('company')}
                fullWidth
                size="small"
                autoComplete="off"
              />
              <TextField
                label="Purpose"
                value={formData.purpose || ''}
                onChange={handleChange('purpose')}
                error={!!errors.purpose}
                helperText={errors.purpose}
                required
                fullWidth
                size="small"
                autoComplete="off"
              />
            </>
          )}

          {/* Visitor Fields */}
          {entryType === 'visitor' && (
            <>
              <TextField
                inputRef={identifierInputRef}
                label="Name"
                placeholder="John Doe"
                value={formData.name || ''}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
                fullWidth
                size="small"
                autoFocus
                autoComplete="off"
              />
              <TextField
                label="Company"
                value={formData.company || ''}
                onChange={handleChange('company')}
                fullWidth
                size="small"
                autoComplete="off"
              />
              <TextField
                label="Contact Phone"
                value={formData.contact_phone || ''}
                onChange={handleChange('contact_phone')}
                fullWidth
                size="small"
                autoComplete="off"
              />
              <TextField
                label="Host Contact"
                value={formData.host_contact || ''}
                onChange={handleChange('host_contact')}
                fullWidth
                size="small"
                autoComplete="off"
              />
              <TextField
                label="Purpose"
                value={formData.purpose || ''}
                onChange={handleChange('purpose')}
                error={!!errors.purpose}
                helperText={errors.purpose}
                required
                fullWidth
                size="small"
                autoComplete="off"
              />
            </>
          )}

          {/* Truck Fields */}
          {entryType === 'truck' && (
            <>
              <TextField
                inputRef={identifierInputRef}
                label="License Plate"
                placeholder="TRK-456"
                value={formData.license_plate || ''}
                onChange={handleChange('license_plate')}
                error={!!errors.license_plate}
                helperText={errors.license_plate}
                required
                fullWidth
                size="small"
                autoFocus
                autoComplete="off"
              />
              <TextField
                label="Truck Number"
                value={formData.truck_number || ''}
                onChange={handleChange('truck_number')}
                fullWidth
                size="small"
                autoComplete="off"
              />
              <TextField
                label="Trailer Number"
                value={formData.trailer_number || ''}
                onChange={handleChange('trailer_number')}
                fullWidth
                size="small"
                autoComplete="off"
              />
              <TextField
                label="Company"
                value={formData.company || ''}
                onChange={handleChange('company')}
                error={!!errors.company}
                helperText={errors.company}
                required
                fullWidth
                size="small"
                autoComplete="off"
              />
              <TextField
                label="Driver Name"
                value={formData.driver_name || ''}
                onChange={handleChange('driver_name')}
                error={!!errors.driver_name}
                helperText={errors.driver_name}
                required
                fullWidth
                size="small"
                autoComplete="off"
              />
              <FormControl fullWidth size="small" required error={!!errors.delivery_pickup}>
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
              <TextField
                label="Cargo Description"
                value={formData.cargo_description || ''}
                onChange={handleChange('cargo_description')}
                fullWidth
                size="small"
                multiline
                rows={2}
                autoComplete="off"
              />
            </>
          )}

          {/* Optional Fields (Collapsible) */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                mb: showOptionalFields ? 1 : 0,
              }}
              onClick={() => setShowOptionalFields(!showOptionalFields)}
            >
              <Typography variant="body2" sx={{ color: '#b0b0b0', flexGrow: 1 }}>
                Additional Information (Optional)
              </Typography>
              <IconButton size="small">
                {showOptionalFields ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={showOptionalFields}>
              <TextField
                label="Expected Duration (minutes)"
                type="number"
                value={formData.expected_duration || ''}
                onChange={handleChange('expected_duration')}
                error={!!errors.expected_duration}
                helperText={errors.expected_duration}
                fullWidth
                size="small"
                inputProps={{ min: 0 }}
                autoComplete="off"
              />
            </Collapse>
          </Box>

          {/* Photo Upload */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Upload Photos (Optional)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <PhotoUpload
                entryId={createdEntryId || undefined}
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
                  
                  // Reset form after photos are uploaded
                  setEntryType('truck');
                  setShowOptionalFields(false);
                  setCreatedEntryId(null);
                  
                  // Refocus identifier field
                  setTimeout(() => {
                    identifierInputRef.current?.focus();
                  }, 100);
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

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || isUploadingPhotos}
            startIcon={isSubmitting || isUploadingPhotos ? <CircularProgress size={20} /> : <CheckCircle />}
            sx={{
              mt: 'auto',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {isUploadingPhotos ? 'Uploading Photos...' : isSubmitting ? 'Logging...' : 'LOG ENTRY'}
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
