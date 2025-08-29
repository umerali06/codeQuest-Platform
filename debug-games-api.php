<?php
/**
 * Debug Games API Response
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

echo "Starting API debug...\n";

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with($line, '#')) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

echo "Environment loaded...\n";

// Database configuration
$dbConfig = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'dbname' => $_ENV['DB_NAME'] ?? 'codequest',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASS'] ?? ''
];

echo "DB Config: " . json_encode($dbConfig) . "\n";

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
    
    echo "Database connected successfully...\n";
    
    // Test simple query
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM games WHERE is_active = TRUE");
    $stmt->execute();
    $result = $stmt->fetch();
    
    echo "Games count: " . $result['count'] . "\n";
    
    // Test games query
    $stmt = $pdo->prepare("
        SELECT 
            g.*,
            gs.total_plays,
            gs.unique_players,
            gs.average_score,
            gs.completion_rate
        FROM games g
        LEFT JOIN game_statistics gs ON g.id = gs.game_id
        WHERE g.is_active = TRUE
        ORDER BY g.featured DESC, g.play_count DESC, g.created_at DESC
        LIMIT 10
    ");
    $stmt->execute();
    $games = $stmt->fetchAll();
    
    echo "Raw games data:\n";
    var_dump($games);
    
    // Format games data
    $formattedGames = array_map(function($game) {
        return [
            'id' => $game['id'],
            'slug' => $game['slug'],
            'title' => $game['title'],
            'description' => $game['description'],
            'instructions' => $game['instructions'],
            'category' => $game['category'],
            'difficulty' => $game['difficulty'],
            'icon' => $game['icon'],
            'game_type' => $game['game_type'],
            'max_score' => (int)$game['max_score'],
            'time_limit' => (int)$game['time_limit'],
            'xp_reward' => (int)$game['xp_reward'],
            'min_level' => (int)$game['min_level'],
            'tags' => json_decode($game['tags'] ?? '[]', true),
            'game_config' => json_decode($game['game_config'] ?? '{}', true),
            'featured' => (bool)$game['featured'],
            'play_count' => (int)$game['play_count'],
            'average_rating' => (float)$game['average_rating'],
            'statistics' => [
                'total_plays' => (int)($game['total_plays'] ?? 0),
                'unique_players' => (int)($game['unique_players'] ?? 0),
                'average_score' => (float)($game['average_score'] ?? 0),
                'completion_rate' => (float)($game['completion_rate'] ?? 0)
            ]
        ];
    }, $games);
    
    $response = [
        'success' => true,
        'data' => $formattedGames,
        'pagination' => [
            'limit' => 10,
            'offset' => 0,
            'total' => count($formattedGames)
        ],
        'user_authenticated' => false
    ];
    
    echo "Final response:\n";
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
    
    $errorResponse = [
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => true
    ];
    
    echo json_encode($errorResponse);
}
?>