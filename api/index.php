<?php

// Prevent any HTML output in case of errors
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once __DIR__ . '/../vendor/autoload.php';

use CodeQuest\Core\Logger;
use CodeQuest\Core\Auth;
use CodeQuest\Controllers\AuthController;
use CodeQuest\Controllers\AppwriteChallengeController;
use CodeQuest\Controllers\AppwriteGamesController;

// Set headers for CORS and JSON responses
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Initialize core services
$logger = new Logger();
$auth = new Auth();

// Get request path and method
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove base path if exists
$basePath = '/api';
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}

// Parse the path
$path = parse_url($requestUri, PHP_URL_PATH);
$path = trim($path, '/');
$segments = explode('/', $path);

// Get query parameters
$queryParams = $_GET;
$bodyData = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    // Route the request
    $response = routeRequest($segments, $requestMethod, $queryParams, $bodyData);
    
    // Send response
    if (is_array($response)) {
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    } else {
        echo $response;
    }
    
} catch (Exception $e) {
    $logger->error('API Error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal Server Error',
        'message' => $e->getMessage()
    ]);
}

function routeRequest($segments, $method, $queryParams, $bodyData) {
    global $auth, $logger;
    
    $endpoint = $segments[0] ?? '';
    $resource = $segments[1] ?? '';
    $identifier = $segments[2] ?? '';
    
    switch ($endpoint) {
        case 'health':
            return ['status' => 'ok', 'timestamp' => date('c')];
            
        case 'auth':
            if ($method === 'POST') {
                if ($resource === 'register') {
                    return handleAuthEndpoint('register', $bodyData);
                } elseif ($resource === 'login') {
                    return handleAuthEndpoint('login', $bodyData);
                } elseif ($resource === 'logout') {
                    return handleAuthEndpoint('logout', $bodyData);
                }
            }
            throw new Exception('Method not allowed');
            
        case 'me':
            if ($method !== 'GET') {
                throw new Exception('Method not allowed');
            }
            return handleMeEndpoint($auth);
            
        case 'modules':
            if ($method !== 'GET') {
                throw new Exception('Method not allowed');
            }
            return handleModulesEndpoint($database);
            
        case 'lessons':
            if ($method !== 'GET') {
                throw new Exception('Method not allowed');
            }
            return handleLessonsEndpoint($database, $resource);
            
        case 'challenges':
            if ($method === 'GET') {
                if (empty($resource)) {
                    return handleAppwriteChallengesEndpoint();
                } elseif ($resource === 'random') {
                    return handleAppwriteRandomChallengeEndpoint();
                } else {
                    return handleAppwriteChallengesEndpoint($resource);
                }
            }
            throw new Exception('Method not allowed');
            
        case 'games':
            if ($method === 'GET') {
                if (empty($resource)) {
                    return handleGamesEndpoint();
                } elseif ($resource === 'leaderboard') {
                    $period = $_GET['period'] ?? 'weekly';
                    return handleLeaderboardEndpoint($period);
                } elseif ($resource === 'stats') {
                    return handleUserStatsEndpoint();
                }
            } elseif ($method === 'POST' && $resource === 'result') {
                return handleSaveGameResultEndpoint();
            }
            throw new Exception('Method not allowed');
            
        case 'attempts':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed');
            }
            return handleAttemptsEndpoint($database, $bodyData);
            
        case 'ai':
            if ($method !== 'POST') {
                throw new Exception('Method not allowed');
            }
            return handleAIEndpoint($bodyData);
            
        case 'statistics':
            if ($method !== 'GET') {
                throw new Exception('Method not allowed');
            }
            return handleStatisticsEndpoint($database);
            
        default:
            throw new Exception('Endpoint not found');
    }
}

function handleAuthEndpoint($action, $bodyData) {
    global $logger;
    
    try {
        $authController = new \CodeQuest\Controllers\AuthController();
        
        switch ($action) {
            case 'register':
                return $authController->register([]);
            case 'login':
                return $authController->login([]);
            case 'logout':
                return $authController->logout([]);
            default:
                throw new Exception('Invalid auth action');
        }
        
    } catch (Exception $e) {
        $logger->error('Auth endpoint error: ' . $e->getMessage());
        throw $e;
    }
}

function handleMeEndpoint($auth) {
    $headers = getallheaders();
    $jwt = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $jwt = $matches[1];
        }
    }
    
    if (!$jwt) {
        http_response_code(401);
        throw new Exception('Authentication required');
    }
    
    $user = $auth->getCurrentUser($jwt);
    if (!$user) {
        http_response_code(401);
        throw new Exception('Invalid authentication');
    }
    
    return $user;
}

