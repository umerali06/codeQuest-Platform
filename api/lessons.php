<?php
/**
 * Enhanced Lessons API endpoints
 */

$lessonSlug = $pathParts[1] ?? '';

switch ($requestMethod) {
    case 'GET':
        if ($lessonSlug) {
            handleGetLesson($pdo, $lessonSlug);
        } else {
            handleGetLessons($pdo);
        }
        break;
        
    case 'POST':
        if ($lessonSlug === 'complete') {
            handleCompleteLesson($pdo);
        } elseif ($lessonSlug === 'progress') {
            handleUpdateProgress($pdo);
        } else {
            sendResponse(['error' => 'Invalid action'], 400);
        }
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleGetLessons($pdo) {
    try {
        $moduleSlug = $_GET['module'] ?? '';
        $user = getAuthenticatedUser($pdo);
        
        $sql = "
            SELECT 
                l.*,
                m.category, 
                m.title as module_title,
                m.slug as module_slug,
                m.icon as module_icon,
                m.color as module_color,
                CASE 
                    WHEN ulc.id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END as is_completed,
                ulc.completed_at,
                ulc.xp_earned as earned_xp
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            LEFT JOIN user_lesson_completions ulc ON l.id = ulc.lesson_id 
                AND ulc.user_id = ?
            WHERE l.is_active = TRUE
        ";
        
        $params = [$user ? $user['id'] : null];
        
        if ($moduleSlug) {
            $sql .= " AND m.slug = ?";
            $params[] = $moduleSlug;
        }
        
        $sql .= " ORDER BY m.order_index, l.order_index";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $lessons = $stmt->fetchAll();
        
        // Group by module
        $groupedLessons = [];
        foreach ($lessons as $lesson) {
            $moduleSlug = $lesson['module_slug'];
            if (!isset($groupedLessons[$moduleSlug])) {
                $groupedLessons[$moduleSlug] = [
                    'module_info' => [
                        'slug' => $lesson['module_slug'],
                        'title' => $lesson['module_title'],
                        'category' => $lesson['category'],
                        'icon' => $lesson['module_icon'],
                        'color' => $lesson['module_color']
                    ],
                    'lessons' => []
                ];
            }
            
            $isCompleted = (bool)$lesson['is_completed'];
            $groupedLessons[$moduleSlug]['lessons'][] = [
                'id' => $lesson['id'],
                'slug' => $lesson['slug'],
                'title' => $lesson['title'],
                'description' => $lesson['description'],
                'difficulty' => $lesson['difficulty'],
                'duration_minutes' => (int)$lesson['duration_minutes'],
                'xp_reward' => (int)$lesson['xp_reward'],
                'order_index' => (int)$lesson['order_index'],
                'learning_objectives' => json_decode($lesson['learning_objectives'] ?? '[]', true),
                'prerequisites' => json_decode($lesson['prerequisites'] ?? '[]', true),
                'is_completed' => $isCompleted,
                'completed_at' => $lesson['completed_at'],
                'earned_xp' => $isCompleted ? (int)$lesson['earned_xp'] : 0
            ];
        }
        
        sendResponse([
            'success' => true,
            'lessons' => $groupedLessons,
            'user_authenticated' => $user !== null
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching lessons: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch lessons'], 500);
    }
}

function handleGetLesson($pdo, $lessonSlug) {
    try {
        $user = getAuthenticatedUser($pdo);
        
        $stmt = $pdo->prepare("
            SELECT 
                l.*,
                m.category, 
                m.title as module_title,
                m.slug as module_slug,
                m.icon as module_icon,
                m.color as module_color,
                CASE 
                    WHEN ulc.id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END as is_completed,
                ulc.completed_at,
                ulc.xp_earned as earned_xp
            FROM lessons l
            JOIN modules m ON l.module_id = m.id
            LEFT JOIN user_lesson_completions ulc ON l.id = ulc.lesson_id 
                AND ulc.user_id = ?
            WHERE l.slug = ? AND l.is_active = TRUE
        ");
        $stmt->execute([$user ? $user['id'] : null, $lessonSlug]);
        $lesson = $stmt->fetch();
        
        if (!$lesson) {
            sendResponse(['error' => 'Lesson not found'], 404);
        }
        
        // Get related challenges for this lesson
        $challengesStmt = $pdo->prepare("
            SELECT 
                c.*,
                CASE 
                    WHEN uca.is_completed = TRUE THEN TRUE 
                    ELSE FALSE 
                END as is_completed,
                uca.xp_earned as earned_xp,
                uca.completed_at
            FROM challenges c
            LEFT JOIN user_challenge_attempts uca ON c.id = uca.challenge_id 
                AND uca.user_id = ? AND uca.is_completed = TRUE
            WHERE c.category = ? AND c.is_active = TRUE
            ORDER BY c.difficulty, c.created_at
            LIMIT 3
        ");
        $challengesStmt->execute([$user ? $user['id'] : null, $lesson['category']]);
        $challenges = $challengesStmt->fetchAll();
        
        $formattedChallenges = [];
        foreach ($challenges as $challenge) {
            $isCompleted = (bool)$challenge['is_completed'];
            $formattedChallenges[] = [
                'id' => $challenge['id'],
                'slug' => $challenge['slug'],
                'title' => $challenge['title'],
                'description' => $challenge['description'],
                'difficulty' => $challenge['difficulty'],
                'xp_reward' => (int)$challenge['xp_reward'],
                'is_completed' => $isCompleted,
                'earned_xp' => $isCompleted ? (int)$challenge['earned_xp'] : 0
            ];
        }
        
        $isCompleted = (bool)$lesson['is_completed'];
        
        sendResponse([
            'success' => true,
            'lesson' => [
                'id' => $lesson['id'],
                'slug' => $lesson['slug'],
                'title' => $lesson['title'],
                'description' => $lesson['description'],
                'content_md' => $lesson['content_md'],
                'starter_code' => json_decode($lesson['starter_code'] ?? '{}', true),
                'test_spec_json' => json_decode($lesson['test_spec_json'] ?? '{}', true),
                'solution_code' => json_decode($lesson['solution_code'] ?? '{}', true),
                'difficulty' => $lesson['difficulty'],
                'duration_minutes' => (int)$lesson['duration_minutes'],
                'xp_reward' => (int)$lesson['xp_reward'],
                'learning_objectives' => json_decode($lesson['learning_objectives'] ?? '[]', true),
                'prerequisites' => json_decode($lesson['prerequisites'] ?? '[]', true),
                'module' => [
                    'slug' => $lesson['module_slug'],
                    'title' => $lesson['module_title'],
                    'category' => $lesson['category'],
                    'icon' => $lesson['module_icon'],
                    'color' => $lesson['module_color']
                ],
                'is_completed' => $isCompleted,
                'completed_at' => $lesson['completed_at'],
                'earned_xp' => $isCompleted ? (int)$lesson['earned_xp'] : 0,
                'challenges' => $formattedChallenges
            ],
            'user_authenticated' => $user !== null
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching lesson: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch lesson'], 500);
    }
}

function handleCompleteLesson($pdo) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    $data = getRequestBody();
    validateRequired($data, ['lessonSlug']);
    
    $lessonSlug = $data['lessonSlug'];
    
    try {
        // Get lesson details
        $stmt = $pdo->prepare("SELECT * FROM lessons WHERE slug = ? AND is_active = TRUE");
        $stmt->execute([$lessonSlug]);
        $lesson = $stmt->fetch();
        
        if (!$lesson) {
            sendResponse(['error' => 'Lesson not found'], 404);
        }
        
        // Check if already completed
        $stmt = $pdo->prepare("
            SELECT id FROM user_lesson_completions 
            WHERE user_id = ? AND lesson_id = ?
        ");
        $stmt->execute([$user['id'], $lesson['id']]);
        
        if ($stmt->fetch()) {
            sendResponse(['error' => 'Lesson already completed'], 409);
        }
        
        $pdo->beginTransaction();
        
        // Record completion
        $completionId = generateUuid();
        $stmt = $pdo->prepare("
            INSERT INTO user_lesson_completions (id, user_id, lesson_id, xp_earned) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$completionId, $user['id'], $lesson['id'], $lesson['xp_reward']]);
        
        // Update user progress
        $stmt = $pdo->prepare("
            UPDATE user_progress 
            SET total_xp = total_xp + ?, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = ?
        ");
        $stmt->execute([$lesson['xp_reward'], $user['id']]);
        
        // Update user statistics
        updateUserStatistics($pdo, $user['id'], $lesson);
        
        // Check for achievements
        $newAchievements = checkAchievements($pdo, $user['id']);
        
        // Update user level
        $newLevel = updateUserLevel($pdo, $user['id']);
        
        $pdo->commit();
        
        sendResponse([
            'success' => true,
            'message' => 'Lesson completed successfully!',
            'xp_earned' => (int)$lesson['xp_reward'],
            'new_achievements' => $newAchievements,
            'level_up' => $newLevel['level_up'],
            'current_level' => $newLevel['current_level']
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Error completing lesson: " . $e->getMessage());
        sendResponse(['error' => 'Failed to complete lesson'], 500);
    }
}

function handleUpdateProgress($pdo) {
    $user = getAuthenticatedUser($pdo);
    
    if (!$user) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    
    $data = getRequestBody();
    validateRequired($data, ['lessonSlug', 'timeSpent']);
    
    // This could be used to track lesson progress/time spent
    // For now, just acknowledge the request
    sendResponse([
        'success' => true,
        'message' => 'Progress updated'
    ]);
}

function updateUserStatistics($pdo, $userId, $lesson) {
    // Get module category
    $stmt = $pdo->prepare("
        SELECT category FROM modules WHERE id = ?
    ");
    $stmt->execute([$lesson['module_id']]);
    $module = $stmt->fetch();
    
    if (!$module) return;
    
    $category = $module['category'];
    
    // Update statistics
    $stmt = $pdo->prepare("
        INSERT INTO user_statistics (user_id, {$category}_xp, {$category}_lessons, updated_at) 
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE 
            {$category}_xp = {$category}_xp + ?, 
            {$category}_lessons = {$category}_lessons + 1,
            updated_at = CURRENT_TIMESTAMP
    ");
    $stmt->execute([$userId, $lesson['xp_reward'], $lesson['xp_reward']]);
    
    // Calculate progress percentage
    $totalLessonsStmt = $pdo->prepare("
        SELECT COUNT(*) as total FROM lessons l 
        JOIN modules m ON l.module_id = m.id 
        WHERE m.category = ? AND l.is_active = TRUE
    ");
    $totalLessonsStmt->execute([$category]);
    $totalLessons = $totalLessonsStmt->fetchColumn();
    
    $completedLessonsStmt = $pdo->prepare("
        SELECT COUNT(*) as completed FROM user_lesson_completions ulc
        JOIN lessons l ON ulc.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        WHERE ulc.user_id = ? AND m.category = ?
    ");
    $completedLessonsStmt->execute([$userId, $category]);
    $completedLessons = $completedLessonsStmt->fetchColumn();
    
    $progressPercentage = $totalLessons > 0 ? ($completedLessons / $totalLessons) * 100 : 0;
    
    $stmt = $pdo->prepare("
        UPDATE user_statistics 
        SET {$category}_progress = ? 
        WHERE user_id = ?
    ");
    $stmt->execute([$progressPercentage, $userId]);
}

function updateUserLevel($pdo, $userId) {
    // Get current XP
    $stmt = $pdo->prepare("SELECT total_xp, level FROM user_progress WHERE user_id = ?");
    $stmt->execute([$userId]);
    $progress = $stmt->fetch();
    
    if (!$progress) return ['level_up' => false, 'current_level' => 1];
    
    $currentXp = $progress['total_xp'];
    $currentLevel = $progress['level'];
    
    // Calculate new level (simple formula: level = floor(sqrt(xp/100)) + 1)
    $newLevel = floor(sqrt($currentXp / 100)) + 1;
    
    $levelUp = false;
    if ($newLevel > $currentLevel) {
        $levelUp = true;
        
        // Update level and title
        $levelTitles = [
            1 => 'Beginner',
            5 => 'Novice',
            10 => 'Apprentice',
            15 => 'Intermediate',
            20 => 'Advanced',
            25 => 'Expert',
            30 => 'Master',
            40 => 'Grandmaster',
            50 => 'Legend'
        ];
        
        $levelTitle = 'Legend';
        foreach ($levelTitles as $level => $title) {
            if ($newLevel >= $level) {
                $levelTitle = $title;
            }
        }
        
        $stmt = $pdo->prepare("
            UPDATE user_progress 
            SET level = ?, level_title = ? 
            WHERE user_id = ?
        ");
        $stmt->execute([$newLevel, $levelTitle, $userId]);
    }
    
    return [
        'level_up' => $levelUp,
        'current_level' => $newLevel,
        'previous_level' => $currentLevel
    ];
}

function checkAchievements($pdo, $userId) {
    // Get user stats
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(DISTINCT ulc.id) as total_lessons,
            COUNT(DISTINCT uca.id) as total_challenges,
            up.streak,
            up.total_xp,
            up.level
        FROM user_progress up
        LEFT JOIN user_lesson_completions ulc ON up.user_id = ulc.user_id
        LEFT JOIN user_challenge_attempts uca ON up.user_id = uca.user_id AND uca.is_completed = TRUE
        WHERE up.user_id = ?
        GROUP BY up.user_id
    ");
    $stmt->execute([$userId]);
    $stats = $stmt->fetch();
    
    if (!$stats) return [];
    
    $achievements = [];
    
    // Define achievements
    $achievementRules = [
        'first-steps' => ['lessons' => 1, 'name' => 'First Steps', 'description' => 'Complete your first lesson'],
        'getting-started' => ['lessons' => 5, 'name' => 'Getting Started', 'description' => 'Complete 5 lessons'],
        'dedicated-learner' => ['lessons' => 10, 'name' => 'Dedicated Learner', 'description' => 'Complete 10 lessons'],
        'knowledge-seeker' => ['xp' => 500, 'name' => 'Knowledge Seeker', 'description' => 'Earn 500 XP'],
        'rising-star' => ['xp' => 1000, 'name' => 'Rising Star', 'description' => 'Earn 1000 XP'],
        'coding-master' => ['xp' => 2500, 'name' => 'Coding Master', 'description' => 'Earn 2500 XP'],
        'challenger' => ['challenges' => 5, 'name' => 'Challenger', 'description' => 'Complete 5 challenges'],
        'week-warrior' => ['streak' => 7, 'name' => 'Week Warrior', 'description' => 'Maintain a 7-day streak'],
        'level-up' => ['level' => 5, 'name' => 'Level Up', 'description' => 'Reach level 5'],
        'advanced-coder' => ['level' => 10, 'name' => 'Advanced Coder', 'description' => 'Reach level 10']
    ];
    
    $newAchievements = [];
    
    foreach ($achievementRules as $achievementId => $rule) {
        // Check if user meets criteria
        $meetsRequirement = false;
        
        if (isset($rule['lessons']) && $stats['total_lessons'] >= $rule['lessons']) {
            $meetsRequirement = true;
        } elseif (isset($rule['challenges']) && $stats['total_challenges'] >= $rule['challenges']) {
            $meetsRequirement = true;
        } elseif (isset($rule['xp']) && $stats['total_xp'] >= $rule['xp']) {
            $meetsRequirement = true;
        } elseif (isset($rule['streak']) && $stats['streak'] >= $rule['streak']) {
            $meetsRequirement = true;
        } elseif (isset($rule['level']) && $stats['level'] >= $rule['level']) {
            $meetsRequirement = true;
        }
        
        if ($meetsRequirement) {
            // Check if already awarded
            $checkStmt = $pdo->prepare("
                SELECT id FROM user_achievements 
                WHERE user_id = ? AND achievement_id = ?
            ");
            $checkStmt->execute([$userId, $achievementId]);
            
            if (!$checkStmt->fetch()) {
                // Award achievement
                $stmt = $pdo->prepare("
                    INSERT INTO user_achievements (id, user_id, achievement_id) 
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([generateUuid(), $userId, $achievementId]);
                
                $newAchievements[] = [
                    'id' => $achievementId,
                    'name' => $rule['name'],
                    'description' => $rule['description']
                ];
            }
        }
    }
    
    return $newAchievements;
}
?>