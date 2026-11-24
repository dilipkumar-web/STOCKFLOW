// ==============================================================================
// STOCKFLOW - Optional CLI Migration Runner
// Safely executes client_portal_setup.sql batches on Aiven PostgreSQL
// Usage: npm run migrate
// ==============================================================================

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
      break;
    }
  }
}

loadEnv();

async function runMigration() {
  console.log('\n======================================================');
  console.log('  STOCKFLOW - Running Migration: client_portal_setup.sql');
  console.log('======================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ ERROR: DATABASE_URL not set in .env.local');
    process.exit(1);
  }

  const cleanUrl = dbUrl.replace(/[?&]sslmode=[^&]+/g, '');
  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const sqlPath = path.resolve(process.cwd(), 'client_portal_setup.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Migration file not found at ${sqlPath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing client portal migration on Aiven PostgreSQL...');
    await pool.query(sqlContent);

    console.log('✅ Migration executed successfully!');
    console.log('Created tables:');
    console.log('  • stockflow.users');
    console.log('  • stockflow.customer_orders');
    console.log('  • stockflow.customer_order_items');
    console.log('  • stockflow.cart_items\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
