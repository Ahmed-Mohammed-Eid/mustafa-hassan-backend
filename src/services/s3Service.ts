import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import crypto from 'crypto';

// Configure S3 client - works with both AWS S3 and MinIO
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  // For MinIO, specify custom endpoint
  ...(process.env.AWS_ENDPOINT && {
    endpoint: process.env.AWS_ENDPOINT,
    forcePathStyle: true, // Required for MinIO
  }),
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

// Store file keys in memory for quick URL generation
// In production, you might want to use Redis or store in DB
const imageKeyCache = new Map<string, string>();

/**
 * Generate a unique filename for the uploaded file
 */
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${randomBytes}${ext}`;
};

/**
 * Get the base URL for the S3/MinIO endpoint
 */
const getBaseUrl = (): string => {
  if (process.env.AWS_ENDPOINT) {
    return `${process.env.AWS_ENDPOINT}/${BUCKET_NAME}`;
  }
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
};

/**
 * Upload a file to S3/MinIO and return a presigned URL
 * The URL expires in 7 days (maximum allowed for AWS Signature V4)
 */
export const uploadImageToS3 = async (
  file: Express.Multer.File
): Promise<string> => {
  const fileName = generateFileName(file.originalname);
  const key = `images/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  // Store the key in cache for later URL generation
  imageKeyCache.set(key, key);

  // Generate a presigned URL that expires in 7 days
  const getCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // 7 days in seconds (maximum allowed)
  const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 7 * 24 * 60 * 60 });

  // Return the full signed URL
  return signedUrl;
};

/**
 * Generate a fresh presigned URL for an existing image
 * Use this to refresh URLs that are about to expire
 */
export const generatePresignedUrl = async (imageUrl: string): Promise<string> => {
  // If it's already a full URL, extract the key
  let key = '';

  if (imageUrl.includes(`/${BUCKET_NAME}/`)) {
    const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
    key = urlParts[1]?.split('?')[0] || '';
  } else if (imageUrl.startsWith('images/')) {
    key = imageUrl;
  } else if (imageUrl.includes('images/')) {
    const parts = imageUrl.split('images/');
    key = `images/${parts[1]}`;
  }

  if (!key) {
    throw new Error('Invalid image URL');
  }

  const getCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // Generate new presigned URL (expires in 7 days)
  const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 7 * 24 * 60 * 60 });
  return signedUrl;
};

/**
 * Delete an image from S3/MinIO
 */
export const deleteImageFromS3 = async (imageUrl: string): Promise<void> => {
  try {
    let key = '';

    if (imageUrl.includes(`/${BUCKET_NAME}/`)) {
      const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
      key = urlParts[1]?.split('?')[0] || '';
    } else if (imageUrl.includes('images/')) {
      const parts = imageUrl.split('images/');
      key = `images/${parts[1]?.split('?')[0]}`;
    }

    if (!key) {
      console.error('Could not extract key from URL');
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    // Remove from cache
    imageKeyCache.delete(key);
  } catch (error) {
    console.error('Error deleting image from S3/MinIO:', error);
  }
};

export default s3Client;
