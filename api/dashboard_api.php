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
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM subjects");
    $total_subjects = $stmt->fetchColumn(); // Fetches the first column of the first row

    // --- You can add more queries here for other stats in the future ---
    // For now, we'll use placeholder values for other cards
    $total_exams = 0;
    $active_exams = 0;
    $students_enrolled = 0;
    
    // --- Prepare the successful response ---
    $response['status'] = 'success';
    $response['message'] = 'Dashboard data fetched successfully.';
    $response['data'] = [
        'total_subjects' => (int)$total_subjects, // Cast to integer
        'total_exams' => $total_exams,
        'active_exams' => $active_exams,
        'students_enrolled' => $students_enrolled
    ];

} catch (PDOException $e) {
    http_response_code(500);
    $response['message'] = 'Database error: ' . $e->getMessage();
}

echo json_encode($response);
?>