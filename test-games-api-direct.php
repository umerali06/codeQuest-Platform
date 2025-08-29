<?php
/**
 * Direct test of games API without routing
 */

// Enable error reporting but don't display errors in output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Capture any output that shouldn't be there
ob_start();

// Set proper headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
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

    // Database configuration
    $dbConfig = [
        'host' => $_ENV['DB_HOST'] ?? 'localhost',
        'dbname' => $_ENV['DB_NAME'] ?? 'codequest',
        'username' => $_ENV['DB_USER'] ?? 'root',
        'password' => $_ENV['DB_PASS'] ?? ''
    ];

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

    // Simple games query
    $stmt = $pdo->prepare("
        SELECT 
            g.*,
            COALESCE(gs.total_plays, 0) as total_plays,
            COALESCE(gs.unique_players, 0) as unique_players,
            COALESCE(gs.average_score, 0) as average_score,
            COALESCE(gs.completion_rate, 0) as completion_rate
        FROM games g
        LEFT JOIN game_statistics gs ON g.id = gs.game_id
        WHERE g.is_active = TRUE
        ORDER BY g.featured DESC, g.play_count DESC, g.created_at DESC
        LIMIT 10
    ");
    
    $stmt->execute();
    $games = $stmt->fetchAll();

    // Format games data safely
    $formattedGames = [];
    foreach ($games as $game) {
        $formattedGames[] = [
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
                'total_plays' => (int)$game['total_plays'],
                'unique_players' => (int)$game['unique_players'],
                'average_score' => (float)$game['average_score'],
                'completion_rate' => (float)$game['completion_rate']
            ]
        ];
    }

    // Clear any unwanted output
    ob_clean();

    // Send clean JSON response
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

    echo json_encode($response);

} catch (Exception $e) {
    // Clear any unwanted output
    ob_clean();
    
    // Send error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'debug' => true
    ]);
}
?>