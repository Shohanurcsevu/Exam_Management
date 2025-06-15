<?php
// config.php

// --- Database Credentials ---
$db_host = 'localhost';
$db_user = 'root'; // Default XAMPP username
$db_pass = '';     // Default XAMPP password
$db_name = 'exam_management';

// --- Create Database Connection ---
try {
    // Create a new PDO instance with UTF-8 encoding
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);

    // Set PDO to throw exceptions on error for better error handling
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Set the default fetch mode to associative array
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // If connection fails, stop the script and show a clear error message
    // In a production environment, you would log this error instead of showing it to the user.
    die("Database connection failed: " . $e->getMessage());
}
?>