<?php
// api/topics_api.php

require_once '../config.php';
header('Content-Type: application/json');

$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];
$request_method = $_SERVER['REQUEST_METHOD'];

switch ($request_method) {
    case 'GET':
        // --- Part 1: Fetch subjects for dropdowns ---
        if (isset($_GET['fetchSubjects'])) {
            try {
                $stmt = $pdo->query("SELECT id, subject_name FROM subjects ORDER BY subject_name ASC");
                $response = ['status' => 'success', 'data' => $stmt->fetchAll()];
            } catch (PDOException $e) { /* ... error handling ... */ }
            break;
        }

        // --- Part 2: Fetch lessons for a specific subject (for dependent dropdowns) ---
        if (isset($_GET['getLessonsForSubject'])) {
            try {
                $stmt = $pdo->prepare("SELECT id, lesson_name FROM lessons WHERE subject_id = ? ORDER BY lesson_number ASC");
                $stmt->execute([$_GET['getLessonsForSubject']]);
                $response = ['status' => 'success', 'data' => $stmt->fetchAll()];
            } catch (PDOException $e) { /* ... error handling ... */ }
            break;
        }

        // --- Part 3: Fetch topics with filtering and pagination ---
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $subject_id_filter = isset($_GET['subject_id']) ? $_GET['subject_id'] : '';
        $lesson_id_filter = isset($_GET['lesson_id']) ? $_GET['lesson_id'] : '';
        $offset = ($page - 1) * $limit;

        $where_clauses = [];
        $params = [];

        if (!empty($search)) { $where_clauses[] = "t.topic_name LIKE :search"; $params[':search'] = "%$search%"; }
        if (!empty($subject_id_filter)) { $where_clauses[] = "t.subject_id = :subject_id"; $params[':subject_id'] = $subject_id_filter; }
        if (!empty($lesson_id_filter)) { $where_clauses[] = "t.lesson_id = :lesson_id"; $params[':lesson_id'] = $lesson_id_filter; }

        $sql_where = count($where_clauses) > 0 ? " WHERE " . implode(' AND ', $where_clauses) : "";

        try {
            $total_records_sql = "SELECT COUNT(*) FROM topics t" . $sql_where;
            $total_stmt = $pdo->prepare($total_records_sql);
            $total_stmt->execute($params);
            $total_records = $total_stmt->fetchColumn();
            $total_pages = ceil($total_records / $limit);

            $data_sql = "SELECT t.*, s.subject_name, l.lesson_name 
                         FROM topics t 
                         JOIN subjects s ON t.subject_id = s.id
                         JOIN lessons l ON t.lesson_id = l.id" 
                         . $sql_where . " ORDER BY t.id ASC LIMIT :limit OFFSET :offset";
            
            $data_stmt = $pdo->prepare($data_sql);
            foreach ($params as $key => &$val) { $data_stmt->bindParam($key, $val); }
            $data_stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $data_stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $data_stmt->execute();
            
            $response = [
                'status' => 'success',
                'data' => $data_stmt->fetchAll(),
                'pagination' => ['currentPage' => $page, 'totalPages' => $total_pages, 'totalRecords' => $total_records]
            ];
        } catch (PDOException $e) { /* ... error handling ... */ }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['subjectId'], $data['lessonId'], $data['topicName'], $data['startPage'], $data['endPage'], $data['totalExams'], $data['pastQuestions'])) {
            $topic_id = $data['topicId'] ?? null;
            try {
                if ($topic_id) { // UPDATE
                    $sql = "UPDATE topics SET subject_id = :subject_id, lesson_id = :lesson_id, topic_name = :topic_name, start_page = :start_page, end_page = :end_page, total_exams = :total_exams, past_questions = :past_questions WHERE id = :id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindParam(':id', $topic_id);
                } else { // CREATE
                    $sql = "INSERT INTO topics (subject_id, lesson_id, topic_name, start_page, end_page, total_exams, past_questions) VALUES (:subject_id, :lesson_id, :topic_name, :start_page, :end_page, :total_exams, :past_questions)";
                    $stmt = $pdo->prepare($sql);
                }
                $stmt->bindParam(':subject_id', $data['subjectId']);
                $stmt->bindParam(':lesson_id', $data['lessonId']);
                $stmt->bindParam(':topic_name', $data['topicName']);
                $stmt->bindParam(':start_page', $data['startPage']);
                $stmt->bindParam(':end_page', $data['endPage']);
                $stmt->bindParam(':total_exams', $data['totalExams']);
                $stmt->bindParam(':past_questions', $data['pastQuestions']);
                $stmt->execute();
                $response = ['status' => 'success', 'message' => 'Topic saved successfully!'];
            } catch (PDOException $e) { /* ... error handling ... */ }
        } else { /* ... error handling ... */ }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['id'])) {
            try {
                $stmt = $pdo->prepare("DELETE FROM topics WHERE id = ?");
                $stmt->execute([$data['id']]);
                $response = ['status' => 'success', 'message' => 'Topic deleted successfully!'];
            } catch (PDOException $e) { /* ... error handling ... */ }
        } else { /* ... error handling ... */ }
        break;

    default:
        $response['message'] = "Invalid request method.";
        break;
}

echo json_encode($response);
?>