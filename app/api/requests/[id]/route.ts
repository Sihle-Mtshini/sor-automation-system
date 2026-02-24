import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
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

    const auditLog = await query(
      `SELECT action, details, status, created_at 
       FROM sor_audit_log WHERE sor_request_id = ? ORDER BY created_at DESC`,
      [requestId]
    );

    return NextResponse.json({
      success: true,
      data: {
        id: req.id,
        learner_name: req.learner_name,
        learner_email: req.learner_email || '',
        learner_id: req.learner_id,
        status: req.status,
        overall_score: req.overall_score ? Number(req.overall_score) : null,
        pdf_path: req.pdf_path,
        signature_request_id: req.signature_request_id,
        created_at: req.created_at ? new Date(req.created_at as string).toISOString() : null,
        updated_at: req.updated_at ? new Date(req.updated_at as string).toISOString() : null,
        signed_at: req.signed_at ? new Date(req.signed_at as string).toISOString() : null,
        uploaded_at: req.uploaded_at ? new Date(req.uploaded_at as string).toISOString() : null,
        error_message: req.error_message,
        audit_log: auditLog.map((log: Record<string, unknown>) => ({
          action: log.action,
          details: log.details,
          status: log.status,
          created_at: log.created_at ? new Date(log.created_at as string).toISOString() : null,
        })),
      },
    });
  } catch (error) {
    console.error('Request detail error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