function handleModulesEndpoint($database) {
    try {
        $modules = $database->fetchAll('
            SELECT m.*, 
                   COUNT(l.id) as lesson_count,
                   COUNT(DISTINCT c.id) as challenge_count
            FROM modules m
            LEFT JOIN lessons l ON m.id = l.module_id
            LEFT JOIN challenges c ON l.id = c.lesson_id
            GROUP BY m.id
            ORDER BY m.sort_order, m.id
        ');
        
        return ['modules' => $modules];
        
    } catch (Exception $e) {
        error_log('Modules endpoint error: ' . $e->getMessage());
        return ['modules' => []];
    }
}

function handleLessonsEndpoint($database, $slug) {
    if (empty($slug)) {
        throw new Exception('Lesson slug required');
    }
    
    try {
        $lesson = $database->fetch('
            SELECT l.*, m.title as module_title
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            WHERE l.slug = ?
        ', [$slug]);
        
        if (!$lesson) {
            http_response_code(404);
            throw new Exception('Lesson not found');
        }
        
        return $lesson;
        
    } catch (Exception $e) {
        return [
            'id' => 'html-intro',
            'title' => 'Introduction to HTML',
            'content' => '# Introduction to HTML\n\nHTML is the standard markup language for creating web pages...',
            'module_title' => 'HTML Basics',
            'sort_order' => 1
        ];
    }
}

function handleChallengesEndpoint($database, $id = null) {
    try {
    if (empty($id)) {
            // Return all challenges
            $challenges = $database->fetchAll('
                SELECT c.*, l.title as lesson_title
                FROM challenges c
                LEFT JOIN lessons l ON c.lesson_id = l.id
                ORDER BY c.sort_order, c.id
            ');
            
            if (empty($challenges)) {
                // Return sample challenges if none exist
                $sampleChallenges = [
                    [
                        'id' => 'challenge-1',
                        'title' => 'Create Your First HTML Page',
                        'description' => 'Create a simple HTML page with a heading and paragraph',
                        'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>',
                        'test_cases' => json_encode([
                            ['description' => 'Page should have an h1 heading', 'selector' => 'h1'],
                            ['description' => 'Page should have a paragraph', 'selector' => 'p']
                        ]),
                        'lesson_title' => 'HTML Basics',
                        'difficulty' => 'beginner',
                        'points' => 10,
                        'xp_reward' => 10
                    ],
                    [
                        'id' => 'challenge-2',
                        'title' => 'Style with CSS',
                        'description' => 'Add CSS styling to your HTML page',
                        'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Styled Page</title>\n    <style>\n        /* Your CSS here */\n    </style>\n</head>\n<body>\n    <h1>Hello World</h1>\n    <p>This is a paragraph</p>\n</body>\n</html>',
                        'test_cases' => json_encode([
                            ['description' => 'Page should have CSS styling', 'selector' => 'style'],
                            ['description' => 'H1 should be styled', 'selector' => 'h1']
                        ]),
                        'lesson_title' => 'CSS Basics',
                        'difficulty' => 'intermediate',
                        'points' => 15,
                        'xp_reward' => 15
                    ]
                ];
                
                return [
                    'success' => true,
                    'data' => $sampleChallenges
                ];
            }
            
            return [
                'success' => true,
                'data' => $challenges
            ];
        } else {
            // Return specific challenge by ID
        $challenge = $database->fetch('
            SELECT c.*, l.title as lesson_title
            FROM challenges c
                LEFT JOIN lessons l ON c.lesson_id = l.id
            WHERE c.id = ?
        ', [$id]);
        
        if (!$challenge) {
            http_response_code(404);
            throw new Exception('Challenge not found');
        }
        
            return [
                'success' => true,
                'data' => $challenge
            ];
        }
        
    } catch (Exception $e) {
        error_log('Challenges endpoint error: ' . $e->getMessage());
        
        if (empty($id)) {
            // Return sample challenges on error
            $sampleChallenges = [
                [
            'id' => 'challenge-1',
            'title' => 'Create Your First HTML Page',
            'description' => 'Create a simple HTML page with a heading and paragraph',
            'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>My First Page</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>',
            'test_cases' => json_encode([
                ['description' => 'Page should have an h1 heading', 'selector' => 'h1'],
                ['description' => 'Page should have a paragraph', 'selector' => 'p']
            ]),
                    'lesson_title' => 'HTML Basics',
                    'difficulty' => 'beginner',
                    'points' => 10,
                    'xp_reward' => 10
                ]
            ];
            
            return [
                'success' => true,
                'data' => $sampleChallenges
            ];
        } else {
            throw new Exception('Failed to load challenge: ' . $e->getMessage());
        }
    }
}

function handleAttemptsEndpoint($database, $bodyData) {
    if (empty($bodyData['challenge_id']) || empty($bodyData['user_id'])) {
        throw new Exception('Challenge ID and User ID required');
    }
    
    try {
        $result = $database->execute('
            INSERT INTO challenge_attempts (id, user_id, challenge_id, code_submitted, test_results, score, submitted_at)
            VALUES (UUID(), ?, ?, ?, ?, ?, NOW())
        ', [
            $bodyData['user_id'],
            $bodyData['challenge_id'],
            $bodyData['code'] ?? '',
            json_encode($bodyData['test_results'] ?? []),
            $bodyData['score'] ?? 0
        ]);
        
        return ['success' => true, 'attempt_id' => $database->lastInsertId()];
        
    } catch (Exception $e) {
        throw new Exception('Failed to save attempt: ' . $e->getMessage());
    }
}

function handleGameResultEndpoint($database, $bodyData) {
    if (empty($bodyData['user_id']) || empty($bodyData['game_id'])) {
        throw new Exception('User ID and Game ID required');
    }
    
    try {
        $result = $database->execute('
            INSERT INTO game_results (id, user_id, game_id, score, time_taken, completed_at)
            VALUES (UUID(), ?, ?, ?, ?, NOW())
        ', [
            $bodyData['user_id'],
            $bodyData['game_id'],
            $bodyData['score'] ?? 0,
            $bodyData['time_taken'] ?? 0
        ]);
        
        return ['success' => true, 'result_id' => $database->lastInsertId()];
        
    } catch (Exception $e) {
        throw new Exception('Failed to save game result: ' . $e->getMessage());
    }
}

function handleAIEndpoint($bodyData) {
    if (empty($bodyData['prompt'])) {
        throw new Exception('Prompt required');
    }
    
    set_time_limit(120);
    
    $envFile = __DIR__ . '/../.env';
    if (file_exists($envFile)) {
        try {
            $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
            $dotenv->load();
        } catch (Exception $e) {
            error_log('Failed to load .env file: ' . $e->getMessage());
        }
    }
    
    $apiKey = $_ENV['DEEPSEEK_API_KEY'] ?? $_SERVER['DEEPSEEK_API_KEY'] ?? getenv('DEEPSEEK_API_KEY') ?? '';
    
    if (empty($apiKey)) {
        $fallbackResponses = [
            'html' => 'HTML is the foundation of web development. It provides the structure and content for web pages using tags like <html>, <head>, <body>, <div>, <p>, etc.',
            'css' => 'CSS (Cascading Style Sheets) is used to style and layout web pages. It controls colors, fonts, spacing, and positioning of HTML elements.',
            'javascript' => 'JavaScript is a programming language that adds interactivity to web pages. It can manipulate the DOM, handle events, and make AJAX requests.',
            'web development' => 'Web development involves creating websites and web applications using HTML, CSS, and JavaScript. It includes frontend (client-side) and backend (server-side) development.',
            'coding' => 'Coding is the process of writing instructions for computers to execute. It involves problem-solving, logical thinking, and understanding programming concepts.',
            'help' => 'I\'m your AI coding assistant! I can help you with HTML, CSS, JavaScript, and web development concepts. What specific topic would you like to learn about?',
            'what' => 'I\'m here to help you with web development! Ask me about HTML, CSS, JavaScript, or any coding concept you\'d like to learn.',
            'how' => 'I can guide you through web development concepts step by step. What would you like to learn how to do?'
        ];
        
        $prompt = strtolower($bodyData['prompt']);
        $response = '';
        
        foreach ($fallbackResponses as $keyword => $answer) {
            if (strpos($prompt, $keyword) !== false) {
                $response = $answer;
                break;
            }
        }
        
        if (empty($response)) {
            $response = 'I\'m your AI coding assistant! I can help you with HTML, CSS, JavaScript, and web development concepts. What specific topic would you like to learn about?';
        }
        
        return ['response' => $response];
    }
    
    try {
        $response = callDeepSeekAPI($bodyData['prompt'], $apiKey);
        return ['response' => $response];
        
    } catch (Exception $e) {
        error_log('DeepSeek API error: ' . $e->getMessage());
        
        if (strpos($e->getMessage(), 'timed out') !== false) {
            return ['response' => 'I apologize, but the AI service is taking longer than expected to respond. This might be due to high demand. Please try again in a moment, or try asking a shorter question.'];
        }
        
        if (strpos($e->getMessage(), 'execution time') !== false) {
            return ['response' => 'I apologize, but the request is taking too long to process. Please try asking a shorter question or try again later.'];
        }
        
        $prompt = strtolower($bodyData['prompt']);
        if (strpos($prompt, 'html') !== false) {
            return ['response' => 'HTML is the foundation of web development. It provides the structure and content for web pages using tags like <html>, <head>, <body>, <div>, <p>, etc.'];
        } elseif (strpos($prompt, 'css') !== false) {
            return ['response' => 'CSS (Cascading Style Sheets) is used to style and layout web pages. It controls colors, fonts, spacing, and positioning of HTML elements.'];
        } elseif (strpos($prompt, 'javascript') !== false) {
            return ['response' => 'JavaScript is a programming language that adds interactivity to web pages. It can manipulate the DOM, handle events, and make AJAX requests.'];
        } else {
            return ['response' => 'I\'m your AI coding assistant! I can help you with HTML, CSS, JavaScript, and web development concepts. What specific topic would you like to learn about?'];
        }
    }
}

function handleStatisticsEndpoint($database) {
    try {
        $database->getConnection();
        
        $stats = $database->fetch('
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM modules) as total_modules,
                (SELECT COUNT(*) FROM lessons) as total_lessons,
                (SELECT COUNT(*) FROM challenges) as total_challenges,
                (SELECT COUNT(*) FROM challenge_attempts WHERE score >= 80) as completed_challenges,
                (SELECT COUNT(*) FROM game_results) as total_games_played
        ');
        
        if (!is_array($stats)) {
            $stats = [];
        }
        
        return $stats;
        
    } catch (Exception $e) {
        error_log('Statistics endpoint error: ' . $e->getMessage());
        return [
            'total_users' => 0,
            'total_modules' => 0,
            'total_lessons' => 0,
            'total_challenges' => 0,
            'completed_challenges' => 0,
            'total_games_played' => 0
        ];
    }
}

function callDeepSeekAPI($prompt, $apiKey) {
    $url = 'https://api.deepseek.com/v1/chat/completions';
    
    $maxExecutionTime = ini_get('max_execution_time');
    if ($maxExecutionTime > 0) {
        $elapsedTime = microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'];
        $remainingTime = $maxExecutionTime - $elapsedTime;
        if ($remainingTime < 10) {
            throw new Exception('Insufficient execution time remaining. Please try again.');
        }
    }
    
    $systemPrompt = "You are a helpful coding assistant specializing in web development (HTML, CSS, JavaScript), programming concepts, and software development best practices. Provide clear, practical explanations with examples when appropriate. Keep responses concise but informative.";
    
    $data = [
        'model' => 'deepseek-chat',
        'messages' => [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ],
        'max_tokens' => 1500,
        'temperature' => 0.7,
        'top_p' => 0.9,
        'frequency_penalty' => 0.1,
        'presence_penalty' => 0.1
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 45);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'CodeQuest-AI-Assistant/1.0');
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($response === false) {
        if (strpos($curlError, 'timeout') !== false || strpos($curlError, 'timed out') !== false) {
            throw new Exception('AI API request timed out. Please try again.');
        }
        throw new Exception('cURL error: ' . $curlError);
    }
    
    if ($httpCode !== 200) {
        $errorMessage = 'AI API request failed with status: ' . $httpCode;
        if ($httpCode === 401) {
            $errorMessage = 'AI API authentication failed. Please check your API key.';
        } elseif ($httpCode === 429) {
            $errorMessage = 'AI API rate limit exceeded. Please try again later.';
        } elseif ($httpCode >= 500) {
            $errorMessage = 'AI API service temporarily unavailable. Please try again later.';
        }
        throw new Exception($errorMessage);
    }
    
    $result = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON response from AI API: ' . json_last_error_msg());
    }
    
    if (!$result || !isset($result['choices']) || !is_array($result['choices']) || empty($result['choices'])) {
        throw new Exception('Invalid response structure from AI API');
    }
    
    if (!isset($result['choices'][0]['message']['content'])) {
        throw new Exception('No content in AI API response');
    }
    
    return $result['choices'][0]['message']['content'];
}

