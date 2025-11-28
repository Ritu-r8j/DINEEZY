# Restaurant Image Fix - Summary

## Problem
All restaurant cards on the homepage were showing the same image because:
1. Restaurant documents in Firebase didn't have an `image` field
2. All restaurants were falling back to the same default image

## Solution Implemented

### 1. Updated Homepage (app/page.tsx)
- Added fallback to use `logoDataUrl` if `image` is not available
- Added error handling for broken images
- Images now try: `restaurant.image` → `restaurant.logoDataUrl` → default fallback

### 2. Added Restaurant Image Upload to Admin Settings (app/admin/settings/page.tsx)
- Added new "Restaurant Image" section after the Logo section
- Admins can now upload a dedicated restaurant image (recommended size: 1200x800px)
- Supports drag-and-drop and file browsing
- Image is stored as base64 in the `image` field

### 3. Updated Type Definitions
- Added `image?: string | null` to `SettingsState` interface
- Updated all state initialization and loading functions
- Fixed type compatibility issues with Firebase

## How to Use

### For Admins:
1. Go to Admin Settings page
2. Scroll to "Restaurant Image" section
3. Upload a high-quality image of your restaurant
4. Click "Save Settings"

### For Quick Fix (Manual):
If you want to add images immediately without waiting for admin upload:
1. Go to Firebase Console
2. Navigate to Firestore Database → `restaurants` collection
3. For each restaurant document, add a field:
   - Field name: `image`
   - Field type: `string`
   - Value: URL of restaurant image (e.g., from Unsplash)

Example image URLs you can use:
- `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200`
- `https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200`
- `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200`
- `https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200`
- `https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1200`

## Files Modified
1. `app/page.tsx` - Updated restaurant image rendering with fallbacks
2. `app/admin/settings/page.tsx` - Added restaurant image upload functionality

## Testing
1. Check that existing restaurants show their logo if no image is set
2. Upload a restaurant image in admin settings
3. Verify the image appears on the homepage
4. Test drag-and-drop functionality
5. Test replace and remove buttons
