import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await testConnection();

  if (result.ok) {
    return NextResponse.json({
      status: 'healthy',
      system: 'STOCKFLOW',
      timestamp: result.timestamp || new Date().toISOString(),
      database: 'connected (Aiven PostgreSQL)',
    });
  }

  return NextResponse.json(
    {
      status: 'degraded',
      system: 'STOCKFLOW',
      timestamp: new Date().toISOString(),
      database: 'unreachable',
      message: 'Database check failed. Please verify DATABASE_URL and network access.',
    },
    { status: 503 }
  );
}
