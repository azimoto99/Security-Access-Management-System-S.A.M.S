import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Close,
  DirectionsCar,
  Person,
  LocalShipping,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { entryService, type Entry } from '../services/entryService';
import { photoService } from '../services/photoService';

interface EntryDetailDialogProps {
  open: boolean;
  entryId: string | null;
  onClose: () => void;
}

const getEntryTypeIcon = (entryType: string) => {
  switch (entryType) {
    case 'vehicle':
      return <DirectionsCar />;
    case 'truck':
      return <LocalShipping />;
    case 'visitor':
      return <Person />;
    default:
      return <Person />;
  }
};

export const EntryDetailDialog: React.FC<EntryDetailDialogProps> = ({
  open,
  entryId,
  onClose,
}) => {
  const { t } = useTranslation();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open && entryId) {
      loadEntry();
    } else {
      setEntry(null);
      setError(null);
      setExpandedImageIndex(null);
    }
  }, [open, entryId]);

  const loadEntry = async () => {
    if (!entryId) return;
    
    try {
      setLoading(true);
      setError(null);
      const entryData = await entryService.getEntryById(entryId);
      setEntry(entryData);
    } catch (err: any) {
      setError(err.message || t('common.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (index: number) => {
    if (expandedImageIndex === index) {
      setExpandedImageIndex(null);
    } else {
      setExpandedImageIndex(index);
    }
  };

  const getEntryDisplayName = (entry: Entry): string => {
    if (entry.entry_type === 'vehicle') {
      return entry.entry_data.license_plate || entry.entry_data.identifier || 'N/A';
    } else if (entry.entry_type === 'truck') {
      const parts = [];
      if (entry.entry_data.truck_number) parts.push(`Truck: ${entry.entry_data.truck_number}`);
      if (entry.entry_data.trailer_number) parts.push(`Trailer: ${entry.entry_data.trailer_number}`);
      return parts.length > 0 ? parts.join(' • ') : entry.entry_data.identifier || 'N/A';
    } else {
      return entry.entry_data.name || entry.entry_data.identifier || 'N/A';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {entry && getEntryTypeIcon(entry.entry_type)}
          <Typography variant="h6">{t('search.entryDetails')}</Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: '#b0b0b0', '&:hover': { color: '#ffffff' } }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : entry ? (
          <Box>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Entry Type */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                  {t('search.type')}
                </Typography>
                <Chip
                  label={entry.entry_type}
                  size="small"
                  icon={getEntryTypeIcon(entry.entry_type)}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                  {t('search.status')}
                </Typography>
                <Chip
                  label={entry.status}
                  size="small"
                  color={
                    entry.status === 'active'
                      ? 'success'
                      : entry.status === 'emergency_exit'
                      ? 'error'
                      : 'default'
                  }
                />
              </Grid>

              {/* Identifier/Display Name */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                  {t('search.identifier')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {getEntryDisplayName(entry)}
                </Typography>
              </Grid>

              {/* Company Name */}
              {entry.entry_data.company_name && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                    {t('search.company')}
                  </Typography>
                  <Typography variant="body1">{entry.entry_data.company_name}</Typography>
                </Grid>
              )}

              {/* Driver Name */}
              {entry.entry_data.driver_name && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                    {t('search.driver')}
                  </Typography>
                  <Typography variant="body1">{entry.entry_data.driver_name}</Typography>
                </Grid>
              )}

              {/* Truck Number */}
              {entry.entry_data.truck_number && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                    {t('search.truckNumber')}
                  </Typography>
                  <Typography variant="body1">{entry.entry_data.truck_number}</Typography>
                </Grid>
              )}

              {/* Trailer Number */}
              {entry.entry_data.trailer_number && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                    {t('search.trailerNumber')}
                  </Typography>
                  <Typography variant="body1">{entry.entry_data.trailer_number}</Typography>
                </Grid>
              )}

              {/* Entry Time */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                  {t('search.entryTime')}
                </Typography>
                <Typography variant="body1">
                  {new Date(entry.entry_time).toLocaleString()}
                </Typography>
              </Grid>

              {/* Exit Time */}
              {entry.exit_time && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                    {t('search.exitTime')}
                  </Typography>
                  <Typography variant="body1">
                    {new Date(entry.exit_time).toLocaleString()}
                  </Typography>
                </Grid>
              )}

              {/* Photos */}
              {entry.photos && entry.photos.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                    {t('search.photos')} ({entry.photos.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {entry.photos.map((photo, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          border: expandedImageIndex === index ? '2px solid #ffd700' : '1px solid #2a2a2a',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#ffd700',
                            transform: 'scale(1.05)',
                          },
                        }}
                        onClick={() => handleImageClick(index)}
                      >
                        <Box
                          component="img"
                          src={photoService.getPhotoUrl(photo, true)}
                          alt={`Photo ${index + 1}`}
                          sx={{
                            width: expandedImageIndex === index ? '400px' : '100px',
                            height: expandedImageIndex === index ? 'auto' : '100px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        {expandedImageIndex === index && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              borderRadius: '50%',
                              p: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ZoomOut sx={{ color: '#ffffff', fontSize: '1rem' }} />
                          </Box>
                        )}
                        {expandedImageIndex !== index && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              borderRadius: '50%',
                              p: 0.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ZoomIn sx={{ color: '#ffffff', fontSize: '1rem' }} />
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Entry ID */}
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 0.5 }}>
                  {t('search.entryId')}
                </Typography>
                <Typography variant="caption" sx={{ color: '#888', fontFamily: 'monospace' }}>
                  {entry.id}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: '#ffd700', color: '#ffd700' }}>
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

