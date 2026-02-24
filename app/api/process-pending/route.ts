import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export async function POST() {
  try {
    const pendingRequests = await query(
      `SELECT id, learner_name FROM sor_requests WHERE status = 'pending'`
    );

    let processed = 0;
    for (const req of pendingRequests) {
      await execute(
        `UPDATE sor_requests SET status = 'pdf_generated', updated_at = NOW() WHERE id = ?`,
        [req.id]
      );
      await execute(
        `INSERT INTO sor_audit_log (sor_request_id, action, details, status) 
         VALUES (?, 'pdf_generated', 'Auto-processed from pending', 'success')`,
        [req.id]
      );
      processed++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} pending requests`,
      processed,
    });
  } catch (error) {
    console.error('Process pending error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
