import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';
import { normalizeLegacyUsers } from '../utils/dbUsers.js';
import { createPostgresDb } from './pgAdapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH
  || (process.env.DATABASE_DIR
    ? path.join(process.env.DATABASE_DIR, 'teclia.db')
    : process.env.RENDER_DATA_DIR
      ? path.join(process.env.RENDER_DATA_DIR, 'teclia.db')
      : path.join(__dirname, 'teclia.db'));

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const ADMIN_EMAIL = 'austinrmz2007@gmail.com';
const ADMIN_NAME = 'Austin';
const ADMIN_PASSWORD = 'Mondaisa2007*';

let db = null;
let SQL = null;
let isPostgres = false;

const tryAlter = async (sql) => {
  try {
    await db.run(sql);
  } catch {
    // column may already exist or cannot be altered
  }
};

const migrateAdminAccount = async () => {
  const adminPassword = bcryptjs.hashSync(ADMIN_PASSWORD, 10);
  const existing = await db.exec('SELECT id, role FROM users WHERE LOWER(email) = ?', [ADMIN_EMAIL]);

  if (existing.length > 0 && existing[0].values.length > 0) {
    await db.run(
      'UPDATE users SET password_hash = ?, name = ?, role = ?, plan_tier = NULL WHERE LOWER(email) = ?',
      [adminPassword, ADMIN_NAME, 'admin', ADMIN_EMAIL]
    );
  } else {
    await db.run(
      'INSERT INTO users (email, password_hash, name, role, plan_tier) VALUES (?, ?, ?, ?, ?)',
      [ADMIN_EMAIL, adminPassword, ADMIN_NAME, 'admin', null]
    );
  }

  const adminRow = await db.exec('SELECT id FROM users WHERE LOWER(email) = ?', [ADMIN_EMAIL]);
  const adminId = adminRow[0].values[0][0];

  const oldAdmin = await db.exec("SELECT id FROM users WHERE LOWER(email) = 'admin@teclia.com'");
  if (oldAdmin.length > 0 && oldAdmin[0].values.length > 0) {
    const oldAdminId = oldAdmin[0].values[0][0];
    await db.run('UPDATE content SET uploaded_by = ? WHERE uploaded_by = ?', [adminId, oldAdminId]);
    await db.run("DELETE FROM users WHERE LOWER(email) = 'admin@teclia.com'");
  }
};

const removeSeededStudents = async () => {
  await db.run("DELETE FROM users WHERE LOWER(email) IN ('student1@teclia.com', 'student2@teclia.com', 'admin@teclia.com')");
};

const purgeLegacyNonAdminUsers = async () => {
  const flag = await db.exec("SELECT value FROM site_stats WHERE key = 'production_user_reset_v1'");
  if (flag.length > 0 && flag[0].values.length > 0) {
    return;
  }

  const adminRow = await db.exec('SELECT id FROM users WHERE LOWER(email) = ?', [ADMIN_EMAIL]);
  if (adminRow.length > 0 && adminRow[0].values.length > 0) {
    const adminId = adminRow[0].values[0][0];
    await db.run('UPDATE content SET uploaded_by = ? WHERE uploaded_by != ?', [adminId, adminId]);
  }

  await db.run("DELETE FROM users WHERE LOWER(COALESCE(role, 'student')) != 'admin'");
  await db.run("INSERT INTO site_stats (key, value) VALUES ('production_user_reset_v1', 1)");
};

const createSqliteDb = async () => {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    avatar_url TEXT DEFAULT NULL,
    reset_pin TEXT DEFAULT NULL,
    reset_pin_expires_at DATETIME DEFAULT NULL,
    plan_tier TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    is_free INTEGER DEFAULT 0,
    plan_tier TEXT DEFAULT 'free',
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS site_stats (
    key TEXT PRIMARY KEY,
    value INTEGER DEFAULT 0
  )`);

  await tryAlter('ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT NULL');
  await tryAlter('ALTER TABLE users ADD COLUMN reset_pin TEXT DEFAULT NULL');
  await tryAlter('ALTER TABLE users ADD COLUMN reset_pin_expires_at DATETIME DEFAULT NULL');
  await tryAlter('ALTER TABLE users ADD COLUMN plan_tier TEXT DEFAULT NULL');
  await tryAlter('ALTER TABLE content ADD COLUMN is_free INTEGER DEFAULT 0');
  await tryAlter("ALTER TABLE content ADD COLUMN plan_tier TEXT DEFAULT 'free'");
};

const createPostgresSchema = async () => {
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      avatar_url TEXT,
      reset_pin TEXT,
      reset_pin_expires_at TIMESTAMP,
      plan_tier TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS content (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      is_free INTEGER DEFAULT 0,
      plan_tier TEXT DEFAULT 'free',
      uploaded_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS site_stats (
      key TEXT PRIMARY KEY,
      value INTEGER DEFAULT 0
    )
  `);

  await tryAlter("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT");
  await tryAlter("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_pin TEXT");
  await tryAlter("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_pin_expires_at TIMESTAMP");
  await tryAlter("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT NULL");
  await tryAlter("ALTER TABLE content ADD COLUMN IF NOT EXISTS is_free INTEGER DEFAULT 0");
  await tryAlter("ALTER TABLE content ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free'");
};

export const initDb = async () => {
  if (process.env.DATABASE_URL) {
    console.log('🔗 Attempting to connect to Postgres...');
    console.log('📍 Database URL detected:', process.env.DATABASE_URL.substring(0, 50) + '...');
    try {
      db = createPostgresDb(process.env.DATABASE_URL);
      isPostgres = true;
      await db.query('SELECT 1');
      console.log('✓ Postgres connection test succeeded');
      await createPostgresSchema();
      console.log('✓ Postgres schema created');
    } catch (err) {
      console.error('❌ Failed to connect to Postgres:', err.message);
      throw err;
    }
  } else {
    console.log('⚠️  DATABASE_URL not found, using SQLite');
    await createSqliteDb();
  }

  try {
    await db.run("DELETE FROM content WHERE url LIKE 'https://example.com/%'");
    if (!isPostgres) {
      await removeSeededStudents();
    }
    await normalizeLegacyUsers(db);
    await migrateAdminAccount();
    await purgeLegacyNonAdminUsers();
  } catch (e) {
    console.log('Migration notice:', e.message);
  }

  if (!isPostgres) {
    saveDb();
  }
};

const saveDb = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
};

export const getDb = () => db;
export const saveDatabase = () => {
  if (!isPostgres) saveDb();
};

export default { initDb, getDb, saveDatabase };
