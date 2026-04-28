// ══════════════════════════════════════════════════════════════
// PeakPack — Storage Service (Supabase Storage)
// ══════════════════════════════════════════════════════════════

import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';

// ── Bucket Names ─────────────────────────────────────────────
const AVATARS_BUCKET = 'avatars';
const PHOTOS_BUCKET  = 'progress-photos';

// ── Ensure Buckets Exist ─────────────────────────────────────

async function ensureBucketsExist(): Promise<void> {
  const buckets = [
    { name: AVATARS_BUCKET, public: true },
    { name: PHOTOS_BUCKET, public: true },
  ];

  for (const bucket of buckets) {
    const { error } = await supabaseAdmin.storage.getBucket(bucket.name);
    if (error) {
      // Bucket doesn't exist — create it
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: 5 * 1024 * 1024, // 5 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (createError) {
        logger.warn(`Failed to create bucket "${bucket.name}"`, { error: createError.message });
      } else {
        logger.info(`Storage bucket created: ${bucket.name}`);
      }
    }
  }
}

// Run bucket check on startup (non-blocking)
ensureBucketsExist().catch(() => {});

// ── Upload Progress Photo ────────────────────────────────────

async function uploadProgressPhoto(
  userId: string,
  checkInId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const filePath = `${userId}/${checkInId}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(PHOTOS_BUCKET)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    logger.error('Photo upload failed', { error: error.message, filePath });
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  logger.debug('Photo uploaded to Supabase Storage', { filePath, size: buffer.length });
  return filePath;
}

// ── Upload Avatar ────────────────────────────────────────────

async function uploadAvatar(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const filePath = `${userId}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(AVATARS_BUCKET)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true, // overwrite existing avatar
    });

  if (error) {
    logger.error('Avatar upload failed', { error: error.message, filePath });
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  logger.debug('Avatar uploaded to Supabase Storage', { filePath });
  return filePath;
}

// ── Get Public URL ───────────────────────────────────────────

function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

function getAvatarUrl(filePath: string): string {
  return getPublicUrl(AVATARS_BUCKET, filePath);
}

function getPhotoUrl(filePath: string): string {
  return getPublicUrl(PHOTOS_BUCKET, filePath);
}

// ── Delete Object ────────────────────────────────────────────

async function deleteObject(bucket: string, filePath: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);
    if (error) {
      logger.warn('Failed to delete storage object', { bucket, filePath, error: error.message });
    } else {
      logger.debug('Storage object deleted', { bucket, filePath });
    }
  } catch (err) {
    logger.warn('Failed to delete storage object', { bucket, filePath, error: err });
  }
}

async function deleteAvatar(filePath: string): Promise<void> {
  return deleteObject(AVATARS_BUCKET, filePath);
}

async function deletePhoto(filePath: string): Promise<void> {
  return deleteObject(PHOTOS_BUCKET, filePath);
}

// ── Export ───────────────────────────────────────────────────

export const storageService = {
  uploadProgressPhoto,
  uploadAvatar,
  getAvatarUrl,
  getPhotoUrl,
  getPublicUrl,
  deleteAvatar,
  deletePhoto,
};

export default storageService;
