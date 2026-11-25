import './loadEnv.js';
import { connectDb } from './db/init.js';
import app from './app.js';

const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set — using development fallback');
  process.env.JWT_SECRET = 'teclia_dev_secret_change_this';
}

const dbHost = (() => {
  try {
    return new URL(process.env.DATABASE_URL || '').hostname || '(missing DATABASE_URL)';
  } catch {
    return '(invalid DATABASE_URL)';
  }
})();

connectDb()
  .then(() => {
    console.log(`✓ Database initialized (${dbHost})`);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Teclia Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('✗ Failed to initialize database:', err);
    process.exit(1);
  });
