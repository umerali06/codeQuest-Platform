<?php
/**
 * Auto Database Setup - Creates necessary users and data automatically
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
    
    $results = [];
    
    // 1. Create persistent user
    $persistentUserId = 'persistent-user-' . time();
    $persistentEmail = 'persistent@codequest.com';
    
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$persistentEmail]);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
        $persistentUserId = $existingUser['id'];
        $results[] = "Persistent user already exists: " . $persistentUserId;
    } else {
        $stmt = $pdo->prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$persistentUserId, $persistentEmail, 'Persistent User', password_hash('persistent123', PASSWORD_DEFAULT)]);
        $results[] = "Created persistent user: " . $persistentUserId;
    }
    
    // 2. Create user progress
    $stmt = $pdo->prepare("SELECT id FROM user_progress WHERE user_id = ?");
    $stmt->execute([$persistentUserId]);
    if (!$stmt->fetch()) {
        $progressId = 'progress-' . time();
        $stmt = $pdo->prepare("INSERT INTO user_progress (id, user_id, total_xp, level, level_title, streak, created_at) VALUES (?, ?, 0, 1, 'Beginner', 0, NOW())");
        $stmt->execute([$progressId, $persistentUserId]);
        $results[] = "Created user progress";
    }
    
    // 3. Create sample challenge
    $challengeId = 'auto-challenge-' . time();
    $stmt = $pdo->prepare("SELECT id FROM challenges WHERE title = ?");
    $stmt->execute(['Auto Test Challenge']);
    if (!$stmt->fetch()) {
        $testCases = json_encode([
            [
                'type' => 'element_exists',
                'selector' => 'h1',
                'description' => 'Page should have an h1 heading',
                'points' => 50
            ],
            [
                'type' => 'element_text_contains',
                'selector' => 'h1',
                'expected' => 'Hello',
                'description' => 'h1 should contain "Hello"',
                'points' => 50
            ]
        ]);
        
        $solutionCode = json_encode([
            'html' => '<h1>Hello World!</h1>',
            'css' => '',
            'js' => ''
        ]);
        
        $stmt = $pdo->prepare("
            INSERT INTO challenges (id, title, description, difficulty, category, xp_reward, instructions, test_cases, solution_code, is_active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
        ");
        $stmt->execute([
            $challengeId,
            'Auto Test Challenge',
            'Create HTML with h1 containing Hello',
            'beginner',
            'html',
            50,
            'Create an HTML page with an h1 heading that contains "Hello"',
            $testCases,
            $solutionCode
        ]);
        $results[] = "Created sample challenge: " . $challengeId;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Database setup complete',
        'results' => $results,
        'persistentUserId' => $persistentUserId,
        'challengeId' => $challengeId ?? 'existing'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>