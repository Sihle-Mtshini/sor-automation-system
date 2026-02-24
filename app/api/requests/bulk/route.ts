import { NextRequest, NextResponse } from 'next/server';
import { transaction } from '@/lib/db';
import type { PoolConnection, ResultSetHeader } from 'mysql2/promise';

interface LearnerData {
  learner_id: number;
  learner_name: string;
  learner_email?: string;
  overall_score?: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { learners } = data as { learners: LearnerData[] };

    if (!learners || !Array.isArray(learners) || learners.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No learners provided' },
        { status: 400 }
      );
    }

    const results = await transaction(async (connection: PoolConnection) => {
      const created: { id: number; learner_name: string; status: string }[] = [];
      const failed: { learner_name: string; error: string }[] = [];

      for (const learner of learners) {
        try {
          if (!learner.learner_name || !learner.learner_id) {
            failed.push({
              learner_name: learner.learner_name || 'Unknown',
              error: 'Missing learner name or ID',
            });
            continue;
          }

          // Check for duplicate (same learner_id with pending/pdf_generated status)
          const [existing] = await connection.execute(
            `SELECT id FROM sor_requests WHERE learner_id = ? AND status IN ('pending', 'pdf_generated', 'signature_sent')`,
            [learner.learner_id]
          );

          if (Array.isArray(existing) && existing.length > 0) {
            failed.push({
              learner_name: learner.learner_name,
              error: 'Active SOR request already exists',
            });
            continue;
          }

          const [result] = await connection.execute(
            `INSERT INTO sor_requests (learner_id, learner_name, learner_email, overall_score, status) 
             VALUES (?, ?, ?, ?, 'pending')`,
            [learner.learner_id, learner.learner_name, learner.learner_email || '', learner.overall_score || null]
          );

          const insertResult = result as ResultSetHeader;
          const sorId = insertResult.insertId;

          await connection.execute(
            `INSERT INTO sor_audit_log (sor_request_id, action, details, status) 
             VALUES (?, 'request_created', ?, 'success')`,
            [sorId, `Bulk SOR request created for ${learner.learner_name}${learner.overall_score ? ` with score: ${learner.overall_score}%` : ''}`]
          );

          created.push({
            id: sorId,
            learner_name: learner.learner_name,
            status: 'pending',
          });
        } catch (err) {
          failed.push({
            learner_name: learner.learner_name || 'Unknown',
            error: String(err),
          });
        }
      }

      return { created, failed };
    });

    return NextResponse.json({
      success: true,
      message: `Created ${results.created.length} SOR requests, ${results.failed.length} failed`,
      data: {
        created: results.created,
        failed: results.failed,
        total_created: results.created.length,
        total_failed: results.failed.length,
      },
    });
  } catch (error) {
    console.error('Bulk request creation error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
