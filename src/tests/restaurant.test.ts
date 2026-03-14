import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import mongoose from 'mongoose';

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI;
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

describe('Restaurant API', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      phone: '0123456789',
      universityId: '202012345',
    });

    await User.findByIdAndUpdate(adminRes.body._id, { role: 'admin' });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });
    adminToken = loginRes.body.token;

    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Normal User',
      email: 'user@example.com',
      password: 'password123',
      phone: '0123456789',
      universityId: '202012346',
    });
    userToken = userRes.body.token;
  });

  it('should allow admin to create a restaurant', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Restaurant',
        description: 'Test Description',
        image: 'http://example.com/image.jpg',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual('Test Restaurant');
  });

  it('should not allow normal user to create a restaurant', async () => {
    const res = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Test Restaurant',
        description: 'Test Description',
        image: 'http://example.com/image.jpg',
      });

    expect(res.statusCode).toEqual(403);
  });

  it('should get all restaurants', async () => {
    await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Restaurant',
        description: 'Test Description',
        image: 'http://example.com/image.jpg',
      });

    const res = await request(app).get('/api/restaurants');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toEqual(1);
    expect(res.body[0].name).toEqual('Test Restaurant');
  });
});
