import { Request, Response, NextFunction } from 'express';
import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';
import { uploadImageToS3 } from '../services/s3Service';

export const getRestaurants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurants = await Restaurant.find({});
    res.json(restaurants);
  } catch (error) {
    next(error);
  }
};

export const getRestaurantById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (restaurant) {
      res.json(restaurant);
    } else {
      res.status(404);
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    next(error);
  }
};

export const createRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;

    // Handle image upload to S3
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
    } else {
      res.status(400);
      throw new Error('Image is required');
    }

    const restaurant = new Restaurant({
      name,
      description,
      image: imageUrl,
      owner: req.user._id,
    });

    const createdRestaurant = await restaurant.save();
    res.status(201).json(createdRestaurant);
  } catch (error) {
    next(error);
  }
};

export const getMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const items = await MenuItem.find({ restaurant: req.params.id });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, price, category } = req.body;
    const restaurantId = req.params.id;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }

    if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to add items to this restaurant');
    }

    // Handle image upload to S3
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
    } else {
      res.status(400);
      throw new Error('Image is required');
    }

    const menuItem = new MenuItem({
      name,
      description,
      price,
      image: imageUrl,
      category,
      restaurant: restaurantId,
    });

    const createdItem = await menuItem.save();
    res.status(201).json(createdItem);
  } catch (error) {
    next(error);
  }
};
