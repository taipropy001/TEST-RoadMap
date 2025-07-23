import sql from 'mssql';

const config: sql.config = {
  server: import.meta.env.VITE_SQL_SERVER_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_SQL_SERVER_PORT || '1433'),
  database: import.meta.env.VITE_SQL_SERVER_DATABASE || 'jira_roadmap',
  user: import.meta.env.VITE_SQL_SERVER_USER || 'sa',
  password: import.meta.env.VITE_SQL_SERVER_PASSWORD || '',
  options: {
    encrypt: import.meta.env.VITE_SQL_SERVER_ENCRYPT === 'true',
    trustServerCertificate: import.meta.env.VITE_SQL_SERVER_TRUST_CERT === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
  }
  return pool;
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.close();
    pool = null;
  }
};

export { sql };