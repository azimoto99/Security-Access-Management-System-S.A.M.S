# Render Disk Storage Setup for Photo Persistence

## Problem
Photos are disappearing after each redeploy because Render's default filesystem is **ephemeral**. Any files written to the local filesystem are lost upon redeployment.

## Solution: Use Render Persistent Disk Storage

### Step 1: Create a Persistent Disk in Render Dashboard

1. Go to your Render Dashboard
2. Navigate to your **Backend Service**
3. Click on the **Disks** tab (or find it in the sidebar)
4. Click **Add Disk**
5. Configure the disk:
   - **Name**: `photo-storage` (or any name you prefer)
   - **Mount Path**: `/var/data` (this is the standard path)
   - **Size**: Choose based on your needs (e.g., 10GB, 50GB, etc.)
6. Click **Save** - This will trigger a redeploy

### Step 2: Set Environment Variable

1. In your Render service, go to **Environment** tab
2. Add a new environment variable:
   - **Key**: `RENDER_DISK_PATH`
   - **Value**: `/var/data`
3. Save the changes

### Step 3: Verify

After redeploy:
- Upload a photo
- Redeploy the service
- Check that the photo still exists

## Alternative: AWS S3 (More Scalable)

If you prefer cloud storage for better scalability:

1. Create an S3 bucket on AWS
2. Set up IAM credentials with S3 access
3. Install AWS SDK: `npm install @aws-sdk/client-s3 @aws-sdk/lib-storage`
4. Update the upload middleware to use S3 instead of local filesystem

## Important Notes

⚠️ **Limitations of Render Disk Storage:**
- Only available on paid plans
- Services with attached disks **cannot scale to multiple instances**
- Zero-downtime deploys are disabled when using persistent disks
- Only files under the mount path are preserved

✅ **Benefits:**
- Simple setup
- No additional services needed
- Files persist across deployments

## Current Configuration

The code is now configured to:
- Use `./uploads` in development (local)
- Use `${RENDER_DISK_PATH}/uploads` when `RENDER_DISK_PATH` environment variable is set (Render production)

Make sure to set `RENDER_DISK_PATH=/var/data` in your Render environment variables after mounting the disk.

