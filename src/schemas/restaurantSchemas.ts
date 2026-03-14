import { z } from 'zod';

export const createRestaurantSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    image: z.string().url('Invalid image URL'),
  }),
});

export const createMenuItemSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive'),
    image: z.string().url('Invalid image URL'),
    category: z.string().min(3, 'Category must be at least 3 characters'),
  }),
});
