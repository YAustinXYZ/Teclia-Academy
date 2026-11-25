import { execSync } from 'node:child_process';

const run = (command, { allowFail = false } = {}) => {
  try {
    execSync(command, { stdio: 'inherit', env: process.env });
    return true;
  } catch (error) {
    if (!allowFail) {
      throw error;
    }
    console.warn(`[vercel-build] Command failed (continuing): ${command}`);
    return false;
  }
};

run('npm run prisma:generate --prefix Backend');

const dbUrl = process.env.DATABASE_URL?.trim() ?? '';
const isPostgres =
  dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

if (isPostgres) {
  // Supabase may already be migrated from Render — do not fail the frontend build.
  run('npm run prisma:deploy --prefix Backend', { allowFail: true });
} else if (dbUrl) {
  console.warn('[vercel-build] DATABASE_URL is not PostgreSQL — skipping prisma migrate deploy');
} else {
  console.warn('[vercel-build] DATABASE_URL not set — skipping prisma migrate deploy');
}

run('vite build');
