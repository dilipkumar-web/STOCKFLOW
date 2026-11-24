import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Products with search, category filtering, sorting, pagination & live stock
export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';
  const sortBy = url.searchParams.get('sortBy') || 'name';
  const sortOrder = url.searchParams.get('sortOrder') === 'desc' ? 'DESC' : 'ASC';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10));
  const offset = (page - 1) * limit;

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.product_id ILIKE $${params.length} OR p.category ILIKE $${params.length})`);
    }

    if (category) {
      params.push(category);
      conditions.push(`p.category = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count for pagination
    const countRes = await query(
      `SELECT COUNT(*) as total FROM stockflow.products p ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Dynamic order clause safely mapped
    let orderColumn = 'p.name';
    if (sortBy === 'price') orderColumn = 'p.price';
    if (sortBy === 'product_id') orderColumn = 'p.product_id';
    if (sortBy === 'stock') orderColumn = 'total_stock';

    const listQuery = `
      SELECT 
        p.product_id,
        p.name,
        p.category,
        p.price,
        p.reorder_level,
        p.created_at,
        COALESCE(SUM(i.quantity), 0) as total_stock,
        COUNT(DISTINCT i.warehouse_id) as warehouses_count,
        CASE 
          WHEN COALESCE(SUM(i.quantity), 0) = 0 THEN 'Out of Stock'
          WHEN COALESCE(SUM(i.quantity), 0) <= p.reorder_level THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM stockflow.products p
      LEFT JOIN stockflow.inventory i ON p.product_id = i.product_id
      ${whereClause}
      GROUP BY p.product_id, p.name, p.category, p.price, p.reorder_level, p.created_at
      ORDER BY ${orderColumn} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const listRes = await query(listQuery, [...params, limit, offset]);

    // Categories list for filter dropdown
    const catRes = await query(`SELECT DISTINCT category FROM stockflow.products ORDER BY category`);

    return NextResponse.json({
      success: true,
      data: listRes.rows,
      categories: catRes.rows.map((r) => r.category),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[PRODUCTS GET ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new product
export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { product_id, name, category, price, reorder_level } = body;

    if (!name || !category || price === undefined || price === null) {
      return NextResponse.json(
        { success: false, error: 'Product name, category, and price are required.' },
        { status: 400 }
      );
    }

    // Auto-generate safe product ID if not specified
    const generatedId = product_id
      ? String(product_id).trim().toUpperCase()
      : `PRD-${Date.now().toString().slice(-6)}`;

    const numPrice = parseFloat(price);
    const numReorder = parseInt(reorder_level || '10', 10);

    if (numPrice < 0 || numReorder < 0) {
      return NextResponse.json(
        { success: false, error: 'Price and reorder level must be non-negative.' },
        { status: 400 }
      );
    }

    const insertRes = await query(
      `INSERT INTO stockflow.products (product_id, name, category, price, reorder_level, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [generatedId, name.trim(), category.trim(), numPrice, numReorder]
    );

    return NextResponse.json({
      success: true,
      message: 'Product added successfully',
      data: insertRes.rows[0],
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'A product with this Product ID already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
