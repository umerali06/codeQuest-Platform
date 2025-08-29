<?php
/**
 * Attempts API endpoints
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

$attemptId = $pathParts[1] ?? '';

switch ($requestMethod) {
    case 'GET':
        if ($attemptId) {
            handleGetAttempt($pdo, $attemptId);
        } else {
            handleGetAttempts($pdo);
        }
        break;
        
    case 'POST':
        handleCreateAttempt($pdo);
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleGetAttempts($pdo) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    try {
        $challengeId = $_GET['challenge_id'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 20), 50);
        $offset = max((int)($_GET['offset'] ?? 0), 0);
        
        $sql = "
            SELECT 
                uca.*,
                c.title as challenge_title,
                c.slug as challenge_slug
            FROM user_challenge_attempts uca
            JOIN challenges c ON uca.challenge_id = c.id
            WHERE uca.user_id = ?
        ";
        
        $params = [$user['id']];
        
        if ($challengeId) {
            $sql .= " AND uca.challenge_id = ?";
            $params[] = $challengeId;
        }
        
        $sql .= " ORDER BY uca.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $attempts = $stmt->fetchAll();
        
        $formattedAttempts = array_map(function($attempt) {
            return [
                'id' => $attempt['id'],
                'challenge_id' => $attempt['challenge_id'],
                'challenge_title' => $attempt['challenge_title'],
                'challenge_slug' => $attempt['challenge_slug'],
                'code' => json_decode($attempt['code'] ?? '{}', true),
                'is_completed' => (bool)$attempt['is_completed'],
                'tests_passed' => (int)$attempt['tests_passed'],
                'total_tests' => (int)$attempt['total_tests'],
                'xp_earned' => (int)$attempt['xp_earned'],
                'created_at' => $attempt['created_at'],
                'completed_at' => $attempt['completed_at']
            ];
        }, $attempts);
        
        sendResponse([
            'success' => true,
            'attempts' => $formattedAttempts,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'total' => count($formattedAttempts)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching attempts: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch attempts'], 500);
    }
}

function handleGetAttempt($pdo, $attemptId) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT 
                uca.*,
                c.title as challenge_title,
                c.slug as challenge_slug
            FROM user_challenge_attempts uca
            JOIN challenges c ON uca.challenge_id = c.id
            WHERE uca.id = ? AND uca.user_id = ?
        ");
        $stmt->execute([$attemptId, $user['id']]);
        $attempt = $stmt->fetch();
        
        if (!$attempt) {
            sendResponse(['error' => 'Attempt not found'], 404);
        }
        
        sendResponse([
            'success' => true,
            'attempt' => [
                'id' => $attempt['id'],
                'challenge_id' => $attempt['challenge_id'],
                'challenge_title' => $attempt['challenge_title'],
                'challenge_slug' => $attempt['challenge_slug'],
                'code' => json_decode($attempt['code'] ?? '{}', true),
                'is_completed' => (bool)$attempt['is_completed'],
                'tests_passed' => (int)$attempt['tests_passed'],
                'total_tests' => (int)$attempt['total_tests'],
                'xp_earned' => (int)$attempt['xp_earned'],
                'created_at' => $attempt['created_at'],
                'completed_at' => $attempt['completed_at']
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching attempt: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch attempt'], 500);
    }
}

function handleCreateAttempt($pdo) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    $data = getRequestBody();
    
    if (!isset($data['challenge_id']) || !isset($data['code'])) {
        sendResponse(['error' => 'Missing required fields'], 400);
    }
    
    try {
        // This would typically be handled by the challenges endpoint
        // This is just a placeholder for attempt tracking
        sendResponse([
            'success' => true,
            'message' => 'Attempt tracking - use challenges/submit endpoint instead'
        ]);
        
    } catch (Exception $e) {
        error_log("Error creating attempt: " . $e->getMessage());
        sendResponse(['error' => 'Failed to create attempt'], 500);
    }
}
?>