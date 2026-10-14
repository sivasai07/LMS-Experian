import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/config.js';

const uploadDir = path.join(config.storageDir, 'profile-photos');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Allowed formats: jpeg, png, jpg, webp.'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter,
});

export const profilePhotoUpload = (req, res, next) => {
  upload.single('profile_photo')(req, res, (err) => {
    if (err) {
      return res.status(422).json({
        success: false,
        message: err.message || 'File upload failed.',
        errors: { profile_photo: [err.message] },
        code: 'VALIDATION_ERROR',
      });
    }

    if (req.file) {
      req.profilePhotoPath = `profile-photos/${req.file.filename}`;
    }
    next();
  });
};

export default profilePhotoUpload;
