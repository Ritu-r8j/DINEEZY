'use client';

import { X } from 'lucide-react';

interface MediaUploadModalProps {
  showMediaUpload: boolean;
  uploadingMedia: File[];
  uploadProgress: { [key: string]: number };
  isUploadingMedia: boolean;
  error: string | null;
  onClose: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MediaUploadModal({
  showMediaUpload,
  uploadingMedia,
  uploadProgress,
  isUploadingMedia,
  error,
  onClose,
  onFileSelect
}: MediaUploadModalProps) {
  if (!showMediaUpload) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!isUploadingMedia) {
            onClose();
          }
        }}
      />
      <div className="relative bg-white dark:bg-[#0f1419] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Upload Photos & Videos
            </h3>
            {!isUploadingMedia && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Upload Area */}
            {!isUploadingMedia && (
              <div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={onFileSelect}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Upload your media
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Drag and drop or click to select photos and videos
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Supports: JPG, PNG, GIF, MP4, MOV (Max 50MB each)
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Upload Progress */}
            {isUploadingMedia && uploadingMedia.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Uploading {uploadingMedia.length} file{uploadingMedia.length > 1 ? 's' : ''}...
                  </span>
                </div>
                
                {uploadingMedia.map((file, index) => {
                  const fileKey = `${file.name}-${index}`;
                  const progress = uploadProgress[fileKey] || 0;
                  const isImage = file.type.startsWith('image/');
                  
                  return (
                    <div key={fileKey} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          {isImage ? (
                            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {progress}%
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Guidelines */}
            {!isUploadingMedia && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Upload Guidelines
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Share high-quality photos of food, ambiance, and restaurant interior</li>
                  <li>• Videos should showcase the dining experience or special dishes</li>
                  <li>• Avoid blurry, dark, or inappropriate content</li>
                  <li>• Maximum file size: 50MB per file</li>
                  <li>• Your uploads will be reviewed before being published</li>
                </ul>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}