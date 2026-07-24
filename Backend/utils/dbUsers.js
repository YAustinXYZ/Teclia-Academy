import prisma from './prismaClient.js';
import { formatUserWithCreatedAt } from './serializers.js';
import { resolveAvatarUrlAsync } from './avatarUrl.js';

export const listNonAdminUsers = async () => {
  const users = await prisma.user.findMany({
    where: { NOT: { role: 'admin' } },
    orderBy: { id: 'desc' },
  });

  return Promise.all(
    users.map(async (user) =>
      formatUserWithCreatedAt(user, {
        avatarUrl: await resolveAvatarUrlAsync(user.avatarUrl),
      }),
    ),
  );
};
