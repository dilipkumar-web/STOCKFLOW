import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { errorResponse } = await requireAuth(req, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const res = await query(
      `UPDATE stockflow.purchase_orders
       SET status = 'Cancelled'
       WHERE order_id = $1 AND status = 'Pending'
       RETURNING *`,
      [params.id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found or cannot be cancelled (not in Pending status).' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Purchase order ${params.id} cancelled.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
