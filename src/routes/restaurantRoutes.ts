import express from 'express';
import {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  getMenuItems,
  createMenuItem,
} from '../controllers/restaurantController';
import { protect, admin } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateRequest';
import {
  createRestaurantSchema,
  createMenuItemSchema,
} from '../schemas/restaurantSchemas';

const router = express.Router();

router.route('/').get(getRestaurants).post(protect, admin, validate(createRestaurantSchema), createRestaurant);
router.route('/:id').get(getRestaurantById);
router.route('/:id/items').get(getMenuItems).post(protect, validate(createMenuItemSchema), createMenuItem);

export default router;
