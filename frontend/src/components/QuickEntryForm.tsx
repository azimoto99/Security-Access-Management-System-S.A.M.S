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
import { useTranslation } from 'react-i18next';
import type { EntryType } from '../types/entry';
import { entryService } from '../services/entryService';
import { PhotoUpload, type PhotoUploadRef } from './PhotoUpload';
import { customFieldService, type CustomField } from '../services/customFieldService';
import { DynamicFormField } from './DynamicFormField';

interface QuickEntryFormProps {
  jobSiteId: string;
  onEntryCreated?: (entry: any) => void;
}

export const QuickEntryForm: React.FC<QuickEntryFormProps> = ({
  jobSiteId,
  onEntryCreated,
}) => {
  const { t } = useTranslation();
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
  const [fieldConfigs, setFieldConfigs] = useState<CustomField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const identifierInputRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<PhotoUploadRef | null>(null);
  const autofillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutofilledRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const lastAutofilledSearchRef = useRef<string | null>(null);

  // Load field configurations and initialize form data when entry type changes
  useEffect(() => {
    const loadFieldConfigs = async () => {
      try {
        setLoadingFields(true);
        const configs = await customFieldService.getCustomFields(jobSiteId, entryType);
        const activeConfigs = configs.filter((f) => f.is_active);
        setFieldConfigs(activeConfigs);
        
        // Initialize form data based on field configurations
        const initialFormData: Record<string, any> = {};
        activeConfigs.forEach((field) => {
          // Set default values based on field type
          if (field.field_type === 'boolean') {
            initialFormData[field.field_key] = false;
          } else if (field.field_type === 'select' && field.options && field.options.length > 0) {
            initialFormData[field.field_key] = field.options[0].value;
          } else {
            initialFormData[field.field_key] = '';
          }
        });
        
        setFormData(initialFormData);
      } catch (error) {
        console.error('Failed to load field configurations:', error);
        // Fallback to default initialization
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
      } finally {
        setLoadingFields(false);
      }
    };

    if (jobSiteId && entryType) {
      loadFieldConfigs();
    }
    setErrors({});
    hasAutofilledRef.current = false;
    lastAutofilledSearchRef.current = null;
    setTimeout(() => identifierInputRef.current?.focus(), 100);
  }, [entryType, jobSiteId]);

  // Autofill from previous entries
  useEffect(() => {
    if (entryType !== 'vehicle' && entryType !== 'truck') {
      return;
    }

    const licensePlate = formData.license_plate?.trim().toUpperCase();
    const truckNumber = entryType === 'truck' ? formData.truck_number?.trim() : null;
    
    // Create a search key from the current input
    const currentSearchKey = entryType === 'truck' 
      ? `${licensePlate || ''}|${truckNumber || ''}`
      : licensePlate || '';
    
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
              lastAutofilledSearchRef.current = currentSearchKey;
            }

            return updated;
          });
        }
      } catch (error) {
        console.log('Autofill search failed:', error);
      }
    }, 2000); // 2 second delay for autocomplete

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

    // Validate based on field configurations
    if (fieldConfigs.length > 0) {
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
    } else {
      // Fallback validation for default fields
      if (entryType === 'vehicle') {
        if (!formData.license_plate?.trim()) newErrors.license_plate = t('entryForm.licensePlateRequired');
        if (!formData.vehicle_type?.trim()) newErrors.vehicle_type = t('entryForm.vehicleTypeRequired');
        if (!formData.driver_name?.trim()) newErrors.driver_name = t('entryForm.driverNameRequired');
        if (!formData.purpose?.trim()) newErrors.purpose = t('entryForm.purposeRequired');
      } else if (entryType === 'visitor') {
        if (!formData.name?.trim()) newErrors.name = t('entryForm.nameRequired');
        if (!formData.purpose?.trim()) newErrors.purpose = t('entryForm.purposeRequired');
      } else if (entryType === 'truck') {
        if (!formData.license_plate?.trim()) newErrors.license_plate = t('entryForm.licensePlateRequired');
        if (!formData.company?.trim()) newErrors.company = t('entryForm.companyRequired');
        if (!formData.driver_name?.trim()) newErrors.driver_name = t('entryForm.driverNameRequired');
        if (!formData.delivery_pickup) newErrors.delivery_pickup = t('entryForm.deliveryPickupRequired');
      }

      if (formData.expected_duration && (isNaN(formData.expected_duration) || formData.expected_duration < 0)) {
        newErrors.expected_duration = t('entryForm.expectedDurationInvalid');
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showSnackbar(t('entryForm.fillRequiredFields'), 'error');
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
      showSnackbar(t('entryForm.loggedSuccessfully', { identifier }), 'success');

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
      showSnackbar(error.message || t('entryForm.failedToCreate'), 'error');
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
          {t('entryForm.logNewEntry')}
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}
        >
          {/* Entry Type */}
          <FormControl fullWidth size="small">
            <InputLabel>{t('entryForm.entryType')}</InputLabel>
            <Select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as EntryType)}
              label={t('entryForm.entryType')}
            >
              <MenuItem value="vehicle">{t('entryForm.vehicle')}</MenuItem>
              <MenuItem value="visitor">{t('entryForm.visitor')}</MenuItem>
              <MenuItem value="truck">{t('entryForm.truck')}</MenuItem>
            </Select>
          </FormControl>

          {/* Dynamic Fields */}
          {loadingFields ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : fieldConfigs.length > 0 ? (
            fieldConfigs
              .sort((a, b) => a.display_order - b.display_order)
              .map((field, index) => {
                // Set ref for the first field (identifier field) for autofocus
                const isFirstField = index === 0;
                const isIdentifierField = 
                  (entryType === 'vehicle' && field.field_key === 'license_plate') ||
                  (entryType === 'visitor' && field.field_key === 'name') ||
                  (entryType === 'truck' && field.field_key === 'license_plate');

                return (
                  <Box key={field.id} sx={{ width: '100%' }}>
                    <DynamicFormField
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
                      gridSize={{}}
                      size="small"
                      fullWidth
                    />
                  </Box>
                );
              })
          ) : (
            // Fallback to hardcoded fields if no configurations
            <>
              {entryType === 'vehicle' && (
                <>
                  <TextField
                    inputRef={identifierInputRef}
                    label={t('entryForm.licensePlate')}
                    placeholder={t('entryForm.licensePlatePlaceholder')}
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
                    label={t('entryForm.vehicleType')}
                    placeholder={t('entryForm.vehicleTypePlaceholder')}
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
                    label={t('entryForm.driverName')}
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
                    label={t('entryForm.company')}
                    value={formData.company || ''}
                    onChange={handleChange('company')}
                    fullWidth
                    size="small"
                    autoComplete="off"
                  />
                  <TextField
                    label={t('entryForm.purpose')}
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

              {entryType === 'visitor' && (
                <>
                  <TextField
                    inputRef={identifierInputRef}
                    label={t('entryForm.name')}
                    placeholder={t('entryForm.namePlaceholder')}
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
                    label={t('entryForm.company')}
                    value={formData.company || ''}
                    onChange={handleChange('company')}
                    fullWidth
                    size="small"
                    autoComplete="off"
                  />
                  <TextField
                    label={t('entryForm.contactPhone')}
                    value={formData.contact_phone || ''}
                    onChange={handleChange('contact_phone')}
                    fullWidth
                    size="small"
                    autoComplete="off"
                  />
                  <TextField
                    label={t('entryForm.hostContact')}
                    value={formData.host_contact || ''}
                    onChange={handleChange('host_contact')}
                    fullWidth
                    size="small"
                    autoComplete="off"
                  />
                  <TextField
                    label={t('entryForm.purpose')}
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

              {entryType === 'truck' && (
                <>
                  <TextField
                    inputRef={identifierInputRef}
                    label={t('entryForm.licensePlate')}
                    placeholder={t('entryForm.truckPlaceholder')}
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
                    label={t('entryForm.truckNumber')}
                    value={formData.truck_number || ''}
                    onChange={handleChange('truck_number')}
                    fullWidth
                    size="small"
                    autoComplete="off"
                  />
                  <TextField
                    label={t('entryForm.trailerNumber')}
                    value={formData.trailer_number || ''}
                    onChange={handleChange('trailer_number')}
                    fullWidth
                    size="small"
                    autoComplete="off"
                  />
                  <TextField
                    label={t('entryForm.company')}
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
                    label={t('entryForm.driverName')}
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
                    <InputLabel>{t('entryForm.deliveryPickup')}</InputLabel>
                    <Select
                      value={formData.delivery_pickup || 'delivery'}
                      onChange={handleSelectChange('delivery_pickup')}
                      label={t('entryForm.deliveryPickup')}
                    >
                      <MenuItem value="delivery">{t('entryForm.delivery')}</MenuItem>
                      <MenuItem value="pickup">{t('entryForm.pickup')}</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label={t('entryForm.cargoDescription')}
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
            </>
          )}

          {/* Optional Fields (Collapsible) - Only show if expected_duration is not in field configs */}
          {(!fieldConfigs.length || !fieldConfigs.some(f => f.field_key === 'expected_duration')) && (
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
                  {t('entryForm.additionalInfo')}
                </Typography>
                <IconButton size="small">
                  {showOptionalFields ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={showOptionalFields}>
                <TextField
                  label={t('entryForm.expectedDuration')}
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
          )}

          {/* Photo Upload */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>{t('entryForm.uploadPhotos')}</Typography>
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
            {isUploadingPhotos ? t('entryForm.uploadingPhotos') : isSubmitting ? t('entryForm.logging') : t('entryForm.logEntry')}
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
