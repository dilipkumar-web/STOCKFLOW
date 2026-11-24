import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET suppliers with associated purchase orders count
export async function GET(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';

  try {
    const params: any[] = [];
    let whereClause = '';

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE (s.name ILIKE $1 OR s.company ILIKE $1 OR s.email ILIKE $1 OR s.supplier_id ILIKE $1)`;
    }

    const res = await query(
      `SELECT 
        s.supplier_id,
        s.name,
        s.company,
        s.phone,
        s.email,
        s.address,
        COUNT(po.order_id) as orders_count
      FROM stockflow.suppliers s
      LEFT JOIN stockflow.purchase_orders po ON s.supplier_id = po.supplier_id
      ${whereClause}
      GROUP BY s.supplier_id, s.name, s.company, s.phone, s.email, s.address
      ORDER BY s.company ASC`,
      params
    );

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create supplier
export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { supplier_id, name, company, phone, email, address } = body;

    if (!name || !company || !email) {
      return NextResponse.json(
        { success: false, error: 'Name, company, and email are required.' },
        { status: 400 }
      );
    }

    const supId = supplier_id
      ? String(supplier_id).trim().toUpperCase()
      : `SUP-${Date.now().toString().slice(-4)}`;

    const res = await query(
      `INSERT INTO stockflow.suppliers (supplier_id, name, company, phone, email, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [supId, name.trim(), company.trim(), phone || '', email.trim().toLowerCase(), address || '']
    );

    return NextResponse.json({
      success: true,
      message: 'Supplier added successfully',
      data: res.rows[0],
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'A supplier with this ID already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
