const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: dbUrl.replace(/[?&]sslmode=[^&]+/g, ''),
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Adding dispatch columns to stockflow.customer_orders...');
    await pool.query(`
      ALTER TABLE stockflow.customer_orders 
      ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS carrier VARCHAR(100),
      ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
    `);
    console.log('✓ Successfully added dispatch columns: tracking_number, carrier, dispatched_at');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

run();
