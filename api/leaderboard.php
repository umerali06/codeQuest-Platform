<?php
/**
 * Leaderboard API endpoints
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database configuration - Use MySQL (consistent with main API)
$dbConfig = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'codequest_db',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? ''
];

// Database connection - Use MySQL
try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    error_log("Database connection error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed. Please ensure MySQL is running and database exists.']);
    exit;
}

// Get request method
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Include utility functions if not already loaded
if (!function_exists('sendResponse')) {
    function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit();
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

switch ($requestMethod) {
    case 'GET':
        handleGetLeaderboard($pdo);
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleGetLeaderboard($pdo) {
    $filter = $_GET['filter'] ?? 'global';
    $limit = min((int)($_GET['limit'] ?? 50), 100); // Max 100 entries
    $offset = max((int)($_GET['offset'] ?? 0), 0);
    
    $sql = "
        SELECT 
            u.id,
            u.name,
            u.email,
            COALESCE(up.total_xp, 0) as total_xp,
            COALESCE(up.level, 1) as level,
            COALESCE(up.level_title, 'Beginner') as level_title,
            COALESCE(up.streak, 0) as streak,
            0 as challenges_completed,
            0 as projects_created,
            0 as total_achievements
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
    ";
    
    $params = [];
    
    // Add filters based on type
    switch ($filter) {
        case 'weekly':
            $sql .= " WHERE up.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            break;
            
        case 'monthly':
            $sql .= " WHERE up.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            break;
    }
    
    $sql .= "
        ORDER BY COALESCE(up.total_xp, 0) DESC
        LIMIT ? OFFSET ?
    ";
    
    $params[] = $limit;
    $params[] = $offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $leaderboard = $stmt->fetchAll();
    
    // Format the response
    $formattedLeaderboard = array_map(function($entry, $index) use ($offset) {
        return [
            'rank' => $offset + $index + 1,
            'userId' => $entry['id'],
            'username' => $entry['name'],
            'email' => $entry['email'],
            'totalXP' => (int)$entry['total_xp'],
            'level' => (int)$entry['level'],
            'levelTitle' => $entry['level_title'],
            'streak' => (int)$entry['streak'],
            'challengesCompleted' => (int)$entry['challenges_completed'],
            'projectsCreated' => (int)$entry['projects_created'],
            'totalAchievements' => (int)$entry['total_achievements']
        ];
    }, $leaderboard, array_keys($leaderboard));
    
    // Get user's position if authenticated
    $userPosition = null;
    $user = getAuthenticatedUser($pdo);
    
    if ($user) {
        $stmt = $pdo->prepare("
            SELECT rank_position 
            FROM user_leaderboard 
            WHERE id = ?
        ");
        $stmt->execute([$user['id']]);
        $userRank = $stmt->fetchColumn();
        
        if ($userRank) {
            $userPosition = (int)$userRank;
        }
    }
    
    // Get total count for pagination
    $countSql = "
        SELECT COUNT(u.id) as total
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id
    ";
    
    // Apply same filters for count
    switch ($filter) {
        case 'weekly':
            $countSql .= " WHERE up.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            break;
        case 'monthly':
            $countSql .= " WHERE up.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            break;
    }
    
    $stmt = $pdo->prepare($countSql);
    $stmt->execute();
    $totalCount = (int)$stmt->fetchColumn();
    
    sendResponse([
        'success' => true,
        'data' => [
            'leaderboard' => $formattedLeaderboard,
            'userPosition' => $userPosition,
            'pagination' => [
                'total' => $totalCount,
                'limit' => $limit,
                'offset' => $offset,
                'hasMore' => ($offset + $limit) < $totalCount
            ],
            'filter' => $filter
        ]
    ]);
}
?>