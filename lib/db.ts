// ==============================================================================
// STOCKFLOW - PostgreSQL Database Connection Pool
// Provider: Aiven PostgreSQL
// Reusable connection pool, SSL handling, parameterized query helper
// ==============================================================================

import { Pool, PoolClient, QueryResult, QueryResultRow, types } from 'pg';

// Parse PostgreSQL BIGINT (OID 20) as safe string or number
types.setTypeParser(20, (val: string) => {
  const num = parseInt(val, 10);
  return Number.isSafeInteger(num) ? num : val;
});

// Parse PostgreSQL NUMERIC (OID 1700) as floating point number
types.setTypeParser(1700, (val: string) => {
  return parseFloat(val);
});

// Global singleton pool for serverless & dev environments to prevent connection exhaustion
let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // If DATABASE_URL is not set (e.g. during next build static phase), return a dummy pool that throws on query
    console.warn('[DB WARNING] DATABASE_URL is not set. Database operations will fail if invoked.');
    pool = new Pool({ connectionString: 'postgres://dummy:dummy@localhost:5432/dummy' });
    return pool;
  }

  // Setup SSL options for Aiven PostgreSQL
  const sslConfig: any = {
    rejectUnauthorized: false,
  };

  if (process.env.AIVEN_CA_CERT) {
    sslConfig.ca = process.env.AIVEN_CA_CERT.replace(/\\n/g, '\n');
    sslConfig.rejectUnauthorized = true;
  }

  // Strip sslmode parameter from URL so pg doesn't override our sslConfig
  const cleanConnectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, '');

  pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: sslConfig,
    max: 10, // Serverless-friendly limit
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[DB POOL ERROR] Unexpected error on idle client:', err);
  });

  return pool;
}

/**
 * Execute a parameterized query on the pool
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool();
  const start = Date.now();
  try {
    const res = await p.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`[SLOW QUERY] ${duration}ms: ${text.substring(0, 80)}...`);
    }
    return res;
  } catch (error: any) {
    console.error('[DB QUERY ERROR]', {
      query: text,
      params,
      message: error?.message,
    });
    throw error;
  }
}

/**
 * Get a client from the pool for manual transactions (BEGIN, COMMIT, ROLLBACK)
 */
export async function getClient(): Promise<PoolClient> {
  const p = getPool();
  const client = await p.connect();
  return client;
}

/**
 * Execute a callback inside an atomic PostgreSQL transaction
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check connectivity to Aiven PostgreSQL without revealing secrets
 */
export async function testConnection(): Promise<{ ok: boolean; timestamp?: string; error?: string }> {
  try {
    const res = await query('SELECT NOW() as current_time, current_database() as db_name');
    return {
      ok: true,
      timestamp: res.rows[0]?.current_time?.toISOString?.() || String(res.rows[0]?.current_time),
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Database connection failed',
    };
  }
}
