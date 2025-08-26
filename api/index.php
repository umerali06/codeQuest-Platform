<?php
/**
 * CodeQuest API Router
 * Main entry point for all API requests
 */

// Load environment variables
require_once __DIR__ . '/../vendor/autoload.php';

use CodeQuest\Core\Database;
use CodeQuest\Core\Router;
use CodeQuest\Core\Auth;
use CodeQuest\Core\Logger;
use CodeQuest\Controllers\{
    AuthController,
    UserController,
    ModuleController,
    LessonController,
    ChallengeController,
    AttemptController,
    GameController,
    AIController,
    StatisticsController
};

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Health check endpoint (no database required)
    if ($_SERVER['REQUEST_URI'] === '/api/health') {
        echo json_encode([
            'status' => 'ok',
            'message' => 'CodeQuest API is running',
            'timestamp' => date('Y-m-d H:i:s'),
            'php_version' => PHP_VERSION
        ]);
        exit();
    }

    // Simple statistics endpoint (no database required)
    if ($_SERVER['REQUEST_URI'] === '/api/statistics') {
        $stats = [
            'active_learners' => 1247,
            'total_lessons' => 165,
            'total_challenges' => 89,
            'total_games' => 12,
            'total_xp_earned' => 45678,
            'success_rate' => 87.3,
            'recent_active_users' => 234,
            'recent_activities' => 1234,
            'html_lessons' => 45,
            'css_lessons' => 52,
            'js_lessons' => 68,
            'html_hours' => 12,
            'css_hours' => 13,
            'js_hours' => 17
        ];

        echo json_encode([
            'success' => true,
            'data' => $stats
        ]);
        exit();
    }

    // Simple modules endpoint (no database required)
    if ($_SERVER['REQUEST_URI'] === '/api/modules') {
        $modules = [
            [
                'id' => 'html-module',
                'title' => 'HTML Mastery',
                'description' => 'Build the foundation with semantic HTML5, forms, media elements, and accessibility.',
                'slug' => 'html',
                'icon' => '🌐',
                'lesson_count' => 45,
                'estimated_hours' => 8,
                'difficulty' => 'beginner',
                'is_active' => true
            ],
            [
                'id' => 'css-module',
                'title' => 'CSS Styling',
                'description' => 'Master modern CSS with Flexbox, Grid, animations, and responsive design.',
                'slug' => 'css',
                'icon' => '🎨',
                'lesson_count' => 52,
                'estimated_hours' => 10,
                'difficulty' => 'beginner',
                'is_active' => true
            ],
            [
                'id' => 'js-module',
                'title' => 'JavaScript Pro',
                'description' => 'From basics to advanced concepts including ES6+, async programming, and DOM.',
                'slug' => 'javascript',
                'icon' => '⚡',
                'lesson_count' => 68,
                'estimated_hours' => 15,
                'difficulty' => 'intermediate',
                'is_active' => true
            ]
        ];

        echo json_encode([
            'success' => true,
            'data' => $modules
        ]);
        exit();
    }

    // Simple games endpoint (no database required)
    if ($_SERVER['REQUEST_URI'] === '/api/games') {
        $games = [
            [
                'id' => 'game-1',
                'title' => 'CSS Grid Challenge',
                'description' => 'Master CSS Grid by solving layout puzzles',
                'category' => 'CSS',
                'difficulty' => 'intermediate',
                'instructions' => 'Create the target layout using CSS Grid properties',
                'is_active' => true
            ],
            [
                'id' => 'game-2',
                'title' => 'JavaScript Array Master',
                'description' => 'Practice array methods and manipulation',
                'category' => 'JavaScript',
                'difficulty' => 'beginner',
                'instructions' => 'Complete the array challenges using built-in methods',
                'is_active' => true
            ],
            [
                'id' => 'game-3',
                'title' => 'HTML Semantic Hero',
                'description' => 'Learn semantic HTML structure',
                'category' => 'HTML',
                'difficulty' => 'beginner',
                'instructions' => 'Use proper semantic HTML tags to structure content',
                'is_active' => true
            ]
        ];

        echo json_encode([
            'success' => true,
            'data' => $games
        ]);
        exit();
    }

    // Simple games leaderboard endpoint (no database required)
    if ($_SERVER['REQUEST_URI'] === '/api/games/leaderboard') {
        $leaderboard = [
            [
                'rank' => 1,
                'username' => 'CodeMaster2024',
                'score' => 9850,
                'level' => 15,
                'avatar_url' => 'https://via.placeholder.com/40'
            ],
            [
                'rank' => 2,
                'username' => 'WebDevPro',
                'score' => 8740,
                'level' => 12,
                'avatar_url' => 'https://via.placeholder.com/40'
            ],
            [
                'rank' => 3,
                'username' => 'CSSNinja',
                'score' => 7620,
                'level' => 10,
                'avatar_url' => 'https://via.placeholder.com/40'
            ]
        ];

        echo json_encode([
            'success' => true,
            'data' => $leaderboard
        ]);
        exit();
    }

    // Initialize core components for other endpoints
    $logger = new Logger();
    $database = new Database();
    $auth = new Auth();
    $router = new Router();

    // Register routes
    $router->get('/api/me', [UserController::class, 'getCurrentUser']);
    $router->get('/api/lessons/:slug', [LessonController::class, 'getLesson']);
    
    // Challenge routes
    $router->get('/api/challenges', [ChallengeController::class, 'getChallenges']);
    $router->get('/api/challenges/:id', [ChallengeController::class, 'getChallenge']);
    $router->get('/api/challenges/random', [ChallengeController::class, 'getRandomChallenge']);
    
    $router->post('/api/attempts', [AttemptController::class, 'submitAttempt']);
    
    // Game routes
    $router->get('/api/games/stats', [GameController::class, 'getUserGameStats']);
    $router->get('/api/games/recent', [GameController::class, 'getRecentGames']);
    $router->post('/api/games/result', [GameController::class, 'saveResult']);
    
    $router->post('/api/ai/generate', [AIController::class, 'generate']);
    
    // Handle the request
    $router->handle($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);

} catch (Exception $e) {
    $logger->error('API Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => 'An unexpected error occurred'
    ]);
}
