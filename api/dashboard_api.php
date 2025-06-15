<?php
// api/dashboard_api.php

require_once '../config.php';
header('Content-Type: application/json');

$response = [
    'status' => 'error',
    'message' => 'Failed to fetch dashboard data.',
    'data' => null
];

try {
    // --- Get Total Subjects Count ---
    $stmt_subjects = $pdo->query("SELECT COUNT(*) as total FROM subjects");
    $total_subjects = $stmt_subjects->fetchColumn();

    // --- Get Total Lessons Count ---
    $stmt_lessons = $pdo->query("SELECT COUNT(*) as total FROM lessons");
    $total_lessons = $stmt_lessons->fetchColumn();
    
    // --- You can add more queries here for other stats in the future ---
    $active_exams = 0;
    $students_enrolled = 0;
    
    // --- Prepare the successful response ---
    $response['status'] = 'success';
    $response['message'] = 'Dashboard data fetched successfully.';
    $response['data'] = [
        'total_subjects' => (int)$total_subjects,
        'total_lessons' => (int)$total_lessons, // Added lesson count
        'active_exams' => $active_exams,
        'students_enrolled' => $students_enrolled
    ];

} catch (PDOException $e) {
    http_response_code(500);
    $response['message'] = 'Database error: ' . $e->getMessage();
}

echo json_encode($response);
?>