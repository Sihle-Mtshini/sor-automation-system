<?php
/**
 * MindWorx SOR Automation - Grading API
 *
 * @package    local_sor
 * @copyright  2026 MindWorx
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sor\external;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');
require_once($CFG->dirroot . '/mod/assign/locallib.php');
require_once($CFG->libdir . '/gradelib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;
use context_module;
use assign;

class grading_api extends external_api {

    /**
     * Grade submission parameters
     */
    public static function grade_submission_parameters() {
        return new external_function_parameters(
            array(
                'assignmentid' => new external_value(PARAM_INT, 'Assignment ID'),
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'grade' => new external_value(PARAM_FLOAT, 'Grade value (percentage)'),
                'feedback' => new external_value(PARAM_RAW, 'Feedback comments', VALUE_DEFAULT, ''),
                'attemptnumber' => new external_value(PARAM_INT, 'Attempt number', VALUE_DEFAULT, -1),
            )
        );
    }

    /**
     * Grade a single submission
     */
    public static function grade_submission($assignmentid, $userid, $grade, $feedback = '', $attemptnumber = -1) {
        global $DB, $USER;

        $params = self::validate_parameters(self::grade_submission_parameters(), array(
            'assignmentid' => $assignmentid,
            'userid' => $userid,
            'grade' => $grade,
            'feedback' => $feedback,
            'attemptnumber' => $attemptnumber,
        ));

        // Get assignment
        $assign = $DB->get_record('assign', array('id' => $params['assignmentid']), '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('assign', $assign->id, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

        self::validate_context($context);
        require_capability('mod/assign:grade', $context);

        $assignobj = new assign($context, $cm, $course);
        $timenow = time();

        // Get or create grade record
        $graderecord = $DB->get_record('assign_grades', array(
            'assignment' => $params['assignmentid'],
            'userid' => $params['userid']
        ));

        // Calculate actual grade based on assignment max grade
        $maxgrade = $assign->grade;
        $actualgrade = ($params['grade'] / 100) * $maxgrade;

        if (!$graderecord) {
            // Create new grade
            $graderecord = new \stdClass();
            $graderecord->assignment = $params['assignmentid'];
            $graderecord->userid = $params['userid'];
            $graderecord->timecreated = $timenow;
            $graderecord->timemodified = $timenow;
            $graderecord->grader = $USER->id;
            $graderecord->grade = $actualgrade;
            $graderecord->attemptnumber = $params['attemptnumber'] >= 0 ? $params['attemptnumber'] : 0;
            $graderecord->id = $DB->insert_record('assign_grades', $graderecord);
        } else {
            // Update existing grade
            $graderecord->timemodified = $timenow;
            $graderecord->grader = $USER->id;
            $graderecord->grade = $actualgrade;
            if ($params['attemptnumber'] >= 0) {
                $graderecord->attemptnumber = $params['attemptnumber'];
            }
            $DB->update_record('assign_grades', $graderecord);
        }

        // Add feedback if provided
        if (!empty($params['feedback'])) {
            $feedbackrecord = $DB->get_record('assignfeedback_comments', array(
                'assignment' => $params['assignmentid'],
                'grade' => $graderecord->id
            ));

            if (!$feedbackrecord) {
                $feedbackrecord = new \stdClass();
                $feedbackrecord->assignment = $params['assignmentid'];
                $feedbackrecord->grade = $graderecord->id;
                $feedbackrecord->commenttext = $params['feedback'];
                $feedbackrecord->commentformat = FORMAT_HTML;
                $DB->insert_record('assignfeedback_comments', $feedbackrecord);
            } else {
                $feedbackrecord->commenttext = $params['feedback'];
                $DB->update_record('assignfeedback_comments', $feedbackrecord);
            }
        }

        // Update gradebook
        $assignobj->update_grade($graderecord);

        // Log the grading
        $event = \mod_assign\event\submission_graded::create(array(
            'context' => $context,
            'objectid' => $graderecord->id,
            'relateduserid' => $params['userid'],
        ));
        $event->trigger();

        // Get user info
        $user = $DB->get_record('user', array('id' => $params['userid']));

        return array(
            'success' => true,
            'gradeid' => $graderecord->id,
            'grade' => $actualgrade,
            'maxgrade' => $maxgrade,
            'percentage' => $params['grade'],
            'message' => "Grade saved successfully for {$user->firstname} {$user->lastname}: {$params['grade']}%",
        );
    }

    /**
     * Grade submission returns
     */
    public static function grade_submission_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'gradeid' => new external_value(PARAM_INT, 'Grade record ID'),
                'grade' => new external_value(PARAM_FLOAT, 'Actual grade value'),
                'maxgrade' => new external_value(PARAM_FLOAT, 'Maximum grade'),
                'percentage' => new external_value(PARAM_FLOAT, 'Grade percentage'),
                'message' => new external_value(PARAM_TEXT, 'Result message'),
            )
        );
    }

    /**
     * Bulk grade submissions parameters
     */
    public static function bulk_grade_submissions_parameters() {
        return new external_function_parameters(
            array(
                'assignmentid' => new external_value(PARAM_INT, 'Assignment ID'),
                'grades' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'userid' => new external_value(PARAM_INT, 'User ID'),
                            'grade' => new external_value(PARAM_FLOAT, 'Grade percentage'),
                            'feedback' => new external_value(PARAM_RAW, 'Feedback', VALUE_DEFAULT, ''),
                        )
                    )
                ),
            )
        );
    }

    /**
     * Grade multiple submissions at once
     */
    public static function bulk_grade_submissions($assignmentid, $grades) {
        global $DB;

        $params = self::validate_parameters(self::bulk_grade_submissions_parameters(), array(
            'assignmentid' => $assignmentid,
            'grades' => $grades,
        ));

        // Get assignment
        $assign = $DB->get_record('assign', array('id' => $params['assignmentid']), '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('assign', $assign->id, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);

        self::validate_context($context);
        require_capability('mod/assign:grade', $context);

        $results = array();
        $successcount = 0;
        $failcount = 0;

        foreach ($params['grades'] as $gradedata) {
            try {
                $result = self::grade_submission(
                    $params['assignmentid'],
                    $gradedata['userid'],
                    $gradedata['grade'],
                    $gradedata['feedback']
                );
                $results[] = array(
                    'userid' => $gradedata['userid'],
                    'success' => true,
                    'message' => $result['message'],
                );
                $successcount++;
            } catch (\Exception $e) {
                $results[] = array(
                    'userid' => $gradedata['userid'],
                    'success' => false,
                    'message' => $e->getMessage(),
                );
                $failcount++;
            }
        }

        return array(
            'success' => $failcount == 0,
            'totalprocessed' => count($params['grades']),
            'successcount' => $successcount,
            'failcount' => $failcount,
            'results' => $results,
        );
    }

    /**
     * Bulk grade submissions returns
     */
    public static function bulk_grade_submissions_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Overall success'),
                'totalprocessed' => new external_value(PARAM_INT, 'Total processed'),
                'successcount' => new external_value(PARAM_INT, 'Success count'),
                'failcount' => new external_value(PARAM_INT, 'Fail count'),
                'results' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'userid' => new external_value(PARAM_INT, 'User ID'),
                            'success' => new external_value(PARAM_BOOL, 'Success'),
                            'message' => new external_value(PARAM_TEXT, 'Message'),
                        )
                    )
                ),
            )
        );
    }

    /**
     * Get grading status parameters
     */
    public static function get_grading_status_parameters() {
        return new external_function_parameters(
            array(
                'assignmentid' => new external_value(PARAM_INT, 'Assignment ID'),
            )
        );
    }

    /**
     * Get grading status for assignment
     */
    public static function get_grading_status($assignmentid) {
        global $DB;

        $params = self::validate_parameters(self::get_grading_status_parameters(), array(
            'assignmentid' => $assignmentid,
        ));

        // Get assignment
        $assign = $DB->get_record('assign', array('id' => $params['assignmentid']), '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('assign', $assign->id, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);

        self::validate_context($context);
        require_capability('mod/assign:grade', $context);

        // Count submissions
        $totalsubmissions = $DB->count_records('assign_submission', array(
            'assignment' => $params['assignmentid'],
            'latest' => 1,
            'status' => 'submitted'
        ));

        // Count graded
        $graded = $DB->count_records_sql(
            "SELECT COUNT(DISTINCT g.userid)
             FROM {assign_grades} g
             JOIN {assign_submission} s ON s.assignment = g.assignment AND s.userid = g.userid
             WHERE g.assignment = :assignmentid AND s.status = 'submitted' AND s.latest = 1",
            array('assignmentid' => $params['assignmentid'])
        );

        $ungraded = $totalsubmissions - $graded;

        // Get ungraded submissions
        $ungradedlist = $DB->get_records_sql(
            "SELECT s.id, s.userid, u.firstname, u.lastname, u.email, s.timemodified
             FROM {assign_submission} s
             JOIN {user} u ON u.id = s.userid
             LEFT JOIN {assign_grades} g ON g.assignment = s.assignment AND g.userid = s.userid
             WHERE s.assignment = :assignmentid AND s.status = 'submitted' AND s.latest = 1 AND g.id IS NULL
             ORDER BY s.timemodified ASC",
            array('assignmentid' => $params['assignmentid'])
        );

        $ungradedusers = array();
        foreach ($ungradedlist as $sub) {
            $ungradedusers[] = array(
                'userid' => $sub->userid,
                'fullname' => $sub->firstname . ' ' . $sub->lastname,
                'email' => $sub->email,
                'submissiontime' => $sub->timemodified,
            );
        }

        return array(
            'totalsubmissions' => $totalsubmissions,
            'graded' => $graded,
            'ungraded' => $ungraded,
            'percentagegraded' => $totalsubmissions > 0 ? round(($graded / $totalsubmissions) * 100, 1) : 0,
            'ungradedsubmissions' => $ungradedusers,
        );
    }

    /**
     * Get grading status returns
     */
    public static function get_grading_status_returns() {
        return new external_single_structure(
            array(
                'totalsubmissions' => new external_value(PARAM_INT, 'Total submissions'),
                'graded' => new external_value(PARAM_INT, 'Graded count'),
                'ungraded' => new external_value(PARAM_INT, 'Ungraded count'),
                'percentagegraded' => new external_value(PARAM_FLOAT, 'Percentage graded'),
                'ungradedsubmissions' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'userid' => new external_value(PARAM_INT, 'User ID'),
                            'fullname' => new external_value(PARAM_TEXT, 'Full name'),
                            'email' => new external_value(PARAM_TEXT, 'Email'),
                            'submissiontime' => new external_value(PARAM_INT, 'Submission time'),
                        )
                    )
                ),
            )
        );
    }

    /**
     * Release grades parameters
     */
    public static function release_grades_parameters() {
        return new external_function_parameters(
            array(
                'assignmentid' => new external_value(PARAM_INT, 'Assignment ID'),
                'userids' => new external_multiple_structure(
                    new external_value(PARAM_INT, 'User ID'),
                    'User IDs to release grades for (empty for all)', VALUE_DEFAULT, array()
                ),
            )
        );
    }

    /**
     * Release grades to students (workflow)
     */
    public static function release_grades($assignmentid, $userids = array()) {
        global $DB;

        $params = self::validate_parameters(self::release_grades_parameters(), array(
            'assignmentid' => $assignmentid,
            'userids' => $userids,
        ));

        // Get assignment
        $assign = $DB->get_record('assign', array('id' => $params['assignmentid']), '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('assign', $assign->id, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);

        self::validate_context($context);
        require_capability('mod/assign:grade', $context);

        $assignobj = new assign($context, $cm, $course);

        // Check if marking workflow is enabled
        if (!$assign->markingworkflow) {
            return array(
                'success' => true,
                'message' => 'Marking workflow not enabled - grades are already visible',
                'releasedcount' => 0,
            );
        }

        // Build query to get grades to release
        if (empty($params['userids'])) {
            // Release all graded submissions
            $grades = $DB->get_records_sql(
                "SELECT g.* FROM {assign_grades} g
                 WHERE g.assignment = :assignmentid",
                array('assignmentid' => $params['assignmentid'])
            );
        } else {
            list($insql, $inparams) = $DB->get_in_or_equal($params['userids'], SQL_PARAMS_NAMED);
            $inparams['assignmentid'] = $params['assignmentid'];
            $grades = $DB->get_records_sql(
                "SELECT g.* FROM {assign_grades} g
                 WHERE g.assignment = :assignmentid AND g.userid $insql",
                $inparams
            );
        }

        $releasedcount = 0;
        foreach ($grades as $grade) {
            // Set workflow state to released
            $DB->set_field('assign_user_flags', 'workflowstate', 'released', array(
                'assignment' => $params['assignmentid'],
                'userid' => $grade->userid
            ));

            // Ensure grade is updated in gradebook
            $assignobj->update_grade($grade);
            $releasedcount++;
        }

        return array(
            'success' => true,
            'message' => "Released grades for {$releasedcount} students",
            'releasedcount' => $releasedcount,
        );
    }

    /**
     * Release grades returns
     */
    public static function release_grades_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'message' => new external_value(PARAM_TEXT, 'Result message'),
                'releasedcount' => new external_value(PARAM_INT, 'Number of grades released'),
            )
        );
    }
}
