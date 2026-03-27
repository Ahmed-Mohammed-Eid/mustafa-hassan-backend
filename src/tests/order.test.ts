import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';
import { Order } from '../models/Order';
import mongoose from 'mongoose';

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || '';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe('Order API', () => {
  let userToken: string;
  let adminToken: string;
  let restaurantId: string;
  let menuItemId: string;

  beforeEach(async () => {
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      phone: '0123456790',
      universityId: '202012347',
    });
    const adminUser = await User.findById(adminRes.body._id);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    adminUser.role = 'admin';
    await adminUser.save();
    adminToken = adminRes.body.token;

    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Normal User',
      email: 'user@example.com',
      password: 'password123',
      phone: '0123456789',
      universityId: '202012346',
    });
    userToken = userRes.body.token;
    const userId = userRes.body._id;

    const restaurant = await Restaurant.create({
      name: 'Test Restaurant',
      description: 'Test Description',
      image: 'http://example.com/image.jpg',
      owner: userId,
    });
    restaurantId = restaurant._id.toString();

    const menuItem = await MenuItem.create({
      name: 'Test Item',
      description: 'Test Description',
      price: 10,
      image: 'http://example.com/image.jpg',
      category: 'Test Category',
      restaurant: restaurantId,
    });
    menuItemId = menuItem._id.toString();
  });

  it('should create a new order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        restaurant: restaurantId,
        orderItems: [
          {
            name: 'Test Item',
            qty: 2,
            image: 'http://example.com/image.jpg',
            price: 10,
            menuItem: menuItemId,
          },
        ],
        paymentMethod: 'Cash on delivery',
        itemsPrice: 20,
        deliveryFee: 5,
        totalPrice: 25,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.totalPrice).toEqual(25);
  });

  it('should get my orders', async () => {
    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        restaurant: restaurantId,
        orderItems: [
          {
            name: 'Test Item',
            qty: 2,
            image: 'http://example.com/image.jpg',
            price: 10,
            menuItem: menuItemId,
          },
        ],
        paymentMethod: 'Cash on delivery',
        itemsPrice: 20,
        deliveryFee: 5,
        totalPrice: 25,
      });

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(1);
    expect(res.body[0].totalPrice).toEqual(25);
  });

  it('should allow admin to get all orders filtered by status and ordered by date', async () => {
    const firstOrderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        restaurant: restaurantId,
        orderItems: [
          {
            name: 'Test Item',
            qty: 1,
            image: 'http://example.com/image.jpg',
            price: 10,
            menuItem: menuItemId,
          },
        ],
        paymentMethod: 'Cash on delivery',
        itemsPrice: 10,
        deliveryFee: 5,
        totalPrice: 15,
      });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const secondOrderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        restaurant: restaurantId,
        orderItems: [
          {
            name: 'Test Item',
            qty: 2,
            image: 'http://example.com/image.jpg',
            price: 10,
            menuItem: menuItemId,
          },
        ],
        paymentMethod: 'Cash on delivery',
        itemsPrice: 20,
        deliveryFee: 5,
        totalPrice: 25,
      });

    await Order.findByIdAndUpdate(firstOrderRes.body._id, { status: 'Delivered' });
    await Order.findByIdAndUpdate(secondOrderRes.body._id, { status: 'Pending' });

    const filteredRes = await request(app)
      .get('/api/orders/admin?status=Delivered')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(filteredRes.statusCode).toEqual(200);
    expect(filteredRes.body.length).toEqual(1);
    expect(filteredRes.body[0].status).toEqual('Delivered');

    const sortedRes = await request(app)
      .get('/api/orders/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(sortedRes.statusCode).toEqual(200);
    expect(sortedRes.body.length).toEqual(2);
    expect(new Date(sortedRes.body[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(sortedRes.body[1].createdAt).getTime()
    );
  });
});
