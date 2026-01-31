<?php
/**
 * MindWorx SOR Automation - Web Services Definition
 *
 * @package    local_sor
 * @copyright  2026 MindWorx
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = array(
    // Submission functions
    'local_sor_get_submission_status' => array(
        'classname'   => 'local_sor\external\submission_api',
        'methodname'  => 'get_submission_status',
        'description' => 'Get SOR submission status for a user',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'mod/assign:view',
    ),
    'local_sor_submit_sor_file' => array(
        'classname'   => 'local_sor\external\submission_api',
        'methodname'  => 'submit_sor_file',
        'description' => 'Submit SOR PDF file for a learner',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'mod/assign:submit',
    ),
    'local_sor_get_all_submissions' => array(
        'classname'   => 'local_sor\external\submission_api',
        'methodname'  => 'get_all_submissions',
        'description' => 'Get all SOR submissions for an assignment',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'mod/assign:grade',
    ),

    // Grading functions
    'local_sor_grade_submission' => array(
        'classname'   => 'local_sor\external\grading_api',
        'methodname'  => 'grade_submission',
        'description' => 'Grade a SOR submission',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'mod/assign:grade',
    ),
    'local_sor_bulk_grade_submissions' => array(
        'classname'   => 'local_sor\external\grading_api',
        'methodname'  => 'bulk_grade_submissions',
        'description' => 'Grade multiple SOR submissions at once',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'mod/assign:grade',
    ),
    'local_sor_get_grading_status' => array(
        'classname'   => 'local_sor\external\grading_api',
        'methodname'  => 'get_grading_status',
        'description' => 'Get grading status for submissions',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'mod/assign:grade',
    ),
    'local_sor_release_grades' => array(
        'classname'   => 'local_sor\external\grading_api',
        'methodname'  => 'release_grades',
        'description' => 'Release grades to students',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'mod/assign:grade',
    ),
);

// Define the SOR Automation service
$services = array(
    'MindWorx SOR Automation' => array(
        'functions' => array(
            'local_sor_get_submission_status',
            'local_sor_submit_sor_file',
            'local_sor_get_all_submissions',
            'local_sor_grade_submission',
            'local_sor_bulk_grade_submissions',
            'local_sor_get_grading_status',
            'local_sor_release_grades',
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'mindworx_sor',
    ),
);
