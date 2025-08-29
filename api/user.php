<?php
/**
 * User API endpoints
 */

// Include utility functions if not already loaded
if (!function_exists('sendResponse')) {
    function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit();
    }
}

if (!function_exists('getRequestBody')) {
    function getRequestBody() {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}

if (!function_exists('getAuthenticatedUser')) {
    function getAuthenticatedUser($pdo) {
        // Handle CLI mode (for testing)
        if (php_sapi_name() === 'cli') {
            return null;
        }
        
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }
        
        $token = substr($authHeader, 7);
        
        // For development, we'll use a simple token validation
        if (($_ENV['NODE_ENV'] ?? 'development') === 'development') {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$token]);
            return $stmt->fetch();
        }
        
        return null;
    }
}

// Check for progress endpoint
$endpoint = $pathParts[1] ?? '';

switch ($requestMethod) {
    case 'GET':
        if ($endpoint === 'progress') {
            handleGetUserProgress($pdo);
        } else {
            handleGetUser($pdo);
        }
        break;
        
    case 'POST':
        if ($endpoint === 'progress') {
            handleCreateUserProgress($pdo);
        } else {
            sendResponse(['error' => 'Endpoint not found'], 404);
        }
        break;
        
    case 'PUT':
        if ($endpoint === 'progress') {
            handleUpdateUserProgress($pdo);
        } else {
            handleUpdateUser($pdo);
        }
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleGetUser($pdo) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    // Get user progress
    $stmt = $pdo->prepare("
        SELECT up.*, us.* 
        FROM user_progress up
        LEFT JOIN user_statistics us ON up.user_id = us.user_id
        WHERE up.user_id = ?
    ");
    $stmt->execute([$user['id']]);
    $progress = $stmt->fetch();
    
    // Get achievements
    $stmt = $pdo->prepare("
        SELECT achievement_id, earned_at 
        FROM user_achievements 
        WHERE user_id = ?
    ");
    $stmt->execute([$user['id']]);
    $achievements = $stmt->fetchAll();
    
    // Get completed lessons
    $stmt = $pdo->prepare("
        SELECT l.slug, ulc.completed_at, ulc.xp_earned
        FROM user_lesson_completions ulc
        JOIN lessons l ON ulc.lesson_id = l.id
        WHERE ulc.user_id = ?
    ");
    $stmt->execute([$user['id']]);
    $completedLessons = $stmt->fetchAll();
    
    // Get completed challenges
    $stmt = $pdo->prepare("
        SELECT c.slug, uca.completed_at, uca.xp_earned
        FROM user_challenge_attempts uca
        JOIN challenges c ON uca.challenge_id = c.id
        WHERE uca.user_id = ? AND uca.is_completed = TRUE
    ");
    $stmt->execute([$user['id']]);
    $completedChallenges = $stmt->fetchAll();
    
    // Prepare response
    $userData = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'created_at' => $user['created_at'],
        'progress' => [
            'totalXP' => (int)($progress['total_xp'] ?? 0),
            'level' => (int)($progress['level'] ?? 1),
            'levelTitle' => $progress['level_title'] ?? 'Beginner',
            'streak' => (int)($progress['streak'] ?? 0),
            'lastLogin' => $progress['last_login'] ?? null,
            'completedLessons' => array_column($completedLessons, 'slug'),
            'completedChallenges' => array_column($completedChallenges, 'slug'),
            'achievements' => array_map(function($a) {
                return ['id' => $a['achievement_id'], 'earnedAt' => $a['earned_at']];
            }, $achievements),
            'statistics' => [
                'html' => [
                    'xp' => (int)($progress['html_xp'] ?? 0),
                    'lessons' => (int)($progress['html_lessons'] ?? 0),
                    'progress' => (float)($progress['html_progress'] ?? 0)
                ],
                'css' => [
                    'xp' => (int)($progress['css_xp'] ?? 0),
                    'lessons' => (int)($progress['css_lessons'] ?? 0),
                    'progress' => (float)($progress['css_progress'] ?? 0)
                ],
                'javascript' => [
                    'xp' => (int)($progress['javascript_xp'] ?? 0),
                    'lessons' => (int)($progress['javascript_lessons'] ?? 0),
                    'progress' => (float)($progress['javascript_progress'] ?? 0)
                ]
            ]
        ]
    ];
    
    sendResponse([
        'success' => true,
        'data' => $userData
    ]);
}

function handleUpdateUser($pdo) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    $data = getRequestBody();
    $allowedFields = ['name'];
    $updates = [];
    $values = [];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $values[] = $data[$field];
        }
    }
    
    if (empty($updates)) {
        sendResponse(['error' => 'No valid fields to update'], 400);
    }
    
    $values[] = $user['id'];
    
    $stmt = $pdo->prepare("
        UPDATE users 
        SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ");
    
    if ($stmt->execute($values)) {
        sendResponse([
            'success' => true,
            'message' => 'User updated successfully'
        ]);
    } else {
        sendResponse(['error' => 'Update failed'], 500);
    }
}
?>

function handleGetUserProgress($pdo) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    // Get user progress
    $stmt = $pdo->prepare("
        SELECT * FROM user_progress WHERE user_id = ?
    ");
    $stmt->execute([$user['id']]);
    $progress = $stmt->fetch();
    
    if (!$progress) {
        // Create default progress
        $defaultProgress = [
            'user_id' => $user['id'],
            'total_xp' => 0,
            'level' => 1,
            'level_title' => 'Beginner',
            'streak' => 0,
            'html_xp' => 0,
            'css_xp' => 0,
            'javascript_xp' => 0,
            'html_lessons' => 0,
            'css_lessons' => 0,
            'javascript_lessons' => 0,
            'html_progress' => 0.0,
            'css_progress' => 0.0,
            'javascript_progress' => 0.0
        ];
        
        $stmt = $pdo->prepare("
            INSERT INTO user_progress (
                user_id, total_xp, level, level_title, streak,
                html_xp, css_xp, javascript_xp,
                html_lessons, css_lessons, javascript_lessons,
                html_progress, css_progress, javascript_progress
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $user['id'], 0, 1, 'Beginner', 0,
            0, 0, 0, 0, 0, 0, 0.0, 0.0, 0.0
        ]);
        
        $progress = $defaultProgress;
    }
    
    sendResponse([
        'success' => true,
        'progress' => $progress
    ]);
}

function handleCreateUserProgress($pdo) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    $data = getRequestBody();
    
    // Check if progress already exists
    $stmt = $pdo->prepare("SELECT id FROM user_progress WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    
    if ($stmt->fetch()) {
        sendResponse(['error' => 'User progress already exists'], 409);
    }
    
    // Create new progress
    $stmt = $pdo->prepare("
        INSERT INTO user_progress (
            user_id, total_xp, level, level_title, streak,
            html_xp, css_xp, javascript_xp,
            html_lessons, css_lessons, javascript_lessons,
            html_progress, css_progress, javascript_progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([
        $user['id'],
        $data['total_xp'] ?? 0,
        $data['current_level'] ?? 1,
        'Beginner',
        0, 0, 0, 0, 0, 0, 0, 0.0, 0.0, 0.0
    ]);
    
    if ($result) {
        sendResponse([
            'success' => true,
            'message' => 'User progress created successfully'
        ]);
    } else {
        sendResponse(['error' => 'Failed to create progress'], 500);
    }
}

function handleUpdateUserProgress($pdo) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    $data = getRequestBody();
    
    $allowedFields = [
        'total_xp', 'level', 'level_title', 'streak',
        'html_xp', 'css_xp', 'javascript_xp',
        'html_lessons', 'css_lessons', 'javascript_lessons',
        'html_progress', 'css_progress', 'javascript_progress'
    ];
    
    $updates = [];
    $values = [];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $values[] = $data[$field];
        }
    }
    
    if (empty($updates)) {
        sendResponse(['error' => 'No valid fields to update'], 400);
    }
    
    $values[] = $user['id'];
    
    $stmt = $pdo->prepare("
        UPDATE user_progress 
        SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
    ");
    
    if ($stmt->execute($values)) {
        sendResponse([
            'success' => true,
            'message' => 'Progress updated successfully'
        ]);
    } else {
        sendResponse(['error' => 'Update failed'], 500);
    }
}