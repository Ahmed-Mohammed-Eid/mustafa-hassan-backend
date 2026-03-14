import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './src/app';
import { seedDatabase } from './src/seed';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, { dbName: 'unidash' });
    console.log('Connected to MongoDB');

    // Run seed script only when not in test mode
    if (process.env.NODE_ENV !== 'test') {
      await seedDatabase();
    }

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
