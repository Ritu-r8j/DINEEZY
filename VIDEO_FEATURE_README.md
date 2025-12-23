# Video Upload Feature for Menu Items

## Overview
This feature allows restaurant admins to upload videos for their menu items, making them more attractive and engaging for customers. Videos are automatically converted to MP4 format for optimal performance and compatibility.

## Features

### Admin Side
- **Video Upload Component**: Drag-and-drop or click-to-upload interface
- **Automatic MP4 Conversion**: Videos are converted to MP4 format via Cloudinary
- **Progress Tracking**: Real-time upload progress with percentage indicator
- **Video Preview**: Play/pause controls for uploaded videos
- **File Validation**: Supports common video formats (MP4, MOV, AVI, etc.)
- **Size Limit**: Maximum 50MB per video file
- **Cloudinary Integration**: Secure cloud storage with CDN delivery

### Customer Side
- **Video Display**: Videos shown alongside food images in menu item details
- **Video Badge**: Small indicator on menu cards showing when video is available
- **Responsive Design**: Videos adapt to different screen sizes
- **Poster Image**: Uses the food image as video poster/thumbnail
- **Browser Compatibility**: HTML5 video with fallback support

## Implementation Details

### Database Schema
The `MenuItem` interface has been extended with:
```typescript
interface MenuItem {
  // ... existing fields
  video?: string;        // Cloudinary video URL
  videoPublicId?: string; // Cloudinary public ID for deletion
}
```

### Components Added
1. **VideoUpload.tsx** - Admin video upload component
2. **Enhanced ProductInfo.tsx** - Customer video display
3. **Updated admin menu form** - Video upload integration

### File Structure
```
app/
├── (components)/
│   └── VideoUpload.tsx          # Video upload component
├── admin/menu/page.tsx          # Admin menu management (updated)
├── user/menu/[id]/[itemId]/
│   └── components/
│       └── ProductInfo.tsx      # Customer video display (updated)
└── (utils)/
    ├── cloudinary.ts            # Cloudinary utilities (updated)
    └── firebaseOperations.ts    # Database operations (updated)
```

## Usage

### For Admins
1. Navigate to Admin → Menu Management
2. Click "Add Item" or edit an existing item
3. In the form, find the "Item Video (Optional)" section
4. Upload a video file (max 50MB)
5. Video will be automatically converted to MP4
6. Save the menu item

### For Customers
1. Browse menu items on the main menu page
2. Items with videos show a "Video" badge
3. Click on a menu item to view details
4. Video appears below the main food image
5. Use standard video controls to play/pause

## Technical Specifications

### Video Processing
- **Format Conversion**: All videos converted to MP4 (H.264/AAC)
- **Quality**: Auto-optimized for web delivery
- **CDN**: Global content delivery via Cloudinary
- **Compression**: Automatic compression for faster loading

### Performance Optimizations
- **Lazy Loading**: Videos load only when needed
- **Poster Images**: Food images used as video thumbnails
- **Preload Metadata**: Only video metadata preloaded, not full video
- **Responsive**: Adaptive bitrate based on device/connection

### Security
- **File Validation**: Server-side file type and size validation
- **Secure Upload**: Direct upload to Cloudinary with signed URLs
- **Access Control**: Only authenticated admins can upload videos
- **Cleanup**: Automatic deletion of videos when menu items are removed

## Environment Variables Required
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers with HTML5 video support

## Future Enhancements
- Video thumbnails/previews in menu listings
- Multiple videos per menu item
- Video analytics (view counts, engagement)
- Video compression options
- Automatic subtitle generation
- Video quality selection for users

## Troubleshooting

### Common Issues
1. **Upload Fails**: Check file size (max 50MB) and format
2. **Video Not Playing**: Ensure browser supports HTML5 video
3. **Slow Loading**: Videos are optimized but large files may take time
4. **Missing Videos**: Check Cloudinary configuration and upload preset

### Error Messages
- "Please select a video file" - Non-video file selected
- "Video size should be less than 50MB" - File too large
- "Failed to upload video" - Network or Cloudinary issue
- "Converting to MP4..." - Normal processing message

## Support
For technical issues or questions about the video feature, please check:
1. Cloudinary dashboard for upload logs
2. Browser console for JavaScript errors
3. Network tab for failed requests
4. Firebase console for database issues