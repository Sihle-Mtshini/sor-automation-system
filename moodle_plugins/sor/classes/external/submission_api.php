<?php
/**
 * MindWorx SOR Automation - Submission API
 *
 * @package    local_sor
 * @copyright  2026 MindWorx
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sor\external;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');
require_once($CFG->dirroot . '/mod/assign/locallib.php');

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;
use context_module;
use assign;

class submission_api extends external_api {

    /**
     * Get submission status parameters
     */
    public static function get_submission_status_parameters() {
        return new external_function_parameters(
            array(
                'assignmentid' => new external_value(PARAM_INT, 'Assignment ID'),
                'userid' => new external_value(PARAM_INT, 'User ID'),
            )
        );
    }

    /**
     * Get submission status for a user
     */
    public static function get_submission_status($assignmentid, $userid) {
        global $DB;

        $params = self::validate_parameters(self::get_submission_status_parameters(), array(
            'assignmentid' => $assignmentid,
            'userid' => $userid,
        ));

        // Get assignment
        $assign = $DB->get_record('assign', array('id' => $params['assignmentid']), '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('assign', $assign->id, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);

        self::validate_context($context);

        // Get submission
        $submission = $DB->get_record('assign_submission', array(
            'assignment' => $params['assignmentid'],
            'userid' => $params['userid'],
            'latest' => 1
        ));

        // Get grade
        $grade = $DB->get_record('assign_grades', array(
            'assignment' => $params['assignmentid'],
            'userid' => $params['userid']
        ));

        // Get files
        $files = array();
        if ($submission) {
            $fs = get_file_storage();
            $filerecords = $fs->get_area_files($context->id, 'assignsubmission_file', 'submission_files', $submission->id, 'timemodified', false);
            foreach ($filerecords as $file) {
                $files[] = array(
                    'filename' => $file->get_filename(),
                    'filesize' => $file->get_filesize(),
                    'timemodified' => $file->get_timemodified(),
                    'mimetype' => $file->get_mimetype(),
                );
            }
        }

        return array(
            'submitted' => !empty($submission),
            'status' => $submission ? $submission->status : 'new',
            'timemodified' => $submission ? $submission->timemodified : 0,
            'attemptnumber' => $submission ? $submission->attemptnumber : 0,
            'graded' => !empty($grade),
            'grade' => $grade ? $grade->grade : null,
            'gradetimemodified' => $grade ? $grade->timemodified : 0,
            'files' => $files,
        );
    }

    /**
     * Get submission status returns
     */
    public static function get_submission_status_returns() {
        return new external_single_structure(
            array(
                'submitted' => new external_value(PARAM_BOOL, 'Whether submission exists'),
                'status' => new external_value(PARAM_TEXT, 'Submission status'),
                'timemodified' => new external_value(PARAM_INT, 'Time modified'),
                'attemptnumber' => new external_value(PARAM_INT, 'Attempt number'),
                'graded' => new external_value(PARAM_BOOL, 'Whether graded'),
                'grade' => new external_value(PARAM_FLOAT, 'Grade value', VALUE_OPTIONAL),
                'gradetimemodified' => new external_value(PARAM_INT, 'Grade time modified'),
                'files' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'filename' => new external_value(PARAM_TEXT, 'File name'),
                            'filesize' => new external_value(PARAM_INT, 'File size'),
                            'timemodified' => new external_value(PARAM_INT, 'Time modified'),
                            'mimetype' => new external_value(PARAM_TEXT, 'MIME type'),
                        )
                    )
                ),
            )
        );
    }

    /**
     * Submit SOR file parameters
     */
    public static function submit_sor_file_parameters() {
        return new external_function_parameters(
            array(
                'assignmentid' => new external_value(PARAM_INT, 'Assignment ID'),
                'userid' => new external_value(PARAM_INT, 'User ID'),
                'draftitemid' => new external_value(PARAM_INT, 'Draft item ID from file upload'),
                'learnername' => new external_value(PARAM_TEXT, 'Learner name for reference'),
            )
        );
    }

    /**
     * Submit SOR file for a learner
     */
    public static function submit_sor_file($assignmentid, $userid, $draftitemid, $learnername) {
        global $DB, $CFG;

        $params = self::validate_parameters(self::submit_sor_file_parameters(), array(
            'assignmentid' => $assignmentid,
            'userid' => $userid,
            'draftitemid' => $draftitemid,
            'learnername' => $learnername,
        ));

        // Get assignment
        $assign = $DB->get_record('assign', array('id' => $params['assignmentid']), '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('assign', $assign->id, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);

        self::validate_context($context);
        require_capability('mod/assign:submit', $context);

        $assignobj = new assign($context, $cm, null);

        // Check/create submission
        $submission = $DB->get_record('assign_submission', array(
            'assignment' => $params['assignmentid'],
            'userid' => $params['userid'],
            'latest' => 1
        ));

        $timenow = time();

        if (!$submission) {
            // Create new submission
            $submission = new \stdClass();
            $submission->assignment = $params['assignmentid'];
            $submission->userid = $params['userid'];
            $submission->timecreated = $timenow;
            $submission->timemodified = $timenow;
            $submission->status = 'submitted';
            $submission->attemptnumber = 0;
            $submission->latest = 1;
            $submission->id = $DB->insert_record('assign_submission', $submission);
        } else {
            // Update existing submission
            $submission->timemodified = $timenow;
            $submission->status = 'submitted';
            $DB->update_record('assign_submission', $submission);
        }

        // Move files from draft area
        $fs = get_file_storage();
        file_save_draft_area_files(
            $params['draftitemid'],
            $context->id,
            'assignsubmission_file',
            'submission_files',
            $submission->id,
            array('maxfiles' => 1)
        );

        // Update file submission plugin
        $filesubmission = $DB->get_record('assignsubmission_file', array(
            'assignment' => $params['assignmentid'],
            'submission' => $submission->id
        ));

        if (!$filesubmission) {
            $filesubmission = new \stdClass();
            $filesubmission->assignment = $params['assignmentid'];
            $filesubmission->submission = $submission->id;
            $filesubmission->numfiles = 1;
            $DB->insert_record('assignsubmission_file', $filesubmission);
        } else {
            $filesubmission->numfiles = 1;
            $DB->update_record('assignsubmission_file', $filesubmission);
        }

        // Log the submission
        $event = \mod_assign\event\submission_created::create(array(
            'context' => $context,
            'objectid' => $submission->id,
            'userid' => $params['userid'],
        ));
        $event->trigger();

        return array(
            'success' => true,
            'submissionid' => $submission->id,
            'message' => "SOR submitted successfully for {$params['learnername']}",
        );
    }

    /**
     * Submit SOR file returns
     */
    public static function submit_sor_file_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'submissionid' => new external_value(PARAM_INT, 'Submission ID'),
                'message' => new external_value(PARAM_TEXT, 'Result message'),
            )
        );
    }

    /**
     * Get all submissions parameters
     */
    public static function get_all_submissions_parameters() {
        return new external_function_parameters(
            array(
                'assignmentid' => new external_value(PARAM_INT, 'Assignment ID'),
                'status' => new external_value(PARAM_TEXT, 'Filter by status (optional)', VALUE_DEFAULT, ''),
            )
        );
    }

    /**
     * Get all submissions for an assignment
     */
    public static function get_all_submissions($assignmentid, $status = '') {
        global $DB;

        $params = self::validate_parameters(self::get_all_submissions_parameters(), array(
            'assignmentid' => $assignmentid,
            'status' => $status,
        ));

        // Get assignment
        $assign = $DB->get_record('assign', array('id' => $params['assignmentid']), '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('assign', $assign->id, 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);

        self::validate_context($context);
        require_capability('mod/assign:grade', $context);

        // Build query
        $sql = "SELECT s.*, u.firstname, u.lastname, u.email,
                       g.grade, g.timemodified as gradetimemodified
                FROM {assign_submission} s
                JOIN {user} u ON u.id = s.userid
                LEFT JOIN {assign_grades} g ON g.assignment = s.assignment AND g.userid = s.userid
                WHERE s.assignment = :assignmentid AND s.latest = 1";
        $queryparams = array('assignmentid' => $params['assignmentid']);

        if (!empty($params['status'])) {
            $sql .= " AND s.status = :status";
            $queryparams['status'] = $params['status'];
        }

        $sql .= " ORDER BY s.timemodified DESC";

        $submissions = $DB->get_records_sql($sql, $queryparams);

        $result = array();
        foreach ($submissions as $sub) {
            $result[] = array(
                'submissionid' => $sub->id,
                'userid' => $sub->userid,
                'firstname' => $sub->firstname,
                'lastname' => $sub->lastname,
                'email' => $sub->email,
                'status' => $sub->status,
                'timemodified' => $sub->timemodified,
                'attemptnumber' => $sub->attemptnumber,
                'graded' => !is_null($sub->grade),
                'grade' => $sub->grade,
                'gradetimemodified' => $sub->gradetimemodified ? $sub->gradetimemodified : 0,
            );
        }

        return $result;
    }

    /**
     * Get all submissions returns
     */
    public static function get_all_submissions_returns() {
        return new external_multiple_structure(
            new external_single_structure(
                array(
                    'submissionid' => new external_value(PARAM_INT, 'Submission ID'),
                    'userid' => new external_value(PARAM_INT, 'User ID'),
                    'firstname' => new external_value(PARAM_TEXT, 'First name'),
                    'lastname' => new external_value(PARAM_TEXT, 'Last name'),
                    'email' => new external_value(PARAM_TEXT, 'Email'),
                    'status' => new external_value(PARAM_TEXT, 'Status'),
                    'timemodified' => new external_value(PARAM_INT, 'Time modified'),
                    'attemptnumber' => new external_value(PARAM_INT, 'Attempt number'),
                    'graded' => new external_value(PARAM_BOOL, 'Whether graded'),
                    'grade' => new external_value(PARAM_FLOAT, 'Grade', VALUE_OPTIONAL),
                    'gradetimemodified' => new external_value(PARAM_INT, 'Grade time modified'),
                )
            )
        );
    }
}
