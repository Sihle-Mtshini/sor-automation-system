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

    // Update status to pdf_generated
    await execute(
      `UPDATE sor_requests SET status = 'pdf_generated', updated_at = NOW() WHERE id = ?`,
      [requestId]
    );

    await execute(
      `INSERT INTO sor_audit_log (sor_request_id, action, details, status) 
       VALUES (?, 'pdf_generated', 'PDF generated successfully', 'success')`,
      [requestId]
    );

    return NextResponse.json({
      success: true,
      message: 'PDF generated successfully',
    });
  } catch (error) {
    console.error('Generate PDF error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
