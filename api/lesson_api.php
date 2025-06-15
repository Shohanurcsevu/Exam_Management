<?php
// api/lesson_api.php

require_once '../config.php';
header('Content-Type: application/json');

$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];
$request_method = $_SERVER['REQUEST_METHOD'];

switch ($request_method) {
    case 'GET':
        // If a 'fetchSubjects' parameter is present, only return the list of subjects
        if (isset($_GET['fetchSubjects'])) {
            try {
                $stmt = $pdo->query("SELECT id, subject_name FROM subjects ORDER BY subject_name ASC");
                $subjects = $stmt->fetchAll();
                $response = ['status' => 'success', 'data' => $subjects];
            } catch (PDOException $e) {
                http_response_code(500);
                $response['message'] = 'Database error: ' . $e->getMessage();
            }
            break;
        }

        // --- Fetch lessons with filtering and pagination ---
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $subject_id_filter = isset($_GET['subject_id']) ? $_GET['subject_id'] : '';
        $offset = ($page - 1) * $limit;

        $where_clauses = [];
        $params = [];

        if (!empty($search)) {
            $where_clauses[] = "l.lesson_name LIKE :search";
            $params[':search'] = "%$search%";
        }

        if (!empty($subject_id_filter)) {
            $where_clauses[] = "l.subject_id = :subject_id_filter";
            $params[':subject_id_filter'] = $subject_id_filter;
        }

        $sql_where = count($where_clauses) > 0 ? " WHERE " . implode(' AND ', $where_clauses) : "";

        try {
            // Get the total count of filtered records
            $total_records_sql = "SELECT COUNT(*) FROM lessons l" . $sql_where;
            $total_stmt = $pdo->prepare($total_records_sql);
            $total_stmt->execute($params);
            $total_records = $total_stmt->fetchColumn();
            $total_pages = ceil($total_records / $limit);

            // Get the paged data, joining with subjects table to get subject_name
            $data_sql = "SELECT l.*, s.subject_name FROM lessons l JOIN subjects s ON l.subject_id = s.id" . $sql_where . " ORDER BY l.id ASC LIMIT :limit OFFSET :offset";
            $data_stmt = $pdo->prepare($data_sql);
            
            foreach ($params as $key => &$val) { $data_stmt->bindParam($key, $val); }
            $data_stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $data_stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            
            $data_stmt->execute();
            $lessons = $data_stmt->fetchAll();
            
            $response['status'] = 'success';
            $response['data'] = $lessons;
            $response['pagination'] = ['currentPage' => $page, 'totalPages' => $total_pages, 'totalRecords' => $total_records];

        } catch (PDOException $e) {
            http_response_code(500);
            $response['message'] = 'Database error: ' . $e->getMessage();
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['subjectId'], $data['lessonName'], $data['lessonNumber'], $data['startPage'], $data['endPage'], $data['totalPastQuestions'])) {
            $lesson_id = $data['lessonId'] ?? null;
            try {
                if ($lesson_id) { // UPDATE
                    $sql = "UPDATE lessons SET subject_id = :subject_id, lesson_name = :lesson_name, lesson_number = :lesson_number, start_page = :start_page, end_page = :end_page, total_past_questions = :total_past_questions WHERE id = :id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindParam(':id', $lesson_id);
                    $response['message'] = 'Lesson updated successfully!';
                } else { // CREATE
                    $sql = "INSERT INTO lessons (subject_id, lesson_name, lesson_number, start_page, end_page, total_past_questions) VALUES (:subject_id, :lesson_name, :lesson_number, :start_page, :end_page, :total_past_questions)";
                    $stmt = $pdo->prepare($sql);
                    $response['message'] = 'Lesson added successfully!';
                }
                $stmt->bindParam(':subject_id', $data['subjectId']);
                $stmt->bindParam(':lesson_name', $data['lessonName']);
                $stmt->bindParam(':lesson_number', $data['lessonNumber']);
                $stmt->bindParam(':start_page', $data['startPage']);
                $stmt->bindParam(':end_page', $data['endPage']);
                $stmt->bindParam(':total_past_questions', $data['totalPastQuestions']);
                $stmt->execute();
                $response['status'] = 'success';
            } catch (PDOException $e) {
                http_response_code(500);
                $response['message'] = 'Database error: ' . $e->getMessage();
            }
        } else {
            http_response_code(400);
            $response['message'] = 'Invalid data provided.';
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        $lesson_id = $data['id'] ?? null;
        if ($lesson_id) {
            try {
                $sql = "DELETE FROM lessons WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->bindParam(':id', $lesson_id);
                $stmt->execute();
                $response['status'] = 'success';
                $response['message'] = 'Lesson deleted successfully!';
            } catch (PDOException $e) {
                http_response_code(500);
                $response['message'] = 'Database error: ' . $e->getMessage();
            }
        } else {
            http_response_code(400);
            $response['message'] = 'Lesson ID not provided.';
        }
        break;

    default:
        http_response_code(405);
        $response['message'] = "Invalid request method: {$request_method}";
        break;
}

echo json_encode($response);
?>