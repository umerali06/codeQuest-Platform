<?php
/**
 * Challenges API endpoints
 */

$challengeSlug = $pathParts[1] ?? '';

switch ($requestMethod) {
    case 'GET':
        if ($challengeSlug) {
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
    
    sendResponse([
        'success' => true,
        'data' => [
            'id' => $challenge['id'],
            'slug' => $challenge['slug'],
            'title' => $challenge['title'],
            'description' => $challenge['description'],
            'instructions' => $challenge['instructions'],
            'starterCode' => json_decode($challenge['starter_code'] ?? '{}', true),
            'tests' => json_decode($challenge['tests'] ?? '[]', true),
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
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
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
    
    // Run tests (simplified for now)
    $tests = json_decode($challenge['tests'] ?? '[]', true);
    $testResults = runChallengeTests($code, $tests);
    
    $testsPassed = count(array_filter($testResults, function($result) {
        return $result['passed'];
    }));
    $totalTests = count($tests);
    $isCompleted = $testsPassed === $totalTests && $totalTests > 0;
    
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
        }
        
        $pdo->commit();
        
        sendResponse([
            'success' => true,
            'data' => [
                'isCompleted' => $isCompleted,
                'testsPassed' => $testsPassed,
                'totalTests' => $totalTests,
                'testResults' => $testResults,
                'xpEarned' => $isCompleted && !$existingAttempt ? (int)$challenge['xp_reward'] : 0
            ]
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(['error' => 'Failed to submit challenge'], 500);
    }
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
?>