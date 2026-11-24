// ==============================================================================
// STOCKFLOW - Database Health & Schema Inspector CLI Script
// Inspects existing 7 tables and additional 4 tables in Aiven PostgreSQL
// Usage: node scripts/test-db-connection.js
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

async function main() {
  console.log('\n======================================================');
  console.log('  STOCKFLOW - Aiven PostgreSQL Connection & Schema Check');
  console.log('======================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('⚠️ DATABASE_URL not found in .env.local or environment.');
    console.log('Please configure .env.local with your Aiven PostgreSQL URL:');
    console.log('DATABASE_URL=postgres://avnadmin:your_pass@your-host.aivencloud.com:port/STOCKFLOW?sslmode=require\n');
    return;
  }

  // Strip sslmode from connection string to allow ssl config object to control certificate validation
  const cleanUrl = dbUrl.replace(/[?&]sslmode=[^&]+/g, '');

  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const info = await pool.query(`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as pg_version,
        NOW() as current_time
    `);
    console.log('✓ Successfully connected to Aiven PostgreSQL!');
    console.log(`  • Database:   ${info.rows[0].database_name}`);
    console.log(`  • User:       ${info.rows[0].user_name}`);
    console.log(`  • Server Time:${info.rows[0].current_time}`);
    console.log(`  • Engine:     ${info.rows[0].pg_version.split(',')[0]}`);

    console.log('\n--- Checking Stockflow Schema & Tables ---');
    const tables = [
      // 7 Existing tables
      { name: 'products', type: 'Existing Core Table' },
      { name: 'suppliers', type: 'Existing Core Table' },
      { name: 'warehouses', type: 'Existing Core Table' },
      { name: 'inventory', type: 'Existing Core Table' },
      { name: 'purchase_orders', type: 'Existing Core Table' },
      { name: 'order_items', type: 'Existing Core Table' },
      { name: 'stock_transactions', type: 'Existing Core Table' },
      // 4 Additional tables
      { name: 'users', type: 'Portal / Auth Table' },
      { name: 'customer_orders', type: 'Client Portal Table' },
      { name: 'customer_order_items', type: 'Client Portal Table' },
      { name: 'cart_items', type: 'Client Portal Table' },
    ];

    for (const t of tables) {
      try {
        const res = await pool.query(`SELECT COUNT(*) as count FROM stockflow.${t.name}`);
        console.log(`  ✓ stockflow.${t.name.padEnd(22)}: ${res.rows[0].count} records (${t.type})`);
      } catch (err) {
        console.log(`  ✗ stockflow.${t.name.padEnd(22)}: NOT FOUND (${err.message})`);
      }
    }

    console.log('\n======================================================');
    console.log('  Database verification completed.');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await pool.end();
  }
}

main();
