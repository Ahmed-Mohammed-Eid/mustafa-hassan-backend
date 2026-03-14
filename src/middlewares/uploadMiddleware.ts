import multer from "multer";
import path from "path";

// Configure multer for memory storage (we'll upload to S3)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"));
    }
};

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter,
});

// Single image upload middleware
export const uploadImage = upload.single("image");
