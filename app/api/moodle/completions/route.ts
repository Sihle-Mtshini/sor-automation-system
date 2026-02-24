import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const moodleUrl = process.env.MOODLE_URL;
    const moodleToken = process.env.MOODLE_TOKEN;

    if (!moodleUrl || !moodleToken) {
      return NextResponse.json(
        { success: false, error: 'Moodle configuration missing' },
        { status: 500 }
      );
    }

    // Get enrolled users from Moodle
    const enrolledUrl = `${moodleUrl}/webservice/rest/server.php?wstoken=${moodleToken}&wsfunction=core_enrol_get_enrolled_users&moodlewsrestformat=json${courseId ? `&courseid=${courseId}` : '&courseid=2'}`;
    
    const enrolledRes = await fetch(enrolledUrl);
    const enrolledUsers = await enrolledRes.json();

    if (enrolledUsers?.exception) {
      return NextResponse.json(
        { success: false, error: enrolledUsers.message || 'Moodle API error' },
        { status: 500 }
      );
    }

    if (!Array.isArray(enrolledUsers)) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No enrolled users found',
      });
    }

    // Get course completion status for each user
    const completions = [];

    for (const user of enrolledUsers) {
      try {
        const completionUrl = `${moodleUrl}/webservice/rest/server.php?wstoken=${moodleToken}&wsfunction=core_completion_get_course_completion_status&moodlewsrestformat=json&courseid=${courseId || 2}&userid=${user.id}`;
        
        const completionRes = await fetch(completionUrl);
        const completionData = await completionRes.json();

        const isComplete = completionData?.completionstatus?.completed === true;

        completions.push({
          id: user.id,
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
          email: user.email || '',
          completed: isComplete,
          completion_date: completionData?.completionstatus?.timecompleted 
            ? new Date(completionData.completionstatus.timecompleted * 1000).toISOString()
            : null,
        });
      } catch {
        // If completion check fails for a user, still include them
        completions.push({
          id: user.id,
          firstname: user.firstname || '',
          lastname: user.lastname || '',
          fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
          email: user.email || '',
          completed: false,
          completion_date: null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: completions,
      total: completions.length,
      completed_count: completions.filter(c => c.completed).length,
    });
  } catch (error) {
    console.error('Moodle completions error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
