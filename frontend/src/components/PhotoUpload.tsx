import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  IconButton,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { CloudUpload, Delete, Camera, CameraAlt } from '@mui/icons-material';

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
  onUploadStart?: () => void;
  onUploadError?: () => void;
  onPhotosChange?: (hasPhotos: boolean) => void;
  maxPhotos?: number;
  maxFileSize?: number; // in bytes
}

export interface PhotoUploadRef {
  uploadPhotos: () => Promise<void>;
  hasPhotos: () => boolean;
}

export const PhotoUpload = forwardRef<PhotoUploadRef, PhotoUploadProps>(({
  entryId,
  onUploadComplete,
  onUploadStart,
  onUploadError,
  onPhotosChange,
  maxPhotos = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}, ref) => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const openCamera = () => {
    // On mobile devices, use native camera app via file input with capture attribute
    if (isMobileDevice() && cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      // Fallback to web camera for desktop
      setCameraError(null);
      setCameraOpen(true);
    }
  };

  const handleCameraInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(e.target.files);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    },
    [addFiles]
  );

  // Start camera when dialog opens
  useEffect(() => {
    if (cameraOpen && videoRef.current) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }, // Prefer back camera on mobile
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } catch (err: any) {
          console.error('Error accessing camera:', err);
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera access denied. Please allow camera access in your browser settings.'
              : err.name === 'NotFoundError'
              ? 'No camera found on this device.'
              : 'Failed to access camera. Please try again.'
          );
        }
      };

      startCamera();
    }

    // Cleanup when dialog closes
    return () => {
      if (!cameraOpen && streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen]);

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob, then to File
    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        // Validate and add the file
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          closeCamera();
          return;
        }

        if (photos.length >= maxPhotos) {
          setError(`Maximum ${maxPhotos} photos allowed`);
          closeCamera();
          return;
        }

        const preview = URL.createObjectURL(file);
        setPhotos((prev) => [
          ...prev,
          {
            file,
            preview,
            id: Date.now() + Math.random().toString(),
          },
        ]);

        closeCamera();
      },
      'image/jpeg',
      0.9
    );
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleUpload = async () => {
    if (!entryId) {
      setError('Entry ID is required');
      if (onUploadError) onUploadError();
      return;
    }

    if (photos.length === 0) {
      setError('Please select at least one photo');
      if (onUploadError) onUploadError();
      return;
    }

    try {
      setError(null);
      if (onUploadStart) onUploadStart();
      
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
        if (onUploadError) onUploadError();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos');
      setPhotos((prev) => prev.map((p) => ({ ...p, uploading: false })));
      if (onUploadError) onUploadError();
    }
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    uploadPhotos: handleUpload,
    hasPhotos: () => photos.length > 0,
  }));

  // Notify parent when photos change
  useEffect(() => {
    if (onPhotosChange) {
      onPhotosChange(photos.length > 0);
    }
  }, [photos.length, onPhotosChange]);

  // Auto-upload photos when entryId becomes available and we have photos
  useEffect(() => {
    if (entryId && photos.length > 0 && !photos.some(p => p.uploading)) {
      // Only auto-upload if photos aren't already being uploaded
      handleUpload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, photos.length]);

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
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          capture="environment"
          onChange={handleCameraInput}
          style={{ display: 'none' }}
        />
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag and drop photos here, or click to select
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          JPEG or PNG, max {Math.round(maxFileSize / 1024 / 1024)}MB per file, up to {maxPhotos} photos
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= maxPhotos}
            startIcon={<CloudUpload />}
          >
            Select Photos
          </Button>
          <Button
            variant="outlined"
            onClick={openCamera}
            disabled={photos.length >= maxPhotos}
            startIcon={<CameraAlt />}
          >
            Take Photo
          </Button>
        </Box>
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

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onClose={closeCamera} maxWidth="sm" fullWidth>
        <DialogTitle>Take Photo</DialogTitle>
        <DialogContent>
          {cameraError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cameraError}
            </Alert>
          ) : (
            <Box sx={{ position: 'relative', width: '100%', paddingTop: '75%', minHeight: 300 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: '#000',
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCamera}>Cancel</Button>
          {!cameraError && streamRef.current && (
            <Button
              onClick={capturePhoto}
              variant="contained"
              startIcon={<Camera />}
              color="primary"
            >
              Capture
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
});

PhotoUpload.displayName = 'PhotoUpload';



