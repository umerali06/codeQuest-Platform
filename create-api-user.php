<?php
/**
 * Create API User - Simple HTTP endpoint to create a test user
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = 'localhost';
$dbname = 'codequest';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // Create test user
    $testUserId = 'api-user-' . time();
    $testUserEmail = 'apiuser@codequest.com';
    $testUserName = 'API Test User';
    $passwordHash = password_hash('apipassword123', PASSWORD_DEFAULT);
    
    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$testUserEmail]);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
        // Return existing user
        echo json_encode([
            'success' => true,
            'message' => 'User already exists',
            'user' => [
                'id' => $existingUser['id'],
                'email' => $testUserEmail,
                'name' => $testUserName
            ]
        ]);
    } else {
        // Create new user
        $stmt = $pdo->prepare("
            INSERT INTO users (id, email, name, password_hash, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$testUserId, $testUserEmail, $testUserName, $passwordHash]);
        
        // Create user progress
        $progressId = 'progress-' . time();
        $stmt = $pdo->prepare("
            INSERT INTO user_progress (id, user_id, total_xp, level, level_title, streak, created_at) 
            VALUES (?, ?, 0, 1, 'Beginner', 0, NOW())
        ");
        $stmt->execute([$progressId, $testUserId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'User created successfully',
            'user' => [
                'id' => $testUserId,
                'email' => $testUserEmail,
                'name' => $testUserName
            ]
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>