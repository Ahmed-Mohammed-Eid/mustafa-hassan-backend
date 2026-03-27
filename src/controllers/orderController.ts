import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';

const ORDER_STATUSES = [
  'Pending',
  'Accepted',
  'Ready',
  'Delivered',
  'Cancelled',
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

export const addOrderItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      orderItems,
      restaurant,
      paymentMethod,
      itemsPrice,
      deliveryFee,
      totalPrice,
      notes,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    } else {
      const order = new Order({
        orderItems,
        user: req.user._id,
        restaurant,
        paymentMethod,
        itemsPrice,
        deliveryFee,
        totalPrice,
        notes,
      });

      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    }
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate(
      'restaurant',
      'name image'
    );
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrdersForAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.query;
    const filters: { status?: OrderStatus } = {};

    if (status !== undefined) {
      if (typeof status !== 'string') {
        res.status(400);
        throw new Error('Invalid status filter');
      }

      const normalizedStatus = ORDER_STATUSES.find(
        (orderStatus) => orderStatus.toLowerCase() === status.toLowerCase()
      );

      if (!normalizedStatus) {
        res.status(400);
        throw new Error('Invalid order status');
      }

      filters.status = normalizedStatus;
    }

    const orders = await Order.find(filters)
      .populate('user', 'name email')
      .populate('restaurant', 'name image')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('restaurant', 'name image');

    if (order) {
      if (
        order.user._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
      ) {
        res.status(403);
        throw new Error('Not authorized to view this order');
      }
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};
