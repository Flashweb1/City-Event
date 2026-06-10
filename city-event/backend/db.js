import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};

export const initDB = async () => {
  const result = await pool.query('SELECT NOW()');
  console.log('✅ PostgreSQL Connected');
  return result;
};

pool.on('error', (err) => {
  console.warn('PostgreSQL pool error (non-fatal):', err.message);
});

export default pool;