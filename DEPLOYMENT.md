# Firebase Deployment Guide

## Overview
Your application is built and ready for deployment. The static files are in the `out` directory.

## Firebase CLI Deployment (Automatic - Currently Failing)

The Firebase CLI deployment is encountering errors. This appears to be a Firebase CLI issue (v14.25.0).

## Manual Deployment via Firebase Console (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/project/withyou-e9335/hosting
2. **Click on "Get started"** or **"Add another site"** if Hosting is already initialized
3. **Deploy your site**:
   - Click on the three dots menu (⋮) next to your site
   - Select "Deploy to live channel"
   - Drag and drop the entire `out` folder from your project directory
   - Or use the file picker to select all files in the `out` folder

## Alternative: Deploy via Firebase CLI (When Working)

When the CLI issue is resolved, you can deploy using:

```bash
# Make sure you're in the project directory
cd c:\Users\User\Documents\programming\motivationApp\with_you

# Build for production (with static export enabled)
# First, update next.config.ts to add:
# output: 'export',
# images: { unoptimized: true, ... }
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Deployment Configuration Files

The following files have been created for Firebase deployment:

- `firebase.json` - Firebase configuration (hosting points to `out` directory)
- `.firebaserc` - Firebase project configuration (project: withyou-e9335)

## Important Notes

- **Dev Server**: The `output: 'export'` config in `next.config.ts` breaks the dev server. I've reverted this change so you can continue development with `npm run dev`.
- **Before deploying**: Re-add the export configuration to `next.config.ts` when ready to build for production.
- **Firestore Rules**: Your Firestore and Storage rules are already in place (`firestore.rules` and `storage.rules`). You may want to deploy them separately:
  ```bash
  firebase deploy --only firestore:rules,storage
  ```
