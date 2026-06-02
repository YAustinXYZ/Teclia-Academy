import { Pool } from 'pg';

const replacePlaceholders = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
};

const normalizeResult = (result) => {
  if (!result || !result.rows) return [];
  const columns = result.fields.map((field) => field.name);
  const values = result.rows.map((row) => columns.map((col) => row[col]));
  return values.length > 0 ? [{ columns, values }] : [];
};

const mapColumns = async (db, table) => {
  const result = await db.exec(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
    [table]
  );
  if (!result.length || !result[0].values.length) return [];
  return result[0].values.map((row) => row[0]);
};

export const createPostgresDb = (connectionString) => {
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
  });

  const db = {
    isPostgres: true,
    async exec(sql, params = []) {
      const text = replacePlaceholders(sql);
      const result = await pool.query(text, params);
      return normalizeResult(result);
    },
    async run(sql, params = []) {
      const text = replacePlaceholders(sql);
      return pool.query(text, params);
    },
    async query(sql, params = []) {
      const text = replacePlaceholders(sql);
      return pool.query(text, params);
    },
    async close() {
      await pool.end();
    },
    async getTableColumns(table) {
      return await mapColumns(this, table);
    },
  };

  return db;
};
