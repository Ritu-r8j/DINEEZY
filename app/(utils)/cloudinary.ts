// Cloudinary utility functions for file uploads

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  original_filename: string;
  format: string;
  resource_type: string;
}

// Universal upload function that handles both images and videos
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void,
  folder: string = 'restaurants'
): Promise<CloudinaryUploadResponse> => {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing. Please check environment variables.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    // Determine resource type based on file type
    const isVideo = file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              secure_url: response.secure_url,
              public_id: response.public_id,
              original_filename: response.original_filename,
              format: response.format,
              resource_type: response.resource_type
            });
          } catch (parseError) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error('Cloudinary upload error:', errorResponse);
            reject(new Error(errorResponse.error?.message || `Upload failed with status ${xhr.status}`));
          } catch (parseError) {
            console.error('Upload failed with status:', xhr.status, 'Response:', xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed - network error'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out - please try again'));
      });

      // Set timeout for large files (5 minutes)
      xhr.timeout = 5 * 60 * 1000;

      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
      );
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};


// Upload image to Cloudinary
export const uploadImageToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please select a valid image file',
      };
    }

    const result = await uploadToCloudinary(file, undefined, 'restaurant-images');
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Upload video to Cloudinary
export const uploadVideoToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  try {
    // Check file size (limit to 50MB for better performance)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Video file size must be less than 50MB',
      };
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return {
        success: false,
        error: 'Please select a valid video file',
      };
    }

    console.log('Attempting to upload video:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    try {
      const result = await uploadToCloudinary(file, undefined, 'restaurant-videos');
      
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (uploadError) {
      console.error('Upload to Cloudinary failed:', uploadError);
      
      // Fallback: Try direct upload without folder
      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          throw new Error('Cloudinary configuration missing');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Direct upload failed:', errorText);
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        return {
          success: true,
          url: data.secure_url,
          publicId: data.public_id,
        };
      } catch (fallbackError) {
        console.error('Fallback upload also failed:', fallbackError);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> => {
  try {
    // Note: This requires server-side implementation for security
    // For now, we'll just return true as deletion is optional
    console.log(`Would delete ${resourceType} with publicId: ${publicId}`);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// Get optimized video URL for mobile
export const getOptimizedVideoUrl = (originalUrl: string): string => {
  if (!originalUrl) return '';
  
  // Add Cloudinary transformations for mobile optimization
  const transformations = 'q_auto,f_mp4,w_400,h_600,c_fill';
  
  // Insert transformations into Cloudinary URL
  return originalUrl.replace('/upload/', `/upload/${transformations}/`);
};

// Validate file type
export const validateFileType = (file: File, type: 'image' | 'video'): boolean => {
  if (type === 'image') {
    return file.type.startsWith('image/');
  } else if (type === 'video') {
    return file.type.startsWith('video/');
  }
  return false;
};