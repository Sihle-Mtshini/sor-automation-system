import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let sql = `SELECT DISTINCT 
                 u.id, 
                 u.firstname, 
                 u.lastname, 
                 u.email,
                 CONCAT(u.firstname, ' ', u.lastname) as fullname
               FROM mdl_user u
               INNER JOIN mdl_user_enrolments ue ON ue.userid = u.id
               INNER JOIN mdl_enrol e ON e.id = ue.enrolid
               WHERE u.deleted = 0 AND u.suspended = 0`;
    const params: unknown[] = [];

    if (search) {
      sql += ` AND (CONCAT(u.firstname, ' ', u.lastname) LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY u.lastname, u.firstname LIMIT 200`;

    const rows = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        firstname: row.firstname,
        lastname: row.lastname,
        email: row.email,
        fullname: row.fullname || `${row.firstname} ${row.lastname}`,
      })),
    });
  } catch (error) {
    console.error('Learners API error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
