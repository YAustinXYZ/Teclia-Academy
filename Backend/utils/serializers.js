import { resolveAvatarUrl } from './avatarUrl.js';

export const formatUser = (user, { avatarUrl } = {}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  plan_tier: user.planTier ?? null,
  avatar_url: avatarUrl !== undefined ? avatarUrl : resolveAvatarUrl(user.avatarUrl),
});

export const formatUserWithCreatedAt = (user, options) => ({
  ...formatUser(user, options),
  created_at: user.createdAt ?? null,
});

export const formatContent = (item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  type: item.type,
  url: item.url,
  is_free: item.isFree,
  plan_tier: item.planTier || (item.isFree ? 'free' : 'basico'),
  uploaded_by: item.uploadedBy,
  created_at: item.createdAt,
  uploaded_by_name: item.uploader?.name ?? item.uploaded_by_name ?? null,
});
