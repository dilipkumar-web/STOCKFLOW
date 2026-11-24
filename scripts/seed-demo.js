// ==============================================================================
// STOCKFLOW - Sample Client & Customer Order Seeder for Demo
// Creates 2 verified clients and realistic customer orders without touching existing records
// Usage: npm run seed-demo
// ==============================================================================

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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

async function seed() {
  console.log('\n======================================================');
  console.log('  STOCKFLOW - Seeding Demo Clients & Customer Orders');
  console.log('======================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl.replace(/[?&]sslmode=[^&]+/g, ''),
    ssl: { rejectUnauthorized: false },
  });

  try {
    const hash = await bcrypt.hash('Client@123', 10);

    // 1. Seed demo clients
    const clients = [
      {
        id: 'USR-CLI-001',
        name: 'Aarav Patel',
        email: 'aarav.patel@acme-logistics.in',
        phone: '+91 9823456789',
      },
      {
        id: 'USR-CLI-002',
        name: 'Priya Sundaram',
        email: 'priya.s@apextech.co.in',
        phone: '+91 9712345678',
      },
      {
        id: 'USR-CLI-003',
        name: 'Demo Client User',
        email: 'client@stockflow.com',
        phone: '+91 9988776655',
      },
    ];

    for (const c of clients) {
      await pool.query(
        `INSERT INTO stockflow.users (user_id, full_name, email, password_hash, phone, role, account_status)
         VALUES ($1, $2, $3, $4, $5, 'client', 'active')
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name`,
        [c.id, c.name, c.email, hash, c.phone]
      );
      console.log(`  ✓ Client seeded: ${c.email} (Password: Client@123)`);
    }

    // 2. Fetch available products
    const prodRes = await pool.query(`SELECT product_id, price FROM stockflow.products LIMIT 5`);
    if (prodRes.rows.length === 0) {
      console.log('No products found to create orders.');
      return;
    }

    const prods = prodRes.rows;

    // 3. Seed demo customer orders
    const sampleOrders = [
      {
        id: 'ORD-100201',
        userId: 'USR-CLI-001',
        address: 'Plot 45, Phase 3, Hinjewadi IT Park, Pune, Maharashtra 411057',
        status: 'Delivered',
        daysAgo: 8,
        items: [
          { prodId: prods[0].product_id, qty: 3, price: parseFloat(prods[0].price) },
          { prodId: prods[1 % prods.length].product_id, qty: 2, price: parseFloat(prods[1 % prods.length].price) },
        ],
      },
      {
        id: 'ORD-100202',
        userId: 'USR-CLI-002',
        address: 'Sector 62, Electronic City, Noida, Uttar Pradesh 201309',
        status: 'Shipped',
        daysAgo: 4,
        items: [
          { prodId: prods[2 % prods.length].product_id, qty: 4, price: parseFloat(prods[2 % prods.length].price) },
        ],
      },
      {
        id: 'ORD-100203',
        userId: 'USR-CLI-003',
        address: 'Brigade Gateway, Rajajinagar, Bengaluru, Karnataka 560010',
        status: 'Confirmed',
        daysAgo: 1,
        items: [
          { prodId: prods[0].product_id, qty: 1, price: parseFloat(prods[0].price) },
          { prodId: prods[3 % prods.length].product_id, qty: 2, price: parseFloat(prods[3 % prods.length].price) },
        ],
      },
      {
        id: 'ORD-100204',
        userId: 'USR-CLI-001',
        address: 'Plot 45, Phase 3, Hinjewadi IT Park, Pune, Maharashtra 411057',
        status: 'Processing',
        daysAgo: 0,
        items: [
          { prodId: prods[1 % prods.length].product_id, qty: 5, price: parseFloat(prods[1 % prods.length].price) },
        ],
      },
    ];

    for (const ord of sampleOrders) {
      const totalAmount = ord.items.reduce((s, i) => s + i.qty * i.price, 0);

      await pool.query(
        `INSERT INTO stockflow.customer_orders (customer_order_id, user_id, order_date, total_amount, shipping_address, order_status, payment_status, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP - ($3 || ' days')::interval, $4, $5, $6, 'Cash on Delivery', CURRENT_TIMESTAMP)
         ON CONFLICT (customer_order_id) DO NOTHING`,
        [ord.id, ord.userId, ord.daysAgo, totalAmount, ord.address, ord.status]
      );

      for (const item of ord.items) {
        await pool.query(
          `INSERT INTO stockflow.customer_order_items (customer_order_id, product_id, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5)`,
          [ord.id, item.prodId, item.qty, item.price, item.qty * item.price]
        );
      }
      console.log(`  ✓ Demo order created: ${ord.id} (${ord.status}, Total: ₹${totalAmount.toFixed(2)})`);
    }

    // Seed 1 active item in demo client's shopping cart
    await pool.query(
      `INSERT INTO stockflow.cart_items (user_id, product_id, quantity)
       VALUES ('USR-CLI-003', $1, 2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [prods[0].product_id]
    );
    console.log(`  ✓ Sample cart item added for client@stockflow.com`);

    console.log('\n======================================================');
    console.log('  ✅ DEMO CLIENT & ORDER DATA SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('  Client Credentials for Testing:');
    console.log('  • Email:    client@stockflow.com');
    console.log('  • Password: Client@123');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
