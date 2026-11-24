// ==============================================================================
// STOCKFLOW - Secure Admin Account Creation CLI Script
// Creates an administrator account in stockflow.users with bcrypt password hash
// Usage: node scripts/create-admin.js [name] [email] [password] [phone]
// ==============================================================================

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Load .env.local or .env manually if dotenv is not loaded
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
  console.log('  STOCKFLOW - Secure Admin Account Creation Tool');
  console.log('======================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ ERROR: DATABASE_URL is not defined.');
    console.error('Please create a .env.local file with your Aiven PostgreSQL URL:');
    console.error('DATABASE_URL=postgres://user:password@host:port/STOCKFLOW?sslmode=require\n');
    process.exit(1);
  }

  // Parse arguments or use default administrator credentials
  const args = process.argv.slice(2);
  const fullName = args[0] || 'System Administrator';
  const email = (args[1] || 'admin@stockflow.com').toLowerCase().trim();
  const password = args[2] || 'Admin@123456';
  const phone = args[3] || '+91 9876543210';
  const userId = `USR-ADM-${Date.now().toString().slice(-6)}`;

  console.log(`Creating/Updating Admin Account:`);
  console.log(`  • Name:     ${fullName}`);
  console.log(`  • Email:    ${email}`);
  console.log(`  • Role:     admin`);
  console.log(`  • Phone:    ${phone}`);
  console.log(`  • Password: ${password.replace(/./g, '*')}`);

  const cleanUrl = dbUrl.replace(/[?&]sslmode=[^&]+/g, '');
  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('\n[1/3] Connecting to Aiven PostgreSQL...');
    const testRes = await pool.query('SELECT NOW() as now, current_database() as db');
    console.log(`Connected to database "${testRes.rows[0].db}" at ${testRes.rows[0].now}`);

    console.log('[2/3] Hashing password with bcrypt (10 rounds)...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('[3/3] Inserting admin into stockflow.users...');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT to_regclass('stockflow.users') as exists;
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Table stockflow.users does not exist yet. Creating table first...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS stockflow.users (
            user_id VARCHAR(50) PRIMARY KEY,
            full_name VARCHAR(150) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
            account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✓ Created stockflow.users table.');
    }

    const upsertQuery = `
      INSERT INTO stockflow.users (user_id, full_name, email, password_hash, phone, role, account_status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'admin', 'active', CURRENT_TIMESTAMP)
      ON CONFLICT (email) 
      DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        phone = EXCLUDED.phone,
        role = 'admin',
        account_status = 'active'
      RETURNING user_id, full_name, email, role, account_status;
    `;

    const res = await pool.query(upsertQuery, [userId, fullName, email, passwordHash, phone]);
    const admin = res.rows[0];

    console.log('\n======================================================');
    console.log('  ✅ ADMIN ACCOUNT READY FOR LOGIN!');
    console.log('======================================================');
    console.log(`  Admin User ID: ${admin.user_id}`);
    console.log(`  Full Name:     ${admin.full_name}`);
    console.log(`  Email:         ${admin.email}`);
    console.log(`  Password:      ${password}`);
    console.log(`  Role:          ${admin.role}`);
    console.log(`  Status:        ${admin.account_status}`);
    console.log('======================================================');
    console.log('\nYou can now log in at: http://localhost:3000/admin/login\n');
  } catch (error) {
    console.error('\n❌ Failed to create admin account:', error.message);
  } finally {
    await pool.end();
  }
}

main();
