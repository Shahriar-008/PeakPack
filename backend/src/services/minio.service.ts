// ══════════════════════════════════════════════════════════════
// PeakPack — MinIO Service (Step 10)
// ══════════════════════════════════════════════════════════════

import * as Minio from 'minio';
import { logger } from '../lib/logger';

// ── MinIO Client ─────────────────────────────────────────────

const minioClient = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT  || 'localhost',
  port:      parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET = process.env.MINIO_BUCKET || 'peakpack';
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

// ── Ensure Bucket Exists ─────────────────────────────────────

async function ensureBucketExists(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      await minioClient.makeBucket(BUCKET, 'us-east-1');
      logger.info('MinIO bucket created', { bucket: BUCKET });
    }
  } catch (err) {
    logger.warn('MinIO bucket check failed — uploads may not work', { error: err });
  }
}

// Run bucket check on startup (non-blocking)
ensureBucketExists().catch(() => {});

// ── Upload Progress Photo ────────────────────────────────────

/**
 * Upload a progress photo buffer to MinIO.
 * Returns the object key.
 */
async function uploadProgressPhoto(
  userId: string,
  checkInId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const objectKey = `photos/${userId}/${checkInId}.${ext}`;

  await minioClient.putObject(BUCKET, objectKey, buffer, buffer.length, {
    'Content-Type': mimeType,
  });

  logger.debug('Photo uploaded to MinIO', { objectKey, size: buffer.length });
  return objectKey;
}

// ── Upload Avatar ────────────────────────────────────────────

async function uploadAvatar(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const objectKey = `avatars/${userId}.${ext}`;

  await minioClient.putObject(BUCKET, objectKey, buffer, buffer.length, {
    'Content-Type': mimeType,
  });

  logger.debug('Avatar uploaded to MinIO', { objectKey });
  return objectKey;
}

// ── Get Signed URL ───────────────────────────────────────────

/**
 * Get a pre-signed GET URL for an object (valid for 1 hour).
 */
async function getSignedUrl(objectKey: string): Promise<string> {
  return minioClient.presignedGetObject(BUCKET, objectKey, SIGNED_URL_EXPIRY);
}

// ── Delete Object ────────────────────────────────────────────

async function deleteObject(objectKey: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET, objectKey);
    logger.debug('MinIO object deleted', { objectKey });
  } catch (err) {
    logger.warn('Failed to delete MinIO object', { objectKey, error: err });
  }
}

// ── Export ───────────────────────────────────────────────────

export const minioService = {
  uploadProgressPhoto,
  uploadAvatar,
  getSignedUrl,
  deleteObject,
};

export default minioService;
