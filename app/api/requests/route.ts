import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let sql = `SELECT id, learner_id, learner_name, learner_email, status, 
               overall_score, pdf_path, signature_request_id, 
               created_at, updated_at, signature_sent_at, signed_at, uploaded_at, error_message
               FROM sor_requests WHERE 1=1`;
    const params: unknown[] = [];

    if (status && status !== 'all') {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (learner_name LIKE ? OR learner_email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const rows = await query(sql, params);

    const formatted = rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      learner_id: row.learner_id,
      learner_name: row.learner_name,
      learner_email: row.learner_email || '',
      status: row.status,
      overall_score: row.overall_score ? Number(row.overall_score) : null,
      pdf_path: row.pdf_path,
      signature_request_id: row.signature_request_id,
      created_at: row.created_at ? new Date(row.created_at as string).toISOString() : null,
      updated_at: row.updated_at ? new Date(row.updated_at as string).toISOString() : null,
      error_message: row.error_message,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Requests GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { learner_name, learner_email, learner_id, overall_score } = data;

    if (!learner_name || !learner_id) {
      return NextResponse.json(
        { success: false, error: 'Learner name and ID are required' },
        { status: 400 }
      );
    }

    const result = await execute(
      `INSERT INTO sor_requests (learner_id, learner_name, learner_email, overall_score, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [learner_id, learner_name, learner_email || '', overall_score || null]
    );

    const sorId = result.insertId;

    // Log the creation
    await execute(
      `INSERT INTO sor_audit_log (sor_request_id, action, details, status) 
       VALUES (?, 'request_created', ?, 'success')`,
      [sorId, `SOR request created for ${learner_name}${overall_score ? ` with score: ${overall_score}%` : ''}`]
    );

    return NextResponse.json({
      success: true,
      message: 'SOR request created',
      data: {
        id: sorId,
        learner_name,
        learner_email,
        learner_id,
        overall_score,
      },
    });
  } catch (error) {
    console.error('Requests POST error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
