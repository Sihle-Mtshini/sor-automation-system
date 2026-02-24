import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const learnerId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    // Get learner info
    const learner = await queryOne(
      `SELECT id, firstname, lastname, email 
       FROM mdl_user WHERE id = ?`,
      [learnerId]
    );

    if (!learner) {
      return NextResponse.json(
        { success: false, error: 'Learner not found' },
        { status: 404 }
      );
    }

    const learnerName = name || `${learner.firstname} ${learner.lastname}`;

    // Fetch quiz grades - using the same logic as the Python fetch_results
    const quizResults = await query(
      `SELECT 
         q.id as quiz_id,
         q.name as topic_name,
         qg.grade as learner_score,
         q.grade as total_marks
       FROM mdl_quiz q
       INNER JOIN mdl_quiz_grades qg ON qg.quiz = q.id
       INNER JOIN mdl_user u ON u.id = qg.userid
       WHERE CONCAT(u.firstname, ' ', u.lastname) = ?
       ORDER BY q.id`,
      [learnerName]
    );

    if (!quizResults || quizResults.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          learner_name: learnerName,
          quizzes: [],
          overall_score: null,
          message: 'No quiz results found',
        },
      });
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    const quizzes = quizResults.map((r: Record<string, unknown>) => {
      const learnerScore = r.learner_score ? Number(r.learner_score) : 0;
      const totalMarks = r.total_marks ? Number(r.total_marks) : 0;
      const percentage = totalMarks > 0 ? Math.round((learnerScore / totalMarks) * 100 * 100) / 100 : 0;

      // Apply equal weighting for now
      totalWeightedScore += percentage;
      totalWeight += 1;

      return {
        quiz_id: r.quiz_id,
        topic_name: r.topic_name,
        score: learnerScore,
        total_marks: totalMarks,
        percentage,
      };
    });

    const overallScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        learner_name: learnerName,
        quizzes,
        overall_score: overallScore,
        quiz_count: quizzes.length,
      },
    });
  } catch (error) {
    console.error('Learner grades error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
