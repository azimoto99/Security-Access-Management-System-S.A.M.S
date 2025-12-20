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
    // Use the same API base URL logic as api.ts
    const getApiBaseUrl = (): string => {
      // Use environment variable if set (embedded at build time)
      const envApiUrl = import.meta.env.VITE_API_BASE_URL;
      if (envApiUrl) {
        // Don't use api.fixer.gg - use Render backend instead
        if (envApiUrl.includes('fixer.gg')) {
          return 'https://security-access-management-system-s-a-m-s.onrender.com/api';
        }
        return envApiUrl;
      }
      
      // Runtime detection for production
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        
        // If on Render frontend, use known backend URL
        if (host.includes('onrender.com')) {
          return 'https://security-access-management-system-s-a-m-s.onrender.com/api';
        }
        
        // For custom domains (like fixer.gg), use known backend URL
        if (host === 'fixer.gg' || host.includes('fixer.gg')) {
          return 'https://security-access-management-system-s-a-m-s.onrender.com/api';
        }
      }
      
      // Development default
      return 'http://localhost:3001/api';
    };
    
    const API_BASE_URL = getApiBaseUrl();
    
    // Get token from localStorage for image requests (since <img> tags don't send Authorization headers)
    // Try to refresh token if expired before generating URL
    const getToken = (): string | null => {
      if (typeof window === 'undefined') return null;
      
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      
      // Check if token is expired by decoding it (without verification)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        
        // If token expires in less than 1 minute, try to refresh it
        if (exp - now < 60000) {
          // Token is about to expire or expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            // Refresh token asynchronously (don't block URL generation)
            this.refreshTokenIfNeeded().catch(() => {
              // Silently fail - will use expired token and let backend handle it
            });
          }
        }
      } catch (e) {
        // If we can't decode the token, just use it as-is
      }
      
      return token;
    };
    
    const token = getToken();
    
    // Build query string
    const params = new URLSearchParams();
    params.set('thumbnail', thumbnail ? 'true' : 'false');
    if (token) {
      params.set('token', token);
    }
    
    return `${API_BASE_URL}/photos/${photoId}?${params.toString()}`;
  },

  /**
   * Refresh token if needed (for photo URLs)
   */
  async refreshTokenIfNeeded(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return;
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
        (window.location.hostname.includes('fixer.gg') 
          ? 'https://security-access-management-system-s-a-m-s.onrender.com/api'
          : 'http://localhost:3001/api');
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
        }
      }
    } catch (error) {
      // Silently fail - token refresh is best effort
      console.debug('Token refresh failed:', error);
    }
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



