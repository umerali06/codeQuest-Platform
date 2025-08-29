<?php
/**
 * CodeQuest API Router
 * Main entry point for all API requests
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load dependencies (optional)
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

// Load environment variables manually (fallback if Dotenv not available)
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Database configuration
$dbConfig = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'codequest',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? ''
];

// Initialize database connection
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
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Parse request
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// Remove /api prefix if present
$apiPath = preg_replace('#^/api#', '', $requestPath);
$pathParts = array_values(array_filter(explode('/', $apiPath)));

// Route requests
try {
    switch ($pathParts[0] ?? '') {
        case 'auth':
            require_once __DIR__ . '/auth.php';
            break;
            
        case 'user':
        case 'me':
            require_once __DIR__ . '/user.php';
            break;
            
        case 'modules':
            require_once __DIR__ . '/modules.php';
            break;
            
        case 'lessons':
            require_once __DIR__ . '/lessons.php';
            break;
            
        case 'challenges':
            require_once __DIR__ . '/challenges.php';
            break;
            
        case 'attempts':
            require_once __DIR__ . '/attempts.php';
            break;
            
        case 'leaderboard':
            require_once __DIR__ . '/leaderboard.php';
            break;
            
        case 'games':
            require_once __DIR__ . '/games.php';
            break;
            
        case 'ai':
            require_once __DIR__ . '/ai.php';
            break;
            
        case 'config':
            require_once __DIR__ . '/config.php';
            break;
            
        case 'statistics':
        case 'stats':
            require_once __DIR__ . '/statistics.php';
            break;
            
        case 'learning-paths':
        case 'paths':
            require_once __DIR__ . '/learning-paths.php';
            break;
            
        case 'health':
            echo json_encode([
                'status' => 'ok',
                'timestamp' => date('c'),
                'version' => '1.0.0'
            ]);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $_ENV['NODE_ENV'] === 'development' ? $e->getMessage() : 'Something went wrong'
    ]);
}

/**
 * Utility function to get authenticated user
 */
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
    // In production, this should validate JWT tokens from Appwrite
    if (($_ENV['NODE_ENV'] ?? 'development') === 'development') {
        // Simple token validation for development
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$token]);
        return $stmt->fetch();
    }
    
    // TODO: Implement proper JWT validation with Appwrite
    return null;
}

/**
 * Utility function to send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Utility function to get request body
 */
function getRequestBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

/**
 * Utility function to validate required fields
 */
function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        sendResponse([
            'error' => 'Missing required fields',
            'fields' => $missing
        ], 400);
    }
}

/**
 * Generate UUID v4
 */
function generateUuid() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
?>