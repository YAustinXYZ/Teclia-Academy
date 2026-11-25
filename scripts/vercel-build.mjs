import { execSync } from 'node:child_process';

const run = (command) => {
  execSync(command, { stdio: 'inherit', env: process.env });
};

run('npm run prisma:generate --prefix Backend');

const dbUrl = process.env.DATABASE_URL?.trim() ?? '';
const isPostgres =
  dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

if (isPostgres) {
  run('npm run prisma:deploy --prefix Backend');
} else {
  throw new Error('[vercel-build] DATABASE_URL must be a PostgreSQL URL; refusing to build without the application database');
}

run('vite build');
