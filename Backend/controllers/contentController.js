import prisma from '../utils/prismaClient.js';
import { canAccessPlan, normalizePlanTier, PLAN_TIERS } from '../utils/plans.js';
import { formatContent } from '../utils/serializers.js';
import storage from '../storage/index.js';

const getUserAccess = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, planTier: true },
  });

  if (!user) return null;
  return { role: user.role, plan_tier: user.planTier };
};

const resolveContentUrls = async (items) => {
  return Promise.all(
    items.map(async (item) => {
      const formatted = { ...item };
      if (formatted.url && !formatted.url.startsWith('http')) {
        const normalized = formatted.url.startsWith('/uploads/')
          ? formatted.url.replace(/^\/uploads\//, '')
          : formatted.url;
        formatted.url = storage.resolveUrl(normalized);
      }
      return formatted;
    })
  );
};

const resolveEffectiveUserPlanTier = (planTier) => {
  if (planTier === null || planTier === undefined) {
    return PLAN_TIERS.FREE;
  }

  if (typeof planTier !== 'string') {
    return null;
  }

  const trimmedPlanTier = planTier.trim();
  if (!trimmedPlanTier) {
    return PLAN_TIERS.FREE;
  }

  return normalizePlanTier(trimmedPlanTier);
};

const resolveEffectiveContentTier = (contentItem) => {
  const isFreeValue = contentItem?.is_free ?? contentItem?.isFree;
  if (isFreeValue === true || isFreeValue === 1 || isFreeValue === '1' || isFreeValue === 'true' || isFreeValue === 'on') {
    return PLAN_TIERS.FREE;
  }

  const storedPlanTier = contentItem?.plan_tier ?? contentItem?.planTier;
  if (typeof storedPlanTier !== 'string') {
    return null;
  }

  return normalizePlanTier(storedPlanTier);
};

const filterContentForUser = (content, access) => {
  if (!access) {
    return content.filter((item) => canAccessPlan(PLAN_TIERS.FREE, resolveEffectiveContentTier(item)));
  }
  if (access.role === 'admin') return content;

  const effectiveUserTier = resolveEffectiveUserPlanTier(access.plan_tier);
  return content.filter((item) => canAccessPlan(effectiveUserTier, resolveEffectiveContentTier(item)));
};

export const getContent = async (req, res) => {
  try {
    const rows = await prisma.content.findMany({
      include: { uploader: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const allContent = rows.map(formatContent);
    const access = req.user ? await getUserAccess(req.user.id) : null;
    let content = filterContentForUser(allContent, access);
    content = await resolveContentUrls(content);

    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getContentById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await prisma.content.findUnique({
      where: { id },
      include: { uploader: { select: { name: true } } },
    });

    if (!row) {
      return res.status(404).json({ error: 'Content not found' });
    }

    let content = formatContent(row);
    const access = req.user ? await getUserAccess(req.user.id) : null;

    if (!filterContentForUser([content], access).length) {
      return res.status(403).json({ error: 'No tienes acceso a este contenido con tu plan actual' });
    }

    [content] = await resolveContentUrls([content]);

    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const uploadContent = async (req, res) => {
  try {
    const { title, description, type, url, is_free, plan_tier } = req.body;

    let finalUrl = url;

    if (!title || !type || (!finalUrl && !req.file)) {
      return res.status(400).json({ error: 'Title, type and url/file are required' });
    }

    let storagePath = null;
    if (req.file) {
      storagePath = await storage.upload(req.file, 'content');
      finalUrl = storagePath;
    }

    const selectedPlan = plan_tier || (is_free === '1' || is_free === 'true' || is_free === 'on' ? 'free' : 'basico');
    if (!PLAN_TIERS.includes(selectedPlan)) {
      return res.status(400).json({ error: 'Plan de contenido no válido' });
    }

    const uploaderId = req.user.id;
    const freeFlag = selectedPlan === 'free' ? 1 : 0;

    const created = await prisma.content.create({
      data: {
        title,
        description: description || '',
        type,
        url: finalUrl,
        isFree: freeFlag,
        planTier: selectedPlan,
        uploadedBy: uploaderId,
      },
    });

    const content = formatContent(created);

    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      content.url = storage.resolveUrl(finalUrl);
    }

    res.json({ message: 'Content uploaded', content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createContentUploadUrl = async (req, res) => {
  try {
    const { filename, contentType, uploadId } = req.body;
    const upload = await storage.createResumableUploadUrl(filename, contentType, uploadId);
    res.json(upload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removeFileFromStorageOrLocal = async (fileUrl) => {
  if (!fileUrl) return;

  const normalized = fileUrl.startsWith('/uploads/')
    ? fileUrl.replace(/^\/uploads\//, '')
    : fileUrl;

  if (!normalized || normalized.startsWith('http')) {
    return;
  }

  try {
    await storage.delete(normalized);
  } catch (_e) {
    // ignore cleanup errors
  }
};

export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, url } = req.body;
    const file = req.file;

    if (!title && !description && !type && !url && !file) {
      return res.status(400).json({ error: 'At least one field must be provided' });
    }

    const db = getDb();
    const existing = await db.exec('SELECT id, url FROM content WHERE id = ?', [id]);
    if (existing.length === 0 || existing[0].values.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const currentUrl = existing[0].values[0][1];
    let finalUrl = url;

    if (file) {
      if (!finalUrl) {
        finalUrl = await storage.upload(file, 'content');
      }
      await removeFileFromStorageOrLocal(currentUrl);
    }

    const updates = [];
    const params = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    if (type) {
      updates.push('type = ?');
      params.push(type);
    }
    if (finalUrl) {
      updates.push('url = ?');
      params.push(finalUrl);
    }

    params.push(id);
    await db.run(`UPDATE content SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDatabase();

    const updated = await db.exec('SELECT * FROM content WHERE id = ?', [id]);
    const contentItem = mapContentRows(updated)[0];
    const resolved = await resolveContentRows([contentItem]);

    res.json({ message: 'Content updated', content: resolved[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteContent = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const found = await prisma.content.findUnique({ where: { id } });

    if (!found) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const storagePath = found.url && !found.url.startsWith('http')
      ? (found.url.startsWith('/uploads/') ? found.url.replace(/^\/uploads\//, '') : found.url)
      : null;

    if (storagePath) {
      try {
        await storage.delete(storagePath);
      } catch (_e) {
        // ignore cleanup error
      }
    }

    await prisma.content.delete({ where: { id } });

    res.json({ message: 'Content deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFreeContent = async (_req, res) => {
  try {
    const rows = await prisma.content.findMany({
      where: {
        OR: [{ planTier: 'free' }, { isFree: 1 }],
      },
      include: { uploader: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    let content = rows.map(formatContent);
    content = await resolveContentUrls(content);
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
