import api from './api';
import type { ApiResponse } from './api';

export interface Photo {
  id: string;
  entry_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  thumbnail_path: string;
  uploaded_at: string;
}

export const photoService = {
  /**
   * Upload photos for an entry
   */
  async uploadPhotos(entryId: string, files: File[]): Promise<{ photos: Photo[]; errors?: any[] }> {
    const formData = new FormData();
    formData.append('entry_id', entryId);
    files.forEach((file) => {
      formData.append('photos', file);
    });

    const response = await api.post<ApiResponse<{ photos: Photo[]; errors?: any[] }>>(
      '/photos/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to upload photos');
  },

  /**
   * Get photos for an entry
   */
  async getEntryPhotos(entryId: string): Promise<Photo[]> {
    const response = await api.get<ApiResponse<{ photos: Photo[] }>>(`/photos/entry/${entryId}`);
    if (response.data.success && response.data.data) {
      return response.data.data.photos;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch photos');
  },

  /**
   * Get photo URL
   */
  getPhotoUrl(photoId: string, thumbnail = false): string {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    return `${API_BASE_URL}/photos/${photoId}${thumbnail ? '?thumbnail=true' : ''}`;
  },

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/photos/${photoId}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete photo');
    }
  },
};



