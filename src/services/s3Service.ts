import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
    // For MinIO, use the custom endpoint
    return `${process.env.AWS_ENDPOINT}/${BUCKET_NAME}`;
  }
  // For AWS S3, construct the URL
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
};

/**
 * Upload a file to S3/MinIO and return the public URL
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
    ACL: 'public-read',
  });

  await s3Client.send(command);

  // Return the public URL
  return `${getBaseUrl()}/${key}`;
};

/**
 * Delete an image from S3/MinIO
 */
export const deleteImageFromS3 = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the key from the URL
    const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      console.error('Invalid S3/MinIO URL format');
      return;
    }

    const key = urlParts[1];

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting image from S3/MinIO:', error);
  }
};

/**
 * Get a presigned URL for uploading (if needed for direct client uploads)
 */
export const getPresignedUploadUrl = async (
  fileName: string,
  contentType: string
): Promise<string> => {
  const key = `images/${generateFileName(fileName)}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
};

export default s3Client;
