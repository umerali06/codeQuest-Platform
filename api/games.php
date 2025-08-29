<?php
/**
 * Enhanced Games API - Database-driven with full functionality
 */

// Ensure clean JSON output
ob_start();

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Database configuration
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'codequest');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');

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
    sendJsonResponse(['error' => 'Database connection failed. Please ensure MySQL is running and database exists.'], 500);
}

// Get request method and path
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim(parse_url($requestUri, PHP_URL_PATH), '/'));

// Utility functions for games API
function getGamesRequestBody() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

function getGamesAuthenticatedUser($pdo) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        return null;
    }
    
    $token = substr($authHeader, 7);
    
    try {
        $stmt = $pdo->prepare("SELECT u.* FROM users u JOIN user_sessions s ON u.id = s.user_id WHERE s.session_token = ? AND s.expires_at > NOW()");
        $stmt->execute([$token]);
        return $stmt->fetch();
    } catch (Exception $e) {
        return null;
    }
}

function generateGamesUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Utility functions
function sendJsonResponse($data, $statusCode = 200) {
    // Clear any unwanted output
    if (ob_get_level()) {
        ob_clean();
    }
    
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}







$gameAction = $pathParts[1] ?? '';
$gameSubAction = $pathParts[2] ?? '';

switch ($requestMethod) {
    case 'GET':
        switch ($gameAction) {
            case 'leaderboard':
                handleGetGameLeaderboard($pdo);
                break;
            case 'statistics':
                handleGetGameStatistics($pdo);
                break;
            case 'achievements':
                handleGetGameAchievements($pdo);
                break;
            case 'session':
                handleGetGameSession($pdo);
                break;
            case 'progress':
                handleGetGameProgress($pdo);
                break;
            default:
                handleGetGames($pdo);
        }
        break;
        
    case 'POST':
        switch ($gameAction) {
            case 'start':
                handleStartGame($pdo);
                break;
            case 'score':
                handleSubmitScore($pdo);
                break;
            case 'session':
                handleUpdateSession($pdo);
                break;
            case 'rating':
                handleSubmitRating($pdo);
                break;
            default:
                sendJsonResponse(['error' => 'Invalid action'], 400);
        }
        break;
        
    case 'PUT':
        if ($gameAction === 'session') {
            handleCompleteSession($pdo);
        } else {
            sendJsonResponse(['error' => 'Invalid action'], 400);
        }
        break;
        
    default:
        sendJsonResponse(['error' => 'Method not allowed'], 405);
}

