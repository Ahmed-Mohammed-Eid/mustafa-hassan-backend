import mongoose from 'mongoose';
import 'dotenv/config';
import { User } from './models/User';
import { Restaurant } from './models/Restaurant';
import { MenuItem } from './models/MenuItem';
import { Order } from './models/Order';

const MONGO_URI = process.env.MONGO_URI;

const adminUser = {
  name: 'Admin User',
  email: 'admin@collegecoffee.com',
  password: 'admin123',
  phone: '1234567890',
  universityId: 'ADMIN001',
  role: 'admin' as const,
};

const sampleStudents = [
  {
    name: 'John Doe',
    email: 'john.doe@student.edu',
    password: 'student123',
    phone: '1111111111',
    universityId: 'STU001',
    role: 'student' as const,
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@student.edu',
    password: 'student123',
    phone: '2222222222',
    universityId: 'STU002',
    role: 'student' as const,
  },
];

const sampleRestaurants = [
  {
    name: 'Campus Coffee House',
    description: 'Premium coffee and snacks for students',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
  },
  {
    name: 'Quick Bites',
    description: 'Fast food and quick meals',
    image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400',
  },
  {
    name: 'Healthy Greens',
    description: 'Healthy salads and smoothies',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
  },
];

const menuItemsByRestaurant = [
  // Menu items for Campus Coffee House
  [
    { name: 'Espresso', description: 'Strong black coffee', price: 3.50, image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400', category: 'Coffee' },
    { name: 'Cappuccino', description: 'Creamy coffee with milk foam', price: 4.50, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', category: 'Coffee' },
    { name: 'Latte', description: 'Smooth coffee with steamed milk', price: 4.00, image: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400', category: 'Coffee' },
    { name: 'Croissant', description: 'Flaky buttery pastry', price: 2.50, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', category: 'Pastry' },
    { name: 'Blueberry Muffin', description: 'Fresh blueberry muffin', price: 3.00, image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400', category: 'Pastry' },
  ],
  // Menu items for Quick Bites
  [
    { name: 'Cheeseburger', description: 'Juicy beef burger with cheese', price: 6.50, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', category: 'Burgers' },
    { name: 'French Fries', description: 'Crispy golden fries', price: 3.00, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', category: 'Sides' },
    { name: 'Chicken Wrap', description: 'Grilled chicken in a tortilla', price: 5.50, image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', category: 'Wraps' },
    { name: 'Onion Rings', description: 'Crispy battered onion rings', price: 3.50, image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400', category: 'Sides' },
    { name: 'Hot Dog', description: 'Classic hot dog with mustard', price: 4.00, image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', category: 'Fast Food' },
  ],
  // Menu items for Healthy Greens
  [
    { name: 'Caesar Salad', description: 'Romaine lettuce with caesar dressing', price: 7.00, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', category: 'Salads' },
    { name: 'Greek Salad', description: 'Fresh vegetables with feta cheese', price: 7.50, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', category: 'Salads' },
    { name: 'Green Smoothie', description: 'Spinach, banana, and almond milk', price: 5.00, image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400', category: 'Smoothies' },
    { name: 'Fruit Bowl', description: 'Fresh seasonal fruits', price: 4.50, image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400', category: 'Healthy' },
    { name: 'Avocado Toast', description: 'Sourdough with smashed avocado', price: 6.00, image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', category: 'Healthy' },
  ],
];

export async function seedDatabase() {
  // Prevent multiple simultaneous seed calls
  if (global.isSeeding) {
    console.log('Seeding already in progress, skipping...');
    return;
  }
  global.isSeeding = true;

  try {
    console.log('Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, { dbName: 'unidash' });
    console.log('Connected to MongoDB');

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: adminUser.email });
    if (!adminExists) {
      await User.create(adminUser);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Create sample students if not exists
    const createdStudents = [];
    for (const student of sampleStudents) {
      try {
        let existingStudent = await User.findOne({ email: student.email });
        if (!existingStudent) {
          existingStudent = await User.create(student);
          console.log(`Student ${student.name} created successfully`);
        } else {
          console.log(`Student ${student.name} already exists`);
        }
        createdStudents.push(existingStudent);
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicate key - user already exists, fetch it
          const existingStudent = await User.findOne({ email: student.email });
          if (existingStudent) {
            createdStudents.push(existingStudent);
            console.log(`Student ${student.name} already exists (found in DB)`);
          }
        } else {
          throw error;
        }
      }
    }

    // Clear existing data (optional - comment out if you want to keep existing data)
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing restaurants, menu items, and orders');

    // Create sample restaurants with menu items
    const createdRestaurants = [];
    for (let i = 0; i < sampleRestaurants.length; i++) {
      const restaurantData = sampleRestaurants[i];
      // Use admin as owner
      const admin = await User.findOne({ email: adminUser.email });

      const restaurant = await Restaurant.create({
        ...restaurantData,
        owner: admin?._id,
      });
      createdRestaurants.push(restaurant);
      console.log(`Restaurant ${restaurantData.name} created successfully`);

      // Create menu items for this restaurant
      const menuItems = menuItemsByRestaurant[i];
      for (const menuItem of menuItems) {
        await MenuItem.create({
          ...menuItem,
          restaurant: restaurant._id,
        });
        console.log(`  Menu item ${menuItem.name} created`);
      }
    }

    // Create sample orders if we have students and restaurants
    if (createdStudents.length > 0 && createdRestaurants.length > 0) {
      const student = createdStudents[0];
      const restaurant = createdRestaurants[0];

      // Get some menu items from this restaurant
      const menuItems = await MenuItem.find({ restaurant: restaurant._id }).limit(2);

      if (menuItems.length > 0) {
        const orderItems = menuItems.map(item => ({
          name: item.name,
          qty: Math.floor(Math.random() * 3) + 1,
          image: item.image,
          price: item.price,
          menuItem: item._id,
        }));

        const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
        const deliveryFee = 2.00;
        const totalPrice = itemsPrice + deliveryFee;

        await Order.create({
          user: student._id,
          restaurant: restaurant._id,
          orderItems,
          paymentMethod: 'Cash on delivery',
          itemsPrice,
          deliveryFee,
          totalPrice,
          notes: 'Please deliver to the main campus building',
          status: 'Pending',
        });
        console.log('Sample order created successfully');
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    global.isSeeding = false;
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Add global flag to prevent concurrent seeding
declare global {
  var isSeeding: boolean | undefined;
}

// Run if called directly
seedDatabase().catch(console.error);

