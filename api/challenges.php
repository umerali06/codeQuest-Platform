<?php
/**
 * Challenges API endpoints
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

if (!function_exists('validateRequired')) {
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
}

if (!function_exists('generateUuid')) {
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

if (!function_exists('checkAchievements')) {
    function checkAchievements($pdo, $userId) {
        // Simplified achievement check - would be more complex in production
        return [];
    }
}

$challengeSlug = $pathParts[1] ?? '';

switch ($requestMethod) {
    case 'GET':
        if ($challengeSlug === 'progress') {
            handleGetChallengeProgress($pdo);
        } elseif ($challengeSlug === 'leaderboard') {
            handleGetChallengeLeaderboard($pdo);
        } elseif ($challengeSlug) {
            handleGetChallenge($pdo, $challengeSlug);
        } else {
            handleGetChallenges($pdo);
        }
        break;
        
    case 'POST':
        if ($challengeSlug === 'submit') {
            handleSubmitChallenge($pdo);
        } else {
            sendResponse(['error' => 'Invalid action'], 400);
        }
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleGetChallenges($pdo) {
    $category = $_GET['category'] ?? '';
    $difficulty = $_GET['difficulty'] ?? '';
    
    $sql = "SELECT * FROM challenges WHERE is_active = TRUE";
    $params = [];
    
    if ($category) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }
    
    if ($difficulty) {
        $sql .= " AND difficulty = ?";
        $params[] = $difficulty;
    }
    
    $sql .= " ORDER BY difficulty, title";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $challenges = $stmt->fetchAll();
    
    // Format response
    $formattedChallenges = array_map(function($challenge) {
        return [
            'id' => $challenge['id'],
            'slug' => $challenge['slug'],
            'title' => $challenge['title'],
            'description' => $challenge['description'],
            'difficulty' => $challenge['difficulty'],
            'xpReward' => (int)$challenge['xp_reward'],
            'category' => $challenge['category'],
            'tags' => json_decode($challenge['tags'] ?? '[]', true)
        ];
    }, $challenges);
    
    sendResponse([
        'success' => true,
        'data' => $formattedChallenges
    ]);
}

function handleGetChallenge($pdo, $challengeSlug) {
    $stmt = $pdo->prepare("SELECT * FROM challenges WHERE slug = ? AND is_active = TRUE");
    $stmt->execute([$challengeSlug]);
    $challenge = $stmt->fetch();
    
    if (!$challenge) {
        sendResponse(['error' => 'Challenge not found'], 404);
    }
    
    // Check if user has completed this challenge
    $user = getAuthenticatedUser($pdo);
    $userAttempt = null;
    
    if ($user) {
        $stmt = $pdo->prepare("
            SELECT * FROM user_challenge_attempts 
            WHERE user_id = ? AND challenge_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$user['id'], $challenge['id']]);
        $userAttempt = $stmt->fetch();
    }
    
    // Parse tests to extract test statements for display
    $tests = json_decode($challenge['tests'] ?? '[]', true);
    $testStatements = [];
    
    foreach ($tests as $test) {
        if (isset($test['name'])) {
            $testStatements[] = $test['name'];
        } elseif (isset($test['description'])) {
            $testStatements[] = $test['description'];
        }
    }
    
    sendResponse([
        'success' => true,
        'data' => [
            'id' => $challenge['id'],
            'slug' => $challenge['slug'],
            'title' => $challenge['title'],
            'description' => $challenge['description'],
            'instructions' => $challenge['instructions'],
            'starterCode' => json_decode($challenge['starter_code'] ?? '{}', true),
            'tests' => $tests,
            'testStatements' => $testStatements,
            'difficulty' => $challenge['difficulty'],
            'xpReward' => (int)$challenge['xp_reward'],
            'category' => $challenge['category'],
            'tags' => json_decode($challenge['tags'] ?? '[]', true),
            'userAttempt' => $userAttempt ? [
                'isCompleted' => (bool)$userAttempt['is_completed'],
                'testsPassed' => (int)$userAttempt['tests_passed'],
                'totalTests' => (int)$userAttempt['total_tests'],
                'lastCode' => json_decode($userAttempt['code'] ?? '{}', true),
                'completedAt' => $userAttempt['completed_at']
            ] : null
        ]
    ]);
}

function handleSubmitChallenge($pdo) {
    // Include code evaluator
    require_once __DIR__ . '/code-evaluator.php';
    
    // Try to get authenticated user, but don't require it for challenge testing
    $user = getAuthenticatedUser($pdo);
    
    // Check authentication for challenge submission
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        return;
    }
    
    $data = getRequestBody();
    validateRequired($data, ['challengeSlug', 'code']);
    
    $challengeSlug = $data['challengeSlug'];
    $code = $data['code'];
    
    // Get challenge details
    $stmt = $pdo->prepare("SELECT * FROM challenges WHERE slug = ? AND is_active = TRUE");
    $stmt->execute([$challengeSlug]);
    $challenge = $stmt->fetch();
    
    if (!$challenge) {
        sendResponse(['error' => 'Challenge not found'], 404);
    }
    
    // Run tests using proper code evaluator
    $testCases = json_decode($challenge['test_cases'] ?? '[]', true);
    $solutionCode = json_decode($challenge['solution_code'] ?? '{}', true);
    
    $evaluation = CodeEvaluator::evaluateCode($code, $testCases, $solutionCode);
    
    $testResults = $evaluation['testResults'];
    $testsPassed = count(array_filter($testResults, function($result) {
        return $result['passed'];
    }));
    $totalTests = count($testResults);
    $isCompleted = $evaluation['score'] >= 70; // 70% or higher to complete
    $score = $evaluation['score'];
    
    $xpEarned = 0;
    $existingAttempt = null;
    
    // Only save progress if user is authenticated
    if ($user) {
        try {
            $pdo->beginTransaction();
            
            // Check for existing attempt
            $stmt = $pdo->prepare("
                SELECT id FROM user_challenge_attempts 
                WHERE user_id = ? AND challenge_id = ?
            ");
            $stmt->execute([$user['id'], $challenge['id']]);
            $existingAttempt = $stmt->fetch();
            
            if ($existingAttempt) {
                // Update existing attempt
                $stmt = $pdo->prepare("
                    UPDATE user_challenge_attempts 
                    SET code = ?, is_completed = ?, tests_passed = ?, total_tests = ?, 
                        completed_at = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                $stmt->execute([
                    json_encode($code),
                    $isCompleted,
                    $testsPassed,
                    $totalTests,
                    $isCompleted ? date('Y-m-d H:i:s') : null,
                    $existingAttempt['id']
                ]);
            } else {
                // Create new attempt
                $stmt = $pdo->prepare("
                    INSERT INTO user_challenge_attempts 
                    (id, user_id, challenge_id, code, is_completed, tests_passed, total_tests, xp_earned, completed_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    generateUuid(),
                    $user['id'],
                    $challenge['id'],
                    json_encode($code),
                    $isCompleted,
                    $testsPassed,
                    $totalTests,
                    $isCompleted ? $challenge['xp_reward'] : 0,
                    $isCompleted ? date('Y-m-d H:i:s') : null
                ]);
            }
            
            // Award XP if completed for the first time
            if ($isCompleted && !$existingAttempt) {
                $stmt = $pdo->prepare("
                    UPDATE user_progress 
                    SET total_xp = total_xp + ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE user_id = ?
                ");
                $stmt->execute([$challenge['xp_reward'], $user['id']]);
                
                // Check for achievements
                checkAchievements($pdo, $user['id']);
                
                $xpEarned = (int)$challenge['xp_reward'];
            }
            
            $pdo->commit();
            
        } catch (Exception $e) {
            $pdo->rollBack();
            // Don't fail the entire request if progress saving fails
            error_log("Failed to save challenge progress: " . $e->getMessage());
        }
    }
    
    // Always return test results, regardless of authentication
    sendResponse([
        'success' => true,
        'data' => [
            'isCompleted' => $isCompleted,
            'testsPassed' => $testsPassed,
            'totalTests' => $totalTests,
            'score' => $score,
            'testResults' => $testResults,
            'feedback' => $evaluation['feedback'],
            'codeAnalysis' => $evaluation['codeAnalysis'],
            'earnedPoints' => $evaluation['earnedPoints'],
            'totalPoints' => $evaluation['totalPoints'],
            'xpEarned' => $xpEarned,
            'authenticated' => $user !== null,
            'message' => $user ? 'Challenge submitted and progress saved' : 'Challenge tested (login to save progress)'
        ]
    ]);
}

function runChallengeTests($code, $tests) {
    // Simplified test runner - in production, this would use a sandboxed environment
    $results = [];
    
    foreach ($tests as $test) {
        $result = [
            'name' => $test['name'] ?? 'Test',
            'passed' => false,
            'message' => ''
        ];
        
        // Basic HTML/CSS tests
        if (isset($test['type'])) {
            switch ($test['type']) {
                case 'element_exists':
                    $html = $code['html'] ?? '';
                    $element = $test['selector'] ?? '';
                    $result['passed'] = strpos($html, $element) !== false;
                    $result['message'] = $result['passed'] ? 'Element found' : "Element '$element' not found";
                    break;
                    
                case 'css_property':
                    $css = $code['css'] ?? '';
                    $property = $test['property'] ?? '';
                    $result['passed'] = strpos($css, $property) !== false;
                    $result['message'] = $result['passed'] ? 'CSS property found' : "CSS property '$property' not found";
                    break;
                    
                case 'text_content':
                    $html = $code['html'] ?? '';
                    $text = $test['text'] ?? '';
                    $result['passed'] = strpos($html, $text) !== false;
                    $result['message'] = $result['passed'] ? 'Text content found' : "Text '$text' not found";
                    break;
                    
                default:
                    $result['passed'] = true; // Default pass for unknown test types
                    $result['message'] = 'Test type not implemented';
            }
        } else {
            // Default to passing if no test type specified
            $result['passed'] = true;
            $result['message'] = 'No test criteria specified';
        }
        
        $results[] = $result;
    }
    
    return $results;
}

function handleGetChallengeProgress($pdo) {
    $user = getAuthenticatedUser($pdo);
    if (!$user) {
        sendResponse(['error' => 'Authentication required'], 401);
    }

    try {
        $challengeId = $_GET['challenge_id'] ?? '';
        if (!$challengeId) {
            sendResponse(['error' => 'Challenge ID is required'], 400);
        }

        // Get user's latest attempt for this challenge
        $stmt = $pdo->prepare("
            SELECT 
                is_completed,
                tests_passed,
                total_tests,
                xp_earned,
                completed_at,
                COUNT(*) as attempt_count
            FROM user_challenge_attempts 
            WHERE user_id = ? AND challenge_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$user['id'], $challengeId]);
        $progress = $stmt->fetch();

        if ($progress) {
            sendResponse([
                'success' => true,
                'data' => [
                    'is_completed' => (bool)$progress['is_completed'],
                    'tests_passed' => (int)$progress['tests_passed'],
                    'total_tests' => (int)$progress['total_tests'],
                    'xp_earned' => (int)$progress['xp_earned'],
                    'completed_at' => $progress['completed_at'],
                    'attempt_count' => (int)$progress['attempt_count']
                ]
            ]);
        } else {
            sendResponse([
                'success' => true,
                'data' => null
            ]);
        }

    } catch (Exception $e) {
        error_log("Error fetching challenge progress: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch progress'], 500);
    }
}

function handleGetChallengeLeaderboard($pdo) {
    try {
        $challengeId = $_GET['challenge_id'] ?? '';
        $limit = min((int)($_GET['limit'] ?? 10), 50);

        if (!$challengeId) {
            sendResponse(['error' => 'Challenge ID is required'], 400);
        }

        // Get leaderboard for this challenge
        $stmt = $pdo->prepare("
            SELECT 
                u.name as username,
                uca.tests_passed,
                uca.total_tests,
                uca.xp_earned,
                uca.completed_at,
                ROW_NUMBER() OVER (ORDER BY uca.tests_passed DESC, uca.completed_at ASC) as rank
            FROM user_challenge_attempts uca
            JOIN users u ON uca.user_id = u.id
            WHERE uca.challenge_id = ? AND uca.is_completed = TRUE
            ORDER BY uca.tests_passed DESC, uca.completed_at ASC
            LIMIT ?
        ");
        $stmt->execute([$challengeId, $limit]);
        $leaderboard = $stmt->fetchAll();

        sendResponse([
            'success' => true,
            'data' => $leaderboard
        ]);

    } catch (Exception $e) {
        error_log("Error fetching challenge leaderboard: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch leaderboard'], 500);
    }
}
?>