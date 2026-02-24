import { NextRequest, NextResponse } from 'next/server';

async function moodleCall(moodleUrl: string, token: string, wsfunction: string, params: Record<string, string | number> = {}) {
  const formData = new URLSearchParams();
  formData.append('wstoken', token);
  formData.append('wsfunction', wsfunction);
  formData.append('moodlewsrestformat', 'json');
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, String(value));
  }

  console.log('[v0] Moodle POST to:', `${moodleUrl}/webservice/rest/server.php`, 'function:', wsfunction);

  const res = await fetch(`${moodleUrl}/webservice/rest/server.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  const text = await res.text();
  console.log('[v0] Moodle response status:', res.status, 'body (first 300):', text.substring(0, 300));

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid Moodle response: ${text.substring(0, 200)}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const moodleUrl = (process.env.MOODLE_URL || '').replace(/\/+$/, '');
    const moodleToken = (process.env.MOODLE_TOKEN || '').trim();

    console.log('[v0] MOODLE_URL:', moodleUrl ? `${moodleUrl.substring(0, 30)}...` : 'NOT SET');
    console.log('[v0] MOODLE_TOKEN length:', moodleToken.length);

    if (!moodleUrl || !moodleToken) {
      return NextResponse.json(
        { success: false, error: `Moodle configuration missing. URL set: ${!!moodleUrl}, Token set: ${!!moodleToken}` },
        { status: 500 }
      );
    }

    // First test the connection
    const siteInfo = await moodleCall(moodleUrl, moodleToken, 'core_webservice_get_site_info');
    
    if (siteInfo?.exception) {
      console.log('[v0] Moodle auth error:', siteInfo.message, siteInfo.errorcode);
      return NextResponse.json(
        { success: false, error: `Moodle auth error: ${siteInfo.message}. Check your MOODLE_TOKEN env var.` },
        { status: 401 }
      );
    }

    console.log('[v0] Connected to Moodle:', siteInfo?.sitename);

    const targetCourseId = courseId || '2';

    // Get enrolled users from Moodle using POST
    const enrolledUsers = await moodleCall(moodleUrl, moodleToken, 'core_enrol_get_enrolled_users', {
      courseid: targetCourseId,
    });

    if (enrolledUsers?.exception) {
      return NextResponse.json(
        { success: false, error: enrolledUsers.message || 'Moodle API error' },
        { status: 500 }
      );
    }

    if (!Array.isArray(enrolledUsers) || enrolledUsers.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        completed_count: 0,
        message: `No enrolled users found for course ${targetCourseId}`,
      });
    }

    console.log('[v0] Found', enrolledUsers.length, 'enrolled users');

    // Get course completion status for each user
    const completions = [];

    for (const user of enrolledUsers) {
      try {
        const completionData = await moodleCall(moodleUrl, moodleToken, 'core_completion_get_course_completion_status', {
          courseid: targetCourseId,
          userid: user.id,
        });

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
    console.error('[v0] Moodle completions error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
