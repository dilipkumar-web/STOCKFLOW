import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Client products catalog with stock status & search
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  const sortBy = url.searchParams.get('sortBy') || 'name';
  const sortOrder = url.searchParams.get('sortOrder') === 'desc' ? 'DESC' : 'ASC';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '12', 10));
  const offset = (page - 1) * limit;

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.product_id ILIKE $${params.length} OR p.category ILIKE $${params.length})`);
    }

    if (category && category !== 'All') {
      params.push(category);
      conditions.push(`p.category = $${params.length}`);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      params.push(parseFloat(minPrice));
      conditions.push(`p.price >= $${params.length}`);
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      params.push(parseFloat(maxPrice));
      conditions.push(`p.price <= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) as total FROM stockflow.products p ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    let orderCol = 'p.name';
    if (sortBy === 'price') orderCol = 'p.price';
    if (sortBy === 'newest') orderCol = 'p.created_at';

    const productsRes = await query(
      `SELECT 
        p.product_id,
        p.name,
        p.category,
        p.price,
        p.reorder_level,
        p.created_at,
        COALESCE(SUM(i.quantity), 0) as available_stock,
        CASE 
          WHEN COALESCE(SUM(i.quantity), 0) = 0 THEN 'Out of Stock'
          WHEN COALESCE(SUM(i.quantity), 0) <= p.reorder_level THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM stockflow.products p
      LEFT JOIN stockflow.inventory i ON p.product_id = i.product_id
      ${whereClause}
      GROUP BY p.product_id, p.name, p.category, p.price, p.reorder_level, p.created_at
      ORDER BY ${orderCol} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const categoriesRes = await query(`SELECT DISTINCT category FROM stockflow.products ORDER BY category`);

    return NextResponse.json({
      success: true,
      data: productsRes.rows,
      categories: ['All', ...categoriesRes.rows.map((r) => r.category)],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
