import { Document } from 'mongoose';
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      file?: Express.Multer.File;
    }
  }
}
