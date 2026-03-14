import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    restaurant: z.string().min(1, 'Restaurant ID is required'),
    orderItems: z
      .array(
        z.object({
          name: z.string(),
          qty: z.number().int().positive(),
          image: z.string(),
          price: z.number().positive(),
          menuItem: z.string(),
        })
      )
      .min(1, 'Order must contain at least one item'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    itemsPrice: z.number().positive(),
    deliveryFee: z.number().min(0),
    totalPrice: z.number().positive(),
    notes: z.string().optional(),
  }),
});