function handleRandomChallengeEndpoint($database) {
    try {
        // Get a random challenge from the database
        $challenge = $database->fetch('
            SELECT c.*, l.title as lesson_title
            FROM challenges c
            LEFT JOIN lessons l ON c.lesson_id = l.id
            ORDER BY RAND()
            LIMIT 1
        ');
        
        if (!$challenge) {
            // Return a sample challenge if none exist
            $sampleChallenge = [
                'id' => 'challenge-random',
                'title' => 'Random HTML Challenge',
                'description' => 'Create a simple HTML page with various elements',
                'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Random Challenge</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>',
                'test_cases' => json_encode([
                    ['description' => 'Page should have HTML structure', 'selector' => 'html'],
                    ['description' => 'Page should have a body element', 'selector' => 'body']
                ]),
                'lesson_title' => 'HTML Basics',
                'difficulty' => 'beginner',
                'points' => 10,
                'xp_reward' => 10
            ];
            
            return [
                'success' => true,
                'data' => $sampleChallenge
            ];
        }
        
        return [
            'success' => true,
            'data' => $challenge
        ];
        
    } catch (Exception $e) {
        error_log('Random challenge endpoint error: ' . $e->getMessage());
        
        // Return a sample challenge on error
        $sampleChallenge = [
            'id' => 'challenge-random',
            'title' => 'Random HTML Challenge',
            'description' => 'Create a simple HTML page with various elements',
            'starter_code' => '<!DOCTYPE html>\n<html>\n<head>\n    <title>Random Challenge</title>\n</head>\n<body>\n    <!-- Your code here -->\n</body>\n</html>',
            'test_cases' => json_encode([
                ['description' => 'Page should have HTML structure', 'selector' => 'html'],
                ['description' => 'Page should have a body element', 'selector' => 'body']
            ]),
            'lesson_title' => 'HTML Basics',
            'difficulty' => 'beginner',
            'points' => 10,
            'xp_reward' => 10
        ];
        
        return [
            'success' => true,
            'data' => $sampleChallenge
        ];
    }
}

// Games API endpoints
function handleGamesEndpoint() {
    try {
        $controller = new \CodeQuest\Controllers\AppwriteGamesController();
        return $controller->getAllGames();
    } catch (Exception $e) {
        throw new Exception('Failed to handle games endpoint: ' . $e->getMessage());
    }
}

function handleLeaderboardEndpoint($period = 'weekly') {
    try {
        $controller = new \CodeQuest\Controllers\AppwriteGamesController();
        $controller->getLeaderboard($period);
        return ['success' => true, 'message' => 'Leaderboard endpoint handled'];
    } catch (Exception $e) {
        throw new Exception('Failed to handle leaderboard endpoint: ' . $e->getMessage());
    }
}

function handleUserStatsEndpoint() {
    try {
        $controller = new \CodeQuest\Controllers\AppwriteGamesController();
        $controller->getUserGameStats();
        return ['success' => true, 'message' => 'User stats endpoint handled'];
    } catch (Exception $e) {
        throw new Exception('Failed to handle user stats endpoint: ' . $e->getMessage());
    }
}

function handleSaveGameResultEndpoint() {
    try {
        $controller = new \CodeQuest\Controllers\AppwriteGamesController();
        $controller->saveGameResult();
        return ['success' => true, 'message' => 'Game result saved'];
    } catch (Exception $e) {
        throw new Exception('Failed to save game result: ' . $e->getMessage());
    }
}

// Appwrite Challenge API endpoints
function handleAppwriteChallengesEndpoint($id = null) {
    try {
        $controller = new \CodeQuest\Controllers\AppwriteChallengeController();
        
        if (empty($id)) {
            return $controller->getChallenges();
        } else {
            return $controller->getChallenge(['id' => $id]);
        }
    } catch (Exception $e) {
        error_log('Appwrite challenges endpoint error: ' . $e->getMessage());
        throw new Exception('Failed to handle challenges endpoint: ' . $e->getMessage());
    }
}

function handleAppwriteRandomChallengeEndpoint() {
    try {
        $controller = new \CodeQuest\Controllers\AppwriteChallengeController();
        return $controller->getRandomChallenge();
    } catch (Exception $e) {
        error_log('Appwrite random challenge endpoint error: ' . $e->getMessage());
        throw new Exception('Failed to handle random challenge endpoint: ' . $e->getMessage());
    }
}
