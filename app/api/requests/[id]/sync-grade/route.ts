import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id, 10);

    const req = await queryOne(
      `SELECT * FROM sor_requests WHERE id = ?`,
      [requestId]
    );

    if (!req) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    await execute(
      `INSERT INTO sor_audit_log (sor_request_id, action, details, status) 
       VALUES (?, 'grade_synced', ?, 'success')`,
      [requestId, `Grade synced: ${req.overall_score || 0}%`]
    );

    return NextResponse.json({
      success: true,
      message: `Grade synced successfully`,
    });
  } catch (error) {
    console.error('Sync grade error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
