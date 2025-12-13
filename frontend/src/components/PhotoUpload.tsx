import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  IconButton,
  LinearProgress,
  Alert,
} from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';

interface PhotoFile {
  file: File;
  preview: string;
  id: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface PhotoUploadProps {
  entryId?: string;
  onUploadComplete?: (photoIds: string[]) => void;
  maxPhotos?: number;
  maxFileSize?: number; // in bytes
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  entryId,
  onUploadComplete,
  maxPhotos = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'File must be an image';
    }
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return 'Only JPEG and PNG images are allowed';
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }

    return null;
  };

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newPhotos: PhotoFile[] = [];
      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        if (photos.length + newPhotos.length >= maxPhotos) {
          errors.push(`Maximum ${maxPhotos} photos allowed`);
          return;
        }

        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          return;
        }

        const preview = URL.createObjectURL(file);
        newPhotos.push({
          file,
          preview,
          id: Date.now() + Math.random().toString(),
        });
      });

      if (errors.length > 0) {
        setError(errors.join(', '));
      }

      if (newPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...newPhotos]);
        setError(null);
      }
    },
    [photos.length, maxPhotos, maxFileSize]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addFiles]
  );

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleUpload = async () => {
    if (!entryId) {
      setError('Entry ID is required');
      return;
    }

    if (photos.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    try {
      setError(null);
      const { photoService } = await import('../services/photoService');

      // Mark all as uploading
      setPhotos((prev) => prev.map((p) => ({ ...p, uploading: true, progress: 0 })));

      // Upload photos
      const files = photos.map((p) => p.file);
      const result = await photoService.uploadPhotos(entryId, files);

      // Clean up preview URLs
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));

      // Clear photos
      setPhotos([]);

      if (onUploadComplete && result.photos) {
        onUploadComplete(result.photos.map((p) => p.id));
      }

      if (result.errors && result.errors.length > 0) {
        setError(`Some photos failed to upload: ${result.errors.map((e: any) => e.filename).join(', ')}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos');
      setPhotos((prev) => prev.map((p) => ({ ...p, uploading: false })));
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        variant="outlined"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 3,
          textAlign: 'center',
          border: dragActive ? '2px dashed' : '1px solid',
          borderColor: dragActive ? 'primary.main' : 'divider',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag and drop photos here, or click to select
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          JPEG or PNG, max {Math.round(maxFileSize / 1024 / 1024)}MB per file, up to {maxPhotos} photos
        </Typography>
        <Button
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= maxPhotos}
        >
          Select Photos
        </Button>
      </Paper>

      {photos.length > 0 && (
        <Box sx={{ mt: 3 }}>
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
                      src={photo.preview}
                      alt={photo.file.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                  {photo.uploading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        p: 1,
                      }}
                    >
                      <LinearProgress
                        variant={photo.progress !== undefined ? 'determinate' : 'indeterminate'}
                        value={photo.progress}
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption">Uploading...</Typography>
                    </Box>
                  )}
                  {!photo.uploading && (
                    <IconButton
                      size="small"
                      onClick={() => removePhoto(photo.id)}
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
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      p: 0.5,
                      fontSize: '0.75rem',
                    }}
                  >
                    {photo.file.name}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {entryId && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handleUpload} disabled={photos.some((p) => p.uploading)}>
                Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};



