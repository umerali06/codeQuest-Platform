<?php
/**
 * User API endpoints
 */

switch ($requestMethod) {
    case 'GET':
        handleGetUser($pdo);
        break;
        
    case 'PUT':
        handleUpdateUser($pdo);
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