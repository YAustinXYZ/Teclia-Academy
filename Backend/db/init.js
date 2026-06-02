import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';
import { normalizeLegacyUsers } from '../utils/dbUsers.js';

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

const tryAlter = (sql) => {
  try {
    db.run(sql);
  } catch {
    // column may already exist
  }
};

const migrateAdminAccount = () => {
  const adminPassword = bcryptjs.hashSync(ADMIN_PASSWORD, 10);
  const existing = db.exec('SELECT id, role FROM users WHERE LOWER(email) = ?', [ADMIN_EMAIL]);

  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run(
      'UPDATE users SET password_hash = ?, name = ?, role = ?, plan_tier = NULL WHERE LOWER(email) = ?',
      [adminPassword, ADMIN_NAME, 'admin', ADMIN_EMAIL]
    );
  } else {
    db.run(
      'INSERT INTO users (email, password_hash, name, role, plan_tier) VALUES (?, ?, ?, ?, ?)',
      [ADMIN_EMAIL, adminPassword, ADMIN_NAME, 'admin', null]
    );
  }

  const adminRow = db.exec('SELECT id FROM users WHERE LOWER(email) = ?', [ADMIN_EMAIL]);
  const adminId = adminRow[0].values[0][0];

  const oldAdmin = db.exec("SELECT id FROM users WHERE LOWER(email) = 'admin@teclia.com'");
  if (oldAdmin.length > 0 && oldAdmin[0].values.length > 0) {
    const oldAdminId = oldAdmin[0].values[0][0];
    db.run('UPDATE content SET uploaded_by = ? WHERE uploaded_by = ?', [adminId, oldAdminId]);
    db.run("DELETE FROM users WHERE LOWER(email) = 'admin@teclia.com'");
  }
};

const removeSeededStudents = () => {
  db.run("DELETE FROM users WHERE LOWER(email) IN ('student1@teclia.com', 'student2@teclia.com', 'admin@teclia.com')");
};

const purgeLegacyNonAdminUsers = () => {
  const flag = db.exec("SELECT value FROM site_stats WHERE key = 'production_user_reset_v1'");
  if (flag.length > 0 && flag[0].values.length > 0) {
    return;
  }

  const adminRow = db.exec('SELECT id FROM users WHERE LOWER(email) = ?', [ADMIN_EMAIL]);
  if (adminRow.length > 0 && adminRow[0].values.length > 0) {
    const adminId = adminRow[0].values[0][0];
    db.run('UPDATE content SET uploaded_by = ? WHERE uploaded_by != ?', [adminId, adminId]);
  }

  db.run("DELETE FROM users WHERE LOWER(COALESCE(role, 'student')) != 'admin'");
  db.run("INSERT INTO site_stats (key, value) VALUES ('production_user_reset_v1', 1)");
};

export const initDb = async () => {
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

  tryAlter('ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT NULL');
  tryAlter('ALTER TABLE users ADD COLUMN reset_pin TEXT DEFAULT NULL');
  tryAlter('ALTER TABLE users ADD COLUMN reset_pin_expires_at DATETIME DEFAULT NULL');
  tryAlter('ALTER TABLE users ADD COLUMN plan_tier TEXT DEFAULT NULL');
  tryAlter('ALTER TABLE content ADD COLUMN is_free INTEGER DEFAULT 0');
  tryAlter("ALTER TABLE content ADD COLUMN plan_tier TEXT DEFAULT 'free'");

  try {
    db.run("DELETE FROM content WHERE url LIKE 'https://example.com/%'");
    removeSeededStudents();
    normalizeLegacyUsers(db);
    migrateAdminAccount();
    purgeLegacyNonAdminUsers();
  } catch (e) {
    console.log('Migration notice:', e.message);
  }

  saveDb();
};

const saveDb = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
};

export const getDb = () => db;
export const saveDatabase = saveDb;

export default { initDb, getDb, saveDatabase };
