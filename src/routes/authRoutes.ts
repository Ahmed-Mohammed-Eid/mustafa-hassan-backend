import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  createAdmin,
} from '../controllers/authController';
import { protect, admin } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateRequest';
import { registerSchema, loginSchema } from '../schemas/authSchemas';

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.get('/me', protect, getUserProfile);
router.post('/admin', protect, admin, createAdmin);

export default router;
