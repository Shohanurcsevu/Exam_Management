<?php
// api/subject_api.php

require_once '../config.php'; // Go one directory up to find config.php
header('Content-Type: application/json');

$response = ['status' => 'error', 'message' => 'An unknown error occurred.'];
$request_method = $_SERVER['REQUEST_METHOD'];

switch ($request_method) {
    case 'GET':
        // --- Fetch all subjects ---
        try {
            $stmt = $pdo->query("SELECT * FROM subjects ORDER BY id ASC");
            $subjects = $stmt->fetchAll();
            $response['status'] = 'success';
            $response['message'] = 'Subjects fetched successfully.';
            $response['data'] = $subjects;
        } catch (PDOException $e) {
            http_response_code(500);
            $response['message'] = 'Database error: ' . $e->getMessage();
        }
        break;

    case 'POST':
        // --- Create or Update a subject ---
        $data = json_decode(file_get_contents('php://input'), true);

        if (isset($data['subjectName'], $data['bookName'], $data['totalPages'], $data['category'])) {
            $subject_id = $data['subjectId'] ?? null;

            try {
                if ($subject_id) {
                    // --- UPDATE ---
                    $sql = "UPDATE subjects SET subject_name = :subject_name, book_name = :book_name, total_pages = :total_pages, category = :category WHERE id = :id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->bindParam(':id', $subject_id);
                    $response['message'] = 'Subject updated successfully!';
                } else {
                    // --- CREATE ---
                    $sql = "INSERT INTO subjects (subject_name, book_name, total_pages, category) VALUES (:subject_name, :book_name, :total_pages, :category)";
                    $stmt = $pdo->prepare($sql);
                    $response['message'] = 'Subject added successfully!';
                }

                $stmt->bindParam(':subject_name', $data['subjectName']);
                $stmt->bindParam(':book_name', $data['bookName']);
                $stmt->bindParam(':total_pages', $data['totalPages']);
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
        // --- Delete a subject ---
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