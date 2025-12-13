import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { config } from '../utils/env';
import { AppError } from './errorHandler';

// Ensure upload directory exists
const uploadDir = config.upload.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories for organization
const photosDir = path.join(uploadDir, 'photos');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

[photosDir, thumbnailsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Organize by date: uploads/photos/YYYY/MM/DD/
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateDir = path.join(photosDir, String(year), month, day);

    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }

    cb(null, dateDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
  },
});

// File filter for images only
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error: AppError = new Error('Invalid file type. Only JPEG and PNG images are allowed.');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 10MB default
  },
});

// Middleware for single photo upload
export const uploadSingle = upload.single('photo');

// Middleware for multiple photo uploads
export const uploadMultiple = upload.array('photos', 10); // Max 10 photos




