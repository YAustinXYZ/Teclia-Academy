export const getUserTableColumns = async (db) => {
  if (db.isPostgres) {
    const result = await db.exec(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
      ['users']
    );
    if (!result.length || !result[0].values.length) return [];
    return result[0].values.map((row) => row[0]);
  }

  const info = db.exec('PRAGMA table_info(users)');
  if (!info.length || !info[0].values.length) return [];
  return info[0].values.map((row) => row[1]);
};

export const ensureUserColumn = async (db, column, definition) => {
  const columns = await getUserTableColumns(db);
  if (!columns.includes(column)) {
    await db.run(`ALTER TABLE users ADD COLUMN ${definition}`);
  }
};

export const normalizeLegacyUsers = async (db) => {
  await ensureUserColumn(db, 'plan_tier', db.isPostgres ? 'plan_tier TEXT DEFAULT NULL' : 'plan_tier TEXT DEFAULT NULL');
  await ensureUserColumn(db, 'avatar_url', db.isPostgres ? 'avatar_url TEXT DEFAULT NULL' : 'avatar_url TEXT DEFAULT NULL');
  await ensureUserColumn(db, 'created_at', db.isPostgres ? 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'created_at DATETIME DEFAULT CURRENT_TIMESTAMP');

  await db.run("UPDATE users SET role = 'student' WHERE role IS NULL OR TRIM(role) = ''");
  await db.run("UPDATE users SET plan_tier = NULL WHERE plan_tier = ''");
};

export const mapUserRows = (result, formatUser) => {
  if (!result.length || !result[0].values.length) return [];

  const cols = result[0].columns;
  return result[0].values.map((row) => {
    const user = {};
    cols.forEach((col, i) => {
      user[col] = row[i];
    });
    return {
      ...formatUser(user),
      created_at: user.created_at || null,
    };
  });
};

export const listNonAdminUsers = async (db) => {
  await normalizeLegacyUsers(db);

  const columns = await getUserTableColumns(db);
  const hasPlanTier = columns.includes('plan_tier');
  const hasAvatar = columns.includes('avatar_url');
  const hasCreatedAt = columns.includes('created_at');

  const selectParts = [
    'id',
    'name',
    'email',
    'role',
    hasPlanTier ? 'plan_tier' : "NULL AS plan_tier",
    hasAvatar ? 'avatar_url' : "NULL AS avatar_url",
    hasCreatedAt ? 'created_at' : "NULL AS created_at",
  ];

  return await db.exec(`
    SELECT ${selectParts.join(', ')}
    FROM users
    WHERE LOWER(COALESCE(role, 'student')) != 'admin'
    ORDER BY id DESC
  `);
};
