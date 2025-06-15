<?php
// api/subject_api.php

require_once '../config.php';
header('Content-Type: application/json');

$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];
$request_method = $_SERVER['REQUEST_METHOD'];

switch ($request_method) {
    case 'GET':
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $category = isset($_GET['category']) ? $_GET['category'] : '';
        $offset = ($page - 1) * $limit;
        $where_clauses = [];
        $params = [];
        if (!empty($search)) {
            $where_clauses[] = "(s.subject_name LIKE :search OR s.book_name LIKE :search)";
            $params[':search'] = "%$search%";
        }
        if (!empty($category)) {
            $where_clauses[] = "s.category = :category";
            $params[':category'] = $category;
        }
        $sql_where = count($where_clauses) > 0 ? " WHERE " . implode(' AND ', $where_clauses) : "";
        try {
            $total_records_sql = "SELECT COUNT(*) FROM subjects s" . $sql_where;
            $total_stmt = $pdo->prepare($total_records_sql);
            $total_stmt->execute($params);
            $total_records = $total_stmt->fetchColumn();
            $total_pages = ceil($total_records / $limit);
            $data_sql = "SELECT s.*, COUNT(l.id) as lessons_created FROM subjects s LEFT JOIN lessons l ON s.id = l.subject_id" . $sql_where . " GROUP BY s.id ORDER BY s.id ASC LIMIT :limit OFFSET :offset";
            $data_stmt = $pdo->prepare($data_sql);
            foreach ($params as $key => &$val) {
                $data_stmt->bindParam($key, $val);
            }
            $data_stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $data_stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $data_stmt->execute();
            $subjects = $data_stmt->fetchAll();
            $response['status'] = 'success';
            $response['data'] = $subjects;
            $response['pagination'] = ['currentPage' => $page, 'totalPages' => $total_pages, 'totalRecords' => $total_records];
        } catch (PDOException $e) {
            http_response_code(500);
            $response['message'] = 'Database error: ' . $e->getMessage();
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['subjectName'], $data['bookName'], $data['totalPages'], $data['totalLessons'], $data['previousBcsQuestion'], $data['category'])) {
            $subject_id = $data['subjectId'] ?? null;
            try {
                if ($subject_id) {
                    $sql = "UPDATE subjects SET subject_name = :subject_name, book_name = :book_name, total_pages = :total_pages, total_lessons = :total_lessons, previous_bcs_question = :previous_bcs_question, category = :category WHERE id = :id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindParam(':id', $subject_id);
                    $response['message'] = 'Subject updated successfully!';
                } else {
                    $sql = "INSERT INTO subjects (subject_name, book_name, total_pages, total_lessons, previous_bcs_question, category) VALUES (:subject_name, :book_name, :total_pages, :total_lessons, :previous_bcs_question, :category)";
                    $stmt = $pdo->prepare($sql);
                    $response['message'] = 'Subject added successfully!';
                }
                $stmt->bindParam(':subject_name', $data['subjectName']);
                $stmt->bindParam(':book_name', $data['bookName']);
                $stmt->bindParam(':total_pages', $data['totalPages']);
                $stmt->bindParam(':total_lessons', $data['totalLessons']);
                $stmt->bindParam(':previous_bcs_question', $data['previousBcsQuestion']);
                $stmt->bindParam(':category', $data['category']);
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
        $subject_id = $data['id'] ?? null;
        if ($subject_id) {
            try {
                $sql = "DELETE FROM subjects WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->bindParam(':id', $subject_id);
                $stmt->execute();
                $response['status'] = 'success';
                $response['message'] = 'Subject deleted successfully!';
            } catch (PDOException $e) {
                http_response_code(500);
                $response['message'] = 'Database error: ' . $e->getMessage();
            }
        } else {
            http_response_code(400);
            $response['message'] = 'Subject ID not provided.';
        }
        break;

    default:
        http_response_code(405);
        $response['message'] = "Invalid request method: {$request_method}";
        break;
}

echo json_encode($response);
?>