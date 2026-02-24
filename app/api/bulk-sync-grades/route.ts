import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export async function POST() {
  try {
    const uploadedRequests = await query(
      `SELECT id, learner_name, learner_id, overall_score 
       FROM sor_requests 
       WHERE status = 'uploaded' AND overall_score IS NOT NULL`
    );

    let synced = 0;
    for (const req of uploadedRequests) {
      await execute(
        `INSERT INTO sor_audit_log (sor_request_id, action, details, status) 
         VALUES (?, 'grade_synced', ?, 'success')`,
        [req.id, `Bulk grade sync: ${req.overall_score}%`]
      );
      synced++;
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} grades`,
      synced,
    });
  } catch (error) {
    console.error('Bulk sync grades error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
