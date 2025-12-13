import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogContent,
  CircularProgress,
  Typography,
} from '@mui/material';
import { ZoomIn, Delete } from '@mui/icons-material';
import { photoService, type Photo } from '../services/photoService';
import { useAuth } from '../contexts/AuthContext';

interface PhotoGalleryProps {
  entryId: string;
  onDelete?: (photoId: string) => void;
  allowDelete?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  entryId,
  onDelete,
  allowDelete = false,
}) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [entryId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await photoService.getEntryPhotos(entryId);
      setPhotos(data);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      setDeleting(photoId);
      await photoService.deletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (onDelete) {
        onDelete(photoId);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (photos.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          No photos available
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {photos.map((photo) => (
          <Grid item xs={6} sm={4} md={3} key={photo.id}>
            <Paper
              sx={{
                position: 'relative',
                paddingTop: '100%', // Square aspect ratio
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'grey.100',
                }}
              >
                <img
                  src={photoService.getPhotoUrl(photo.id, true)}
                  alt={photo.filename}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedPhoto(photo)}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => setSelectedPhoto(photo)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                  },
                }}
              >
                <ZoomIn fontSize="small" />
              </IconButton>
              {allowDelete && (user?.role === 'admin' || user?.role === 'guard') && (
                <IconButton
                  size="small"
                  onClick={() => handleDelete(photo.id)}
                  disabled={deleting === photo.id}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'error.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'error.dark',
                    },
                  }}
                >
                  {deleting === photo.id ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Delete fontSize="small" />
                  )}
                </IconButton>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Full-size photo dialog */}
      <Dialog
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, textAlign: 'center' }}>
          {selectedPhoto && (
            <img
              src={photoService.getPhotoUrl(selectedPhoto.id)}
              alt={selectedPhoto.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};



