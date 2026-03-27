import express from 'express';
import {
  addOrderItems,
  getOrdersForAdmin,
  getOrderById,
  getMyOrders,
} from '../controllers/orderController';
import { admin, protect } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateRequest';
import { createOrderSchema } from '../schemas/orderSchemas';

const router = express.Router();

router.route('/').post(protect, validate(createOrderSchema), addOrderItems).get(protect, getMyOrders);
router.route('/admin').get(protect, admin, getOrdersForAdmin);
router.route('/:id').get(protect, getOrderById);

export default router;
