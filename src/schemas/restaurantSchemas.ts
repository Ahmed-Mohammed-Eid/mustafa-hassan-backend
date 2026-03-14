import { z } from 'zod';

export const createRestaurantSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    // Image is now handled via file upload, so we make it optional in the body
    // The S3 URL will be added by the controller
  }),
});

export const createMenuItemSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive'),
    // Image is now handled via file upload, so we make it optional in the body
    // The S3 URL will be added by the controller
    category: z.string().min(3, 'Category must be at least 3 characters'),
  }),
});
