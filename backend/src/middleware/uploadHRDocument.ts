import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { config } from '../utils/env';
import { AppError } from './errorHandler';

// Ensure upload directory exists
const uploadDir = config.upload.dir;
const hrDocumentsDir = path.join(uploadDir, 'hr-documents');

if (!fs.existsSync(hrDocumentsDir)) {
  fs.mkdirSync(hrDocumentsDir, { recursive: true });
}

// Configure storage for HR documents
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Organize by date: uploads/hr-documents/YYYY/MM/DD/
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateDir = path.join(hrDocumentsDir, String(year), month, day);

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

// File filter for documents (PDF, DOCX, etc.)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/plain',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error: AppError = new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  }
};

// Configure multer for HR documents
export const uploadHRDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize * 5, // 50MB for documents
  },
});

// Middleware for single document upload
export const uploadSingleHRDocument = uploadHRDocument.single('document');
















