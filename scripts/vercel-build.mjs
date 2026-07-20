import { execSync } from 'node:child_process';

const run = (command) => {
  execSync(command, { stdio: 'inherit', env: process.env });
};

run('npm run prisma:generate --prefix Backend');

if (process.env.DATABASE_URL?.trim()) {
  run('npm run prisma:deploy --prefix Backend');
} else {
  console.warn('[vercel-build] DATABASE_URL no definida — se omite prisma migrate deploy');
}

run('vite build');
