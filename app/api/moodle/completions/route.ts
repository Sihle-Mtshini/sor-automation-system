import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const moodleUrl = (process.env.MOODLE_URL || '').replace(/\/+$/, '');
    const moodleToken = (process.env.MOODLE_TOKEN || '').trim();

    console.log('[v0] MOODLE_URL set:', !!moodleUrl, 'length:', moodleUrl.length);
    console.log('[v0] MOODLE_TOKEN set:', !!moodleToken, 'length:', moodleToken.length);

    if (!moodleUrl || !moodleToken) {
      return NextResponse.json(
        { success: false, error: `Moodle configuration missing. URL set: ${!!moodleUrl}, Token set: ${!!moodleToken}` },
        { status: 500 }
      );
    }

    const targetCourseId = courseId || '2';

    // Get enrolled users from Moodle
    const enrolledUrl = `${moodleUrl}/webservice/rest/server.php?wstoken=${moodleToken}&wsfunction=core_enrol_get_enrolled_users&moodlewsrestformat=json&courseid=${targetCourseId}`;
    
    console.log('[v0] Moodle enrolled URL:', enrolledUrl.replace(moodleToken, '***'));
    
    const enrolledRes = await fetch(enrolledUrl);
    const enrolledText = await enrolledRes.text();
    console.log('[v0] Moodle response status:', enrolledRes.status);
    console.log('[v0] Moodle response (first 500 chars):', enrolledText.substring(0, 500));
    
    let enrolledUsers;
    try {
      enrolledUsers = JSON.parse(enrolledText);
    } catch {
      return NextResponse.json(
        { success: false, error: `Invalid Moodle response: ${enrolledText.substring(0, 200)}` },
        { status: 500 }
      );
    }

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
        const completionUrl = `${moodleUrl}/webservice/rest/server.php?wstoken=${moodleToken}&wsfunction=core_completion_get_course_completion_status&moodlewsrestformat=json&courseid=${targetCourseId}&userid=${user.id}`;
        
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
