<?php
/**
 * MindWorx SOR Automation - Language Strings
 *
 * @package    local_sor
 * @copyright  2026 MindWorx
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'MindWorx SOR Automation';
$string['privacy:metadata'] = 'The MindWorx SOR Automation plugin does not store any personal data.';

// Settings
$string['settings'] = 'SOR Automation Settings';
$string['settings_desc'] = 'Configure MindWorx SOR Automation settings';
$string['enableapi'] = 'Enable API';
$string['enableapi_desc'] = 'Enable the SOR Automation API for external systems';
$string['apitoken'] = 'API Token';
$string['apitoken_desc'] = 'Token for authenticating API requests';
$string['defaultfeedback'] = 'Default Feedback';
$string['defaultfeedback_desc'] = 'Default feedback message for graded submissions';

// Messages
$string['submissionsuccess'] = 'SOR submission successful';
$string['gradingsuccess'] = 'Grade saved successfully';
$string['bulkgradingsuccess'] = 'Bulk grading completed';
$string['releasesuccess'] = 'Grades released to students';
$string['error:noassignment'] = 'Assignment not found';
$string['error:nosubmission'] = 'Submission not found';
$string['error:nopermission'] = 'You do not have permission to perform this action';
$string['error:invalidgrade'] = 'Invalid grade value';

// Capabilities
$string['sor:viewsubmissions'] = 'View SOR submissions';
$string['sor:gradesubmissions'] = 'Grade SOR submissions';
$string['sor:managesettings'] = 'Manage SOR settings';
