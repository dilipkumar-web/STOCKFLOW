import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, company, phone, email, address } = body;

    const res = await query(
      `UPDATE stockflow.suppliers
       SET name = $1, company = $2, phone = $3, email = $4, address = $5
       WHERE supplier_id = $6
       RETURNING *`,
      [name.trim(), company.trim(), phone || '', email.trim().toLowerCase(), address || '', params.id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supplier updated successfully',
      data: res.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const poCheck = await query(
      `SELECT COUNT(*) as count FROM stockflow.purchase_orders WHERE supplier_id = $1`,
      [params.id]
    );

    if (parseInt(poCheck.rows[0]?.count || '0', 10) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete supplier with associated purchase orders.',
        },
        { status: 400 }
      );
    }

    const delRes = await query(`DELETE FROM stockflow.suppliers WHERE supplier_id = $1 RETURNING supplier_id`, [params.id]);

    if (delRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
