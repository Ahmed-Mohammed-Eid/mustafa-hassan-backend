import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import crypto from "crypto";

// Configure S3 client - works with both AWS S3 and MinIO
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    // For MinIO, specify custom endpoint
    ...(process.env.AWS_ENDPOINT && {
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true, // Required for MinIO
    }),
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "";

/**
 * Generate a unique filename for the uploaded file
 */
const generateFileName = (originalName: string): string => {
    const ext = path.extname(originalName);
    const randomBytes = crypto.randomBytes(16).toString("hex");
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
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`;
};

/**
 * Upload a file to S3/MinIO and return a presigned URL for access
 * The presigned URL allows access without requiring public bucket policy
 */
export const uploadImageToS3 = async (
    file: Express.Multer.File,
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

    // Return a presigned URL that expires in 1 year (sufficient for permanent access)
    const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, getCommand, {
        expiresIn: 365 * 24 * 60 * 60,
    });
    return signedUrl;
};

/**
 * Delete an image from S3/MinIO
 */
export const deleteImageFromS3 = async (imageUrl: string): Promise<void> => {
    try {
        // For presigned URLs, we need to extract the key differently
        let key = "";

        if (imageUrl.includes(`/${BUCKET_NAME}/`)) {
            // Standard URL format
            const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
            key = urlParts[1]?.split("?")[0] || "";
        } else if (imageUrl.includes("images/")) {
            // Extract key from the path
            const parts = imageUrl.split("images/");
            key = `images/${parts[1]?.split("?")[0] || ""}`;
        }

        if (!key) {
            console.error("Could not extract key from URL");
            return;
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting image from S3/MinIO:", error);
    }
};

/**
 * Get a presigned URL for uploading (if needed for direct client uploads)
 */
export const getPresignedUploadUrl = async (
    fileName: string,
    contentType: string,
): Promise<string> => {
    const key = `images/${generateFileName(fileName)}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
    });
    return signedUrl;
};

export default s3Client;
