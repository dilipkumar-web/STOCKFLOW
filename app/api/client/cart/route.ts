import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Current user's persistent shopping cart
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ['client', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const res = await query(
      `SELECT 
        c.cart_item_id,
        c.user_id,
        c.product_id,
        c.quantity,
        c.added_at,
        p.name,
        p.category,
        p.price,
        (c.quantity * p.price) as line_total,
        COALESCE((SELECT SUM(quantity) FROM stockflow.inventory WHERE product_id = c.product_id), 0) as available_stock
      FROM stockflow.cart_items c
      JOIN stockflow.products p ON c.product_id = p.product_id
      WHERE c.user_id = $1
      ORDER BY c.added_at DESC`,
      [user!.user_id]
    );

    const subtotal = res.rows.reduce((sum, item) => sum + parseFloat(item.line_total || '0'), 0);

    return NextResponse.json({
      success: true,
      data: {
        items: res.rows,
        subtotal,
        totalItems: res.rows.reduce((sum, item) => sum + parseInt(item.quantity, 10), 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add item to cart (UPSERT)
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ['client', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { productId, quantity = 1 } = body;

    const qty = parseInt(quantity, 10);
    if (!productId || isNaN(qty) || qty <= 0) {
      return NextResponse.json({ success: false, error: 'Valid productId and positive quantity required' }, { status: 400 });
    }

    // Verify product exists and check stock
    const prodRes = await query(
      `SELECT p.product_id, p.name, p.price,
              COALESCE((SELECT SUM(quantity) FROM stockflow.inventory WHERE product_id = p.product_id), 0) as available_stock
       FROM stockflow.products p
       WHERE p.product_id = $1`,
      [productId]
    );

    if (prodRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const availableStock = parseInt(prodRes.rows[0].available_stock, 10);
    if (availableStock <= 0) {
      return NextResponse.json({ success: false, error: 'Product is currently out of stock' }, { status: 400 });
    }

    // Upsert into cart_items
    await query(
      `INSERT INTO stockflow.cart_items (user_id, product_id, quantity, added_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = stockflow.cart_items.quantity + EXCLUDED.quantity`,
      [user!.user_id, productId, qty]
    );

    return NextResponse.json({
      success: true,
      message: `Added ${prodRes.rows[0].name} to your cart.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update cart item quantity
export async function PUT(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ['client', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { cartItemId, quantity } = body;

    const qty = parseInt(quantity, 10);
    if (!cartItemId || isNaN(qty)) {
      return NextResponse.json({ success: false, error: 'cartItemId and quantity are required' }, { status: 400 });
    }

    if (qty <= 0) {
      // Remove item
      await query(`DELETE FROM stockflow.cart_items WHERE cart_item_id = $1 AND user_id = $2`, [cartItemId, user!.user_id]);
      return NextResponse.json({ success: true, message: 'Item removed from cart' });
    }

    await query(
      `UPDATE stockflow.cart_items 
       SET quantity = $1 
       WHERE cart_item_id = $2 AND user_id = $3`,
      [qty, cartItemId, user!.user_id]
    );

    return NextResponse.json({ success: true, message: 'Cart updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove single item or clear entire cart
export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req, ['client', 'admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const cartItemId = url.searchParams.get('cartItemId');

  try {
    if (cartItemId) {
      await query(`DELETE FROM stockflow.cart_items WHERE cart_item_id = $1 AND user_id = $2`, [cartItemId, user!.user_id]);
    } else {
      await query(`DELETE FROM stockflow.cart_items WHERE user_id = $1`, [user!.user_id]);
    }
    return NextResponse.json({ success: true, message: 'Cart updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