function handleGetGames($pdo) {
    try {
        $category = $_GET['category'] ?? '';
        $difficulty = $_GET['difficulty'] ?? '';
        $featured = $_GET['featured'] ?? '';
        $slug = $_GET['slug'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = max((int)($_GET['offset'] ?? 0), 0);

        $whereConditions = ['g.is_active = TRUE'];
        $params = [];

        if ($slug) {
            $whereConditions[] = 'g.slug = ?';
            $params[] = $slug;
        }

        if ($category && $category !== 'all') {
            $whereConditions[] = 'g.category = ?';
            $params[] = $category;
        }

        if ($difficulty) {
            $whereConditions[] = 'g.difficulty = ?';
            $params[] = $difficulty;
        }

        if ($featured === 'true') {
            // Featured games - for now, just order by XP reward
            $whereConditions[] = 'g.xp_reward >= 100';
        }

        $whereClause = implode(' AND ', $whereConditions);

        $stmt = $pdo->prepare("
            SELECT 
                g.*,
                0 as total_plays,
                0 as unique_players,
                0 as average_score,
                0 as completion_rate
            FROM games g
            WHERE {$whereClause}
            ORDER BY g.created_at DESC
            LIMIT ? OFFSET ?
        ");

        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        $games = $stmt->fetchAll();

        // Get user's progress if authenticated
        $user = getGamesAuthenticatedUser($pdo);
        $userProgress = [];

        if ($user) {
            $gameIds = array_column($games, 'id');
            if (!empty($gameIds)) {
                $placeholders = str_repeat('?,', count($gameIds) - 1) . '?';
                $stmt = $pdo->prepare("
                    SELECT 
                        gl.game_id,
                        gl.best_score,
                        gl.best_time,
                        gl.total_plays,
                        gl.rank_position,
                        COUNT(uga.id) as achievements_earned
                    FROM game_leaderboards gl
                    LEFT JOIN user_game_achievements uga ON gl.user_id = uga.user_id AND gl.game_id = uga.game_id
                    WHERE gl.user_id = ? AND gl.game_id IN ({$placeholders})
                    GROUP BY gl.game_id, gl.best_score, gl.best_time, gl.total_plays, gl.rank_position
                ");
                $stmt->execute(array_merge([$user['id']], $gameIds));
                $progress = $stmt->fetchAll();

                foreach ($progress as $p) {
                    $userProgress[$p['game_id']] = [
                        'best_score' => (int)$p['best_score'],
                        'best_time' => (int)$p['best_time'],
                        'total_plays' => (int)$p['total_plays'],
                        'rank' => (int)$p['rank_position'],
                        'achievements_earned' => (int)$p['achievements_earned']
                    ];
                }
            }
        }

        // Format games data
        $formattedGames = array_map(function($game) use ($userProgress) {
            $gameData = [
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

            // Add user progress if available
            if (isset($userProgress[$game['id']])) {
                $gameData['user_progress'] = $userProgress[$game['id']];
            }

            return $gameData;
        }, $games);

        sendJsonResponse([
            'success' => true,
            'data' => $formattedGames,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'total' => count($formattedGames)
            ],
            'user_authenticated' => $user !== null
        ]);

    } catch (Exception $e) {
        error_log("Error fetching games: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to fetch games'], 500);
    }
}

function handleStartGame($pdo) {
    $user = getGamesAuthenticatedUser($pdo);
    if (!$user) {
        sendJsonResponse(['error' => 'Authentication required'], 401);
    }

    $data = getGamesRequestBody();
    $gameId = $data['game_id'] ?? '';

    if (!$gameId) {
        sendJsonResponse(['error' => 'Game ID is required'], 400);
    }

    try {
        // Verify game exists and is active
        $stmt = $pdo->prepare("SELECT * FROM games WHERE id = ? AND is_active = TRUE");
        $stmt->execute([$gameId]);
        $game = $stmt->fetch();

        if (!$game) {
            sendJsonResponse(['error' => 'Game not found or inactive'], 404);
        }

        // Check user level requirement
        $userLevel = getUserLevel($pdo, $user['id']);
        if ($userLevel < $game['min_level']) {
            sendJsonResponse([
                'error' => 'Insufficient level',
                'required_level' => (int)$game['min_level'],
                'user_level' => $userLevel
            ], 403);
        }

        // Create new game session
        $sessionId = generateGamesUUID();
        $sessionToken = bin2hex(random_bytes(16));

        $stmt = $pdo->prepare("
            INSERT INTO game_sessions (
                id, user_id, game_id, session_token, session_data
            ) VALUES (?, ?, ?, ?, ?)
        ");

        $sessionData = json_encode([
            'started_at' => time(),
            'game_config' => json_decode($game['game_config'], true),
            'user_level' => $userLevel
        ]);

        $stmt->execute([$sessionId, $user['id'], $gameId, $sessionToken, $sessionData]);

        sendJsonResponse([
            'success' => true,
            'session' => [
                'id' => $sessionId,
                'token' => $sessionToken,
                'game' => [
                    'id' => $game['id'],
                    'title' => $game['title'],
                    'max_score' => (int)$game['max_score'],
                    'time_limit' => (int)$game['time_limit'],
                    'config' => json_decode($game['game_config'], true)
                ]
            ]
        ]);

    } catch (Exception $e) {
        error_log("Error starting game: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to start game'], 500);
    }
}

function handleSubmitScore($pdo) {
    $user = getGamesAuthenticatedUser($pdo);
    if (!$user) {
        sendJsonResponse(['error' => 'Authentication required'], 401);
    }

    $data = getGamesRequestBody();
    $sessionToken = $data['session_token'] ?? '';
    $score = (int)($data['score'] ?? 0);
    $timeSpent = (int)($data['time_spent'] ?? 0);
    $levelReached = (int)($data['level_reached'] ?? 1);
    $movesOrActions = (int)($data['moves_made'] ?? 0);
    $hintsUsed = (int)($data['hints_used'] ?? 0);

    if (!$sessionToken) {
        sendJsonResponse(['error' => 'Session token is required'], 400);
    }

    try {
        $pdo->beginTransaction();

        // Get and validate session
        $stmt = $pdo->prepare("
            SELECT gs.*, g.max_score, g.xp_reward 
            FROM game_sessions gs
            JOIN games g ON gs.game_id = g.id
            WHERE gs.session_token = ? AND gs.user_id = ? AND gs.status = 'active'
        ");
        $stmt->execute([$sessionToken, $user['id']]);
        $session = $stmt->fetch();

        if (!$session) {
            sendJsonResponse(['error' => 'Invalid or expired session'], 400);
        }

        // Validate score (basic anti-cheat)
        if ($score > $session['max_score']) {
            sendJsonResponse(['error' => 'Invalid score'], 400);
        }

        // Calculate XP earned
        $scorePercentage = $score / $session['max_score'];
        $baseXP = $session['xp_reward'];
        $xpEarned = (int)($baseXP * $scorePercentage);

        // Bonus XP for perfect score
        $perfectScore = ($score >= $session['max_score']);
        if ($perfectScore) {
            $xpEarned += (int)($baseXP * 0.5); // 50% bonus
        }

        // Insert score record
        $scoreId = generateGamesUUID();
        $stmt = $pdo->prepare("
            INSERT INTO game_scores (
                id, user_id, game_id, session_id, score, time_spent, 
                level_reached, perfect_score, xp_earned, score_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $scoreData = json_encode([
            'moves_made' => $movesOrActions,
            'hints_used' => $hintsUsed,
            'score_breakdown' => $data['score_breakdown'] ?? null
        ]);

        $stmt->execute([
            $scoreId, $user['id'], $session['game_id'], $session['id'],
            $score, $timeSpent, $levelReached, $perfectScore, $xpEarned, $scoreData
        ]);

        // Update session
        $stmt = $pdo->prepare("
            UPDATE game_sessions 
            SET status = 'completed', score = ?, level_reached = ?, 
                time_spent = ?, moves_made = ?, hints_used = ?, completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $stmt->execute([$score, $levelReached, $timeSpent, $movesOrActions, $hintsUsed, $session['id']]);

        // Update user progress
        updateUserProgress($pdo, $user['id'], $xpEarned);

        // Check and award achievements
        $achievements = checkGameAchievements($pdo, $user['id'], $session['game_id'], $score, $timeSpent, $perfectScore);

        // Get user's new rank
        $stmt = $pdo->prepare("
            SELECT rank_position FROM game_leaderboards 
            WHERE game_id = ? AND user_id = ?
        ");
        $stmt->execute([$session['game_id'], $user['id']]);
        $rank = $stmt->fetchColumn() ?: null;

        $pdo->commit();

        sendJsonResponse([
            'success' => true,
            'result' => [
                'score' => $score,
                'xp_earned' => $xpEarned,
                'perfect_score' => $perfectScore,
                'rank' => $rank,
                'achievements' => $achievements,
                'time_spent' => $timeSpent,
                'level_reached' => $levelReached
            ]
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Error submitting score: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to submit score'], 500);
    }
}

function handleGetGameLeaderboard($pdo) {
    try {
        $gameId = $_GET['game_id'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 10), 50);
        $timeframe = $_GET['timeframe'] ?? 'all'; // all, weekly, monthly

        if (!$gameId) {
            sendJsonResponse(['error' => 'Game ID is required'], 400);
        }

        $dateFilter = '';
        $params = [$gameId];

        switch ($timeframe) {
            case 'weekly':
                $dateFilter = 'AND gl.last_played >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                break;
            case 'monthly':
                $dateFilter = 'AND gl.last_played >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                break;
        }

        $stmt = $pdo->prepare("
            SELECT 
                u.name as username,
                gl.best_score,
                gl.best_time,
                gl.total_plays,
                gl.rank_position,
                gl.last_played,
                COUNT(uga.id) as achievements_count
            FROM game_leaderboards gl
            JOIN users u ON gl.user_id = u.id
            LEFT JOIN user_game_achievements uga ON gl.user_id = uga.user_id AND gl.game_id = uga.game_id
            WHERE gl.game_id = ? {$dateFilter}
            GROUP BY gl.user_id, u.name, gl.best_score, gl.best_time, gl.total_plays, gl.rank_position, gl.last_played
            ORDER BY gl.best_score DESC, gl.best_time ASC
            LIMIT ?
        ");

        $params[] = $limit;
        $stmt->execute($params);
        $leaderboard = $stmt->fetchAll();

        $formattedLeaderboard = array_map(function($entry, $index) {
            return [
                'rank' => $index + 1,
                'username' => $entry['username'],
                'score' => (int)$entry['best_score'],
                'time' => (int)$entry['best_time'],
                'plays' => (int)$entry['total_plays'],
                'achievements' => (int)$entry['achievements_count'],
                'last_played' => $entry['last_played']
            ];
        }, $leaderboard, array_keys($leaderboard));

        sendJsonResponse([
            'success' => true,
            'leaderboard' => $formattedLeaderboard,
            'game_id' => $gameId,
            'timeframe' => $timeframe
        ]);

    } catch (Exception $e) {
        error_log("Error fetching leaderboard: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to fetch leaderboard'], 500);
    }
}

function handleGetGameStatistics($pdo) {
    $user = getGamesAuthenticatedUser($pdo);
    if (!$user) {
        sendJsonResponse(['error' => 'Authentication required'], 401);
    }

    try {
        // Get user's game statistics
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(DISTINCT gs.game_id) as games_played,
                COUNT(gs.id) as total_sessions,
                AVG(gs.score) as average_score,
                MAX(gs.score) as best_score,
                SUM(gs.xp_earned) as total_xp,
                AVG(gs.time_spent) as average_time,
                COUNT(CASE WHEN gs.perfect_score = 1 THEN 1 END) as perfect_scores,
                COUNT(uga.id) as total_achievements
            FROM game_sessions gs
            LEFT JOIN game_scores gsc ON gs.id = gsc.session_id
            LEFT JOIN user_game_achievements uga ON gs.user_id = uga.user_id
            WHERE gs.user_id = ? AND gs.status = 'completed'
        ");
        $stmt->execute([$user['id']]);
        $stats = $stmt->fetch();

        // Get category breakdown
        $stmt = $pdo->prepare("
            SELECT 
                g.category,
                COUNT(gs.id) as plays,
                AVG(gs.score) as avg_score,
                MAX(gs.score) as best_score
            FROM game_sessions gs
            JOIN games g ON gs.game_id = g.id
            WHERE gs.user_id = ? AND gs.status = 'completed'
            GROUP BY g.category
        ");
        $stmt->execute([$user['id']]);
        $categoryStats = $stmt->fetchAll();

        sendJsonResponse([
            'success' => true,
            'statistics' => [
                'overview' => [
                    'games_played' => (int)($stats['games_played'] ?? 0),
                    'total_sessions' => (int)($stats['total_sessions'] ?? 0),
                    'average_score' => (float)($stats['average_score'] ?? 0),
                    'best_score' => (int)($stats['best_score'] ?? 0),
                    'total_xp' => (int)($stats['total_xp'] ?? 0),
                    'average_time' => (float)($stats['average_time'] ?? 0),
                    'perfect_scores' => (int)($stats['perfect_scores'] ?? 0),
                    'achievements' => (int)($stats['total_achievements'] ?? 0)
                ],
                'by_category' => array_map(function($cat) {
                    return [
                        'category' => $cat['category'],
                        'plays' => (int)$cat['plays'],
                        'average_score' => (float)$cat['avg_score'],
                        'best_score' => (int)$cat['best_score']
                    ];
                }, $categoryStats)
            ]
        ]);

    } catch (Exception $e) {
        error_log("Error fetching statistics: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to fetch statistics'], 500);
    }
}

// Helper functions
function getUserLevel($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("SELECT level FROM user_progress WHERE user_id = ?");
        $stmt->execute([$userId]);
        return (int)($stmt->fetchColumn() ?: 1);
    } catch (Exception $e) {
        return 1; // Default level
    }
}

function updateUserProgress($pdo, $userId, $xpEarned) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO user_progress (id, user_id, total_xp) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                total_xp = total_xp + ?,
                level = FLOOR(SQRT(total_xp / 100)) + 1,
                updated_at = CURRENT_TIMESTAMP
        ");
        $progressId = generateGamesUUID();
        $stmt->execute([$progressId, $userId, $xpEarned, $xpEarned]);
    } catch (Exception $e) {
        error_log("Error updating user progress: " . $e->getMessage());
    }
}

function checkGameAchievements($pdo, $userId, $gameId, $score, $timeSpent, $perfectScore) {
    $achievements = [];
    
    try {
        // Get available achievements for this game
        $stmt = $pdo->prepare("
            SELECT * FROM game_achievements 
            WHERE (game_id = ? OR game_id IS NULL) 
            AND id NOT IN (
                SELECT achievement_id FROM user_game_achievements WHERE user_id = ?
            )
        ");
        $stmt->execute([$gameId, $userId]);
        $availableAchievements = $stmt->fetchAll();

        foreach ($availableAchievements as $achievement) {
            $earned = false;
            $requirement = json_decode($achievement['requirement_value'], true);

            switch ($achievement['requirement_type']) {
                case 'score':
                    $earned = $score >= ($requirement['min_score'] ?? 0);
                    break;
                case 'time':
                    $earned = $timeSpent <= ($requirement['max_time'] ?? PHP_INT_MAX);
                    break;
                case 'perfect':
                    $earned = $perfectScore;
                    break;
                // Add more achievement types as needed
            }

            if ($earned) {
                // Award achievement
                $stmt = $pdo->prepare("
                    INSERT INTO user_game_achievements (id, user_id, achievement_id, game_id)
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([generateGamesUUID(), $userId, $achievement['id'], $gameId]);
                
                $achievements[] = [
                    'id' => $achievement['id'],
                    'title' => $achievement['title'],
                    'description' => $achievement['description'],
                    'icon' => $achievement['icon'],
                    'xp_reward' => (int)$achievement['xp_reward']
                ];

                // Award XP for achievement
                updateUserProgress($pdo, $userId, $achievement['xp_reward']);
            }
        }
    } catch (Exception $e) {
        error_log("Error checking achievements: " . $e->getMessage());
    }

    return $achievements;
}

function handleGetGameProgress($pdo) {
    $user = getGamesAuthenticatedUser($pdo);
    if (!$user) {
        sendJsonResponse(['error' => 'Authentication required'], 401);
    }

    try {
        $gameId = $_GET['game_id'] ?? '';
        if (!$gameId) {
            sendJsonResponse(['error' => 'Game ID is required'], 400);
        }

        // Get user's progress for this game
        $stmt = $pdo->prepare("
            SELECT 
                gl.best_score,
                gl.best_time,
                gl.total_plays,
                gl.rank_position as rank,
                COUNT(uga.id) as achievements_earned,
                MAX(gs.completed_at) as last_played
            FROM game_leaderboards gl
            LEFT JOIN user_game_achievements uga ON gl.user_id = uga.user_id AND gl.game_id = uga.game_id
            LEFT JOIN game_sessions gs ON gl.user_id = gs.user_id AND gl.game_id = gs.game_id AND gs.status = 'completed'
            WHERE gl.user_id = ? AND gl.game_id = ?
            GROUP BY gl.best_score, gl.best_time, gl.total_plays, gl.rank_position
        ");
        $stmt->execute([$user['id'], $gameId]);
        $progress = $stmt->fetch();

        if ($progress) {
            sendJsonResponse([
                'success' => true,
                'data' => [
                    'best_score' => (int)$progress['best_score'],
                    'best_time' => (int)$progress['best_time'],
                    'total_plays' => (int)$progress['total_plays'],
                    'rank' => (int)$progress['rank'],
                    'achievements_earned' => (int)$progress['achievements_earned'],
                    'last_played' => $progress['last_played']
                ]
            ]);
        } else {
            sendJsonResponse([
                'success' => true,
                'data' => null
            ]);
        }

    } catch (Exception $e) {
        error_log("Error fetching game progress: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to fetch progress'], 500);
    }
}
?>