# STOCKFLOW — Inventory & Supply Chain Management System

**STOCKFLOW** is an enterprise-grade, modern, production-ready Inventory and Supply Chain Management System engineered with Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts, and Aiven PostgreSQL.

STOCKFLOW delivers a dual-interface architecture:
1. **Administrator Control Portal** — Multi-warehouse inventory monitoring, automated purchase ordering, atomic inter-warehouse transfers, supplier management, order dispatch fulfillment, client access control, immutable transaction audit ledgers, and executive intelligence reporting.
2. **Client Procurement Portal** — B2B/retail product browsing, category filtering, persistent PostgreSQL shopping carts, zero-overselling atomic checkout, live shipment tracking milestones, and profile management.

---

## 1. System Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 with Next.js 14 App Router |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS with responsive dark & light palette |
| **Icons & Visuals** | Lucide React |
| **Interactive Analytics** | Recharts (Area, Bar, Pie, Progress indicators) |
| **Database Engine** | Aiven PostgreSQL (PostgreSQL Cloud Cluster) |
| **Database Driver** | `pg` (node-postgres) with connection pooling & SSL |
| **Authentication** | HTTP-Only SameSite=Lax Secure JWT Session Cookies |
| **Password Security** | Bcrypt (10 salt rounds), brute-force sliding rate limiting |
| **Deployment Target** | Unified deployment on Vercel |

---

## 2. Key Features

### 🛡️ Administrator Operations
- **Real-Time Executive Dashboard**: High-level KPIs, total inventory valuation, aggregate unit counts, movement trends, warehouse utilization graphs, and low-stock alerts.
- **Product Catalog Management**: Create, edit, and categorize products with SKU tracking, unit pricing, reorder thresholds, and referential integrity protection.
- **Inventory Adjustments**: Stock IN and Stock OUT operations with automatic warehouse capacity validation.
- **Purchase Orders (PO)**: Draft multi-item purchase orders for vendors. Atomically receive inventory directly into specified facilities with immutable audit logs.
- **Inter-Warehouse Stock Transfers**: Rebalance inventory between facilities with source deduction, destination crediting, and capacity checks.
- **Customer Order Fulfillment & Dispatch**:
  - Filter orders by fulfillment states: `Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`.
  - Dedicated **Dispatch Modal**: Select courier partners (*Blue Dart, Delhivery, DTDC, FedEx, Shadowfax, etc.*), generate or enter tracking waybills, and dispatch orders.
  - Safe Order Cancellation: Atomically restores allocated stock back into warehouse inventory with audit logs.
- **Audit Ledger**: Comprehensive historical audit trail for all `IN`, `OUT`, and `TRANSFER` operations with CSV export.
- **Intelligence Reports**: 7 downloadable analytical reports (Valuation, Movement Velocity, Supplier PO Breakdown, Warehouse Capacities, etc.).

### 🛒 Client Procurement Portal
- **Live In-Stock Browsing**: Search, filter by category, and inspect real-time product availability with Rupee (₹) pricing.
- **Persistent Cloud Cart**: Cart items stay saved in PostgreSQL across browser refreshes and user sessions.
- **Atomic Checkout**: Cash on Delivery (COD) order placement with PostgreSQL row locks to guarantee zero-overselling.
- **Live Milestone Tracking**: Real-time progress timeline (`Pending` → `Confirmed` → `Processing` → `Shipped (Dispatched)` → `Delivered`) displaying assigned courier and consignment waybill numbers.

---

## 3. Database Schema

The database consists of 11 relational tables under the `stockflow` schema in Aiven PostgreSQL:

### Core Supply Chain Tables
1. `stockflow.products` — SKU, name, category, unit price, reorder level, created timestamp.
2. `stockflow.suppliers` — Vendor ID, contact person, company, email, phone, physical address.
3. `stockflow.warehouses` — Warehouse ID, facility name, regional location, maximum unit capacity.
4. `stockflow.inventory` — Compound unique `(product_id, warehouse_id)`, available stock count, last updated.
5. `stockflow.purchase_orders` — Order ID, supplier FK, destination warehouse FK, dates, status (`Pending`, `Received`, `Cancelled`).
6. `stockflow.order_items` — Item ID, order FK, product FK, ordered quantity, unit price.
7. `stockflow.stock_transactions` — Immutable audit log for `IN`, `OUT`, and `TRANSFER` operations with facility references and remarks.

### Client Portal & Order Fulfillment Tables
8. `stockflow.users` — User ID, full name, email, password hash, role (`admin` or `client`), status (`active` or `inactive`), created at.
9. `stockflow.customer_orders` — Order ID, user FK, order date, total amount, shipping address, order status (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`), payment status, carrier, tracking number, dispatched timestamp.
10. `stockflow.customer_order_items` — Order item ID, customer order FK, product FK, quantity, unit price, line total.
11. `stockflow.cart_items` — Cart item ID, user FK, product FK, quantity, added at.

---

## 4. Installation & Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/dilipkumar-web/STOCKFLOW.git
cd STOCKFLOW
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```env
# Aiven PostgreSQL Connection URI
DATABASE_URL=postgres://avnadmin:YOUR_PASSWORD@YOUR_AIVEN_HOST:PORT/STOCKFLOW?sslmode=require

# Target Schema
DB_SCHEMA=stockflow

# JWT Session Secret (32+ characters)
JWT_SECRET=super_secret_stockflow_jwt_key_replace_with_random_bytes_in_production_32char

NODE_ENV=development
```

### Step 4: Verify Database Connection
```bash
npm run test-db
```

### Step 5: Run Database Migrations
Initialize the schema and tables in your Aiven database:
```bash
npm run migrate
```

### Step 6: Create the Administrator Account
Run the secure admin creation CLI tool:
```bash
npm run create-admin
```
*(Or specify custom credentials: `node scripts/create-admin.js "System Administrator" "admin@stockflow.com" "Admin@123456" "+91 9876543210"`)*

### Step 7: (Optional) Seed Demo Data
Populate realistic client users and sample customer orders:
```bash
npm run seed-demo
```

### Step 8: Start the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Testing & Demo Credentials

Both portals include **1-Click Quick Demo Fill** buttons on their login pages:

### 🛡️ Administrator Portal
- **URL**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Email**: `admin@stockflow.com` (or `admin`)
- **Password**: `Admin@123456` (or `admin123`)

### 🛒 Client Purchasing Portal
- **URL**: [http://localhost:3000/client/login](http://localhost:3000/client/login)
- **Email**: `client@stockflow.com` (or `client@example.com` / `client`)
- **Password**: `Client@123` (or `client123`)
- **Registration**: [http://localhost:3000/client/register](http://localhost:3000/client/register)

---

## 6. Deployment on Vercel

STOCKFLOW deploys seamlessly to Vercel as a single unified application:

1. Push your code to your GitHub repository:
   ```bash
   git remote add origin https://github.com/dilipkumar-web/STOCKFLOW.git
   git branch -M main
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **Add New** → **Project**.
3. Import your `dilipkumar-web/STOCKFLOW` repository.
4. Set the Environment Variables in the Vercel project settings:
   - `DATABASE_URL`: Your Aiven PostgreSQL connection URI with `?sslmode=require`
   - `DB_SCHEMA`: `stockflow`
   - `JWT_SECRET`: Secure 32+ character random string
   - `NODE_ENV`: `production`
5. Click **Deploy**.

---

## 7. Security & Integrity

- **ACID Transactions**: Financial totals, inventory additions, and stock transfers execute within atomic transaction blocks (`BEGIN ... COMMIT ... ROLLBACK`).
- **Row-Level Locking**: High-concurrency operations utilize PostgreSQL `FOR UPDATE` row locks to prevent race conditions and over-allocation.
- **Credential Protection**: Bcrypt hashing with 10 salt rounds for stored passwords.
- **Session Security**: HTTP-only, SameSite=Lax JWT cookies preventing client-side script interception.
- **Brute-Force Rate Limiting**: In-memory sliding window lockout on failed authentication attempts.

---

## 8. License
Developed for Academic DBMS Demonstration & Enterprise Logistics Management.
