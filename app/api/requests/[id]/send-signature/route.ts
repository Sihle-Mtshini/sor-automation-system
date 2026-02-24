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
      `UPDATE sor_requests SET status = 'signature_sent', signature_sent_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [requestId]
    );

    await execute(
      `INSERT INTO sor_audit_log (sor_request_id, action, details, status) 
       VALUES (?, 'signature_sent', 'Sent for e-signature', 'success')`,
      [requestId]
    );

    return NextResponse.json({
      success: true,
      message: 'Sent for signature successfully',
    });
  } catch (error) {
    console.error('Send signature error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
