#!/usr/bin/env node
import { initDb, getDb, saveDatabase } from '../Backend/db/init.js';

async function main() {
  await initDb();
  const db = getDb();

  const adminEmail = 'austinrmz2007@gmail.com';
  const adminRow = db.exec('SELECT id FROM users WHERE LOWER(email) = ?', [adminEmail]);
  let adminId = null;
  if (adminRow.length > 0 && adminRow[0].values.length > 0) {
    adminId = adminRow[0].values[0][0];
  }

  if (adminId) {
    db.run('UPDATE content SET uploaded_by = ? WHERE uploaded_by != ?', [adminId, adminId]);
  }

  db.run("DELETE FROM users WHERE LOWER(COALESCE(role, 'student')) != 'admin'");
  db.run("INSERT OR REPLACE INTO site_stats (key, value) VALUES ('production_user_reset_v1', 1)");

  saveDatabase();
  console.log('Purge complete. Non-admin users removed. Admin id:', adminId);
}

main().catch((err) => {
  console.error('Error running purge:', err);
  process.exit(1);
});
