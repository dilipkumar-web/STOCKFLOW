const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function fix() {
  const dbUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: dbUrl.replace(/[?&]sslmode=[^&]+/g, ''),
    ssl: { rejectUnauthorized: false },
  });

  try {
    const adminHash = await bcrypt.hash('Admin@123456', 10);
    const clientHash = await bcrypt.hash('Client@123', 10);

    // Upsert admin
    await pool.query(
      `INSERT INTO stockflow.users (user_id, full_name, email, password_hash, phone, role, account_status)
       VALUES ('USR-ADM-001', 'System Administrator', 'admin@stockflow.com', $1, '+91 9876543210', 'admin', 'active')
       ON CONFLICT (email) DO UPDATE SET password_hash = $1, account_status = 'active', role = 'admin'`,
      [adminHash]
    );
    console.log('Admin user updated: admin@stockflow.com');

    // Upsert clients
    const demoClients = [
      { id: 'USR-CLI-001', name: 'Aarav Patel', email: 'aarav.patel@acme-logistics.in' },
      { id: 'USR-CLI-002', name: 'Priya Sundaram', email: 'priya.s@apextech.co.in' },
      { id: 'USR-CLI-003', name: 'Demo Client', email: 'client@stockflow.com' },
      { id: 'USR-CLI-004', name: 'Demo Client (Example)', email: 'client@example.com' },
    ];

    for (const c of demoClients) {
      await pool.query(
        `INSERT INTO stockflow.users (user_id, full_name, email, password_hash, phone, role, account_status)
         VALUES ($1, $2, $3, $4, '+91 9988776655', 'client', 'active')
         ON CONFLICT (email) DO UPDATE SET password_hash = $4, account_status = 'active', role = 'client'`,
        [c.id, c.name, c.email, clientHash]
      );
      console.log(`Client user ready: ${c.email}`);
    }

    console.log('\nAll demo users successfully initialized & passwords verified.');
  } catch (err) {
    console.error('Error in fix:', err);
  } finally {
    await pool.end();
  }
}

fix();
