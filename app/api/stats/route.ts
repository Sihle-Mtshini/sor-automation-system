import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET() {
  try {
    // Total counts by status
    const statusCounts = await query<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count FROM sor_requests GROUP BY status`
    );

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of statusCounts) {
      counts[row.status] = Number(row.count);
      total += Number(row.count);
    }

    // Overdue signature requests (sent > 7 days ago)
    const overdueRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM sor_requests 
       WHERE status = 'signature_sent' 
       AND signature_sent_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // Recent activity (last 24h)
    const recentRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM sor_audit_log 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    // Today's created
    const todayRow = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM sor_requests 
       WHERE DATE(created_at) = CURDATE()`
    );

    return NextResponse.json({
      success: true,
      data: {
        total_requests: total,
        pending: counts['pending'] || 0,
        pdf_generated: counts['pdf_generated'] || 0,
        signature_sent: counts['signature_sent'] || 0,
        signed: counts['signed'] || 0,
        uploaded: counts['uploaded'] || 0,
        failed: counts['failed'] || 0,
        overdue: Number(overdueRow?.count || 0),
        recent_activity: Number(recentRow?.count || 0),
        today_created: Number(todayRow?.count || 0),
      },
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
