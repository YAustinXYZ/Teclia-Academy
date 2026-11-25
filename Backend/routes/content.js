import express from 'express';
import multer from 'multer';
import { getContent, getContentById, uploadContent, createContentUploadUrl, updateContent, deleteContent, getFreeContent } from '../controllers/contentController.js';
import { verifyToken, optionalAuth, adminOnly } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import * as contentSchemas from '../schemas/content.schema.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

const mapBodyToDescription = (req, _res, next) => {
  if (req.body?.body) {
    req.body.description = req.body.body;
    delete req.body.body;
  }
  next();
};

router.get('/', optionalAuth, validate(contentSchemas.listContent, { target: 'query' }), getContent);
router.get('/free', verifyToken, getFreeContent);
router.get('/:id', optionalAuth, validate(contentSchemas.contentId, { target: 'params' }), getContentById);

router.post(
  '/upload-url',
  verifyToken,
  adminOnly,
  validate(contentSchemas.createContentUploadUrl),
  createContentUploadUrl
);

// Admin-only upload endpoint (supports file upload via 'file')
router.post(
  '/upload',
  verifyToken,
  adminOnly,
  upload.single('file'),
  validate(contentSchemas.createContent),
  mapBodyToDescription,
  uploadContent
);

router.put(
  '/:id',
  verifyToken,
  adminOnly,
  upload.single('file'),
  validate(contentSchemas.updateContent),
  mapBodyToDescription,
  updateContent
);

// Admin-only delete
router.delete('/:id', verifyToken, adminOnly, validate(contentSchemas.contentId, { target: 'params' }), deleteContent);

export default router;
