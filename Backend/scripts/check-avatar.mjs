import '../loadEnv.js';
import prisma from '../utils/prismaClient.js';
import { resolveAvatarUrlAsync } from '../utils/avatarUrl.js';

const user = await prisma.user.findFirst({
  where: { email: 'austinrmz2007@gmail.com' },
  select: { id: true, avatarUrl: true },
});

const resolved = await resolveAvatarUrlAsync(user?.avatarUrl);
let status = null;
if (resolved) {
  const res = await fetch(resolved, { method: 'GET' });
  status = res.status;
}

console.log(
  JSON.stringify(
    {
      dbAvatar: user?.avatarUrl,
      resolvedKind: resolved?.includes('token=')
        ? 'signed'
        : resolved?.startsWith('/uploads/')
          ? 'local'
          : resolved?.startsWith('http')
            ? 'public'
            : 'none',
      fetchStatus: status,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
