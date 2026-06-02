import express from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { getContent, getContentById, uploadContent, deleteContent, getFreeContent } from '../controllers/contentController.js';
import { verifyToken, adminOnly } from '../middleware/auth.js';
import { getUploadsPath } from '../config/uploads.js';

const uploadsDir = getUploadsPath();
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadsDir),
	filename: (req, file, cb) => {
		const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname);
		cb(null, `${unique}${ext}`);
	}
});

const upload = multer({ storage });

const router = express.Router();

router.get('/', getContent);
router.get('/free', verifyToken, getFreeContent);
router.get('/:id', getContentById);

// Admin-only upload endpoint (supports file upload via 'file')
router.post('/upload', verifyToken, adminOnly, upload.single('file'), uploadContent);

// Admin-only delete
router.delete('/:id', verifyToken, adminOnly, deleteContent);

export default router;
