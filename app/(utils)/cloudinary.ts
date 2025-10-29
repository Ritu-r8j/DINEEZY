// Remove the server-side Cloudinary SDK imports
// Instead, use direct upload via fetch API

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  original_filename: string;
  format: string;
  resource_type: string;
}

// Client-side upload function using FormData with progress callback
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void,
  folder: string = 'restaurants'
): Promise<CloudinaryUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
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
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            original_filename: response.original_filename,
            format: response.format,
            resource_type: response.resource_type
          });
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`
      );
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Client-side delete function using fetch API
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    // For client-side deletion, you'll need to create a server-side API endpoint
    // This is a security measure since you can't expose your API secret on the client
    throw new Error('Client-side deletion not supported. Use server-side endpoint.');
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to generate image URLs with transformations
export const getCloudinaryImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string => {
  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;
  const transformations = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`c_${crop}`, `q_${quality}`, `f_${format}`);

  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformations.join(',')}/${publicId}`;
};
