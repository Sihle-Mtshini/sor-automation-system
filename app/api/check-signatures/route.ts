import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    const overdueRequests = await query(
      `SELECT id, learner_name, signature_sent_at 
       FROM sor_requests 
       WHERE status = 'signature_sent' 
       AND signature_sent_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    return NextResponse.json({
      success: true,
      message: `Found ${overdueRequests.length} overdue signature requests`,
      overdue: overdueRequests.length,
      data: overdueRequests,
    });
  } catch (error) {
    console.error('Check signatures error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
