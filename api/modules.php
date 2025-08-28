<?php
/**
 * Modules API endpoints
 */

$moduleSlug = $pathParts[1] ?? '';

switch ($requestMethod) {
    case 'GET':
        if ($moduleSlug) {
            handleGetModule($pdo, $moduleSlug);
        } else {
            handleGetModules($pdo);
        }
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}

function handleGetModules($pdo) {
    try {
        $sql = "
            SELECT 
                m.*,
                COUNT(l.id) as lesson_count,
                COUNT(CASE WHEN l.difficulty = 'easy' THEN 1 END) as easy_lessons,
                COUNT(CASE WHEN l.difficulty = 'medium' THEN 1 END) as medium_lessons,
                COUNT(CASE WHEN l.difficulty = 'hard' THEN 1 END) as hard_lessons,
                COALESCE(SUM(l.xp_reward), 0) as total_xp
            FROM modules m
            LEFT JOIN lessons l ON m.id = l.module_id AND l.is_active = TRUE
            WHERE m.is_active = TRUE
            GROUP BY m.id
            ORDER BY m.order_index, m.created_at
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $modules = $stmt->fetchAll();
        
        // Get user progress if authenticated
        $user = getAuthenticatedUser($pdo);
        $userProgress = [];
        
        if ($user) {
            $progressSql = "
                SELECT 
                    m.id as module_id,
                    COUNT(ulc.id) as completed_lessons,
                    COALESCE(SUM(ulc.xp_earned), 0) as earned_xp
                FROM modules m
                LEFT JOIN lessons l ON m.id = l.module_id AND l.is_active = TRUE
                LEFT JOIN user_lesson_completions ulc ON l.id = ulc.lesson_id AND ulc.user_id = ?
                WHERE m.is_active = TRUE
                GROUP BY m.id
            ";
            
            $progressStmt = $pdo->prepare($progressSql);
            $progressStmt->execute([$user['id']]);
            $progressData = $progressStmt->fetchAll();
            
            foreach ($progressData as $progress) {
                $userProgress[$progress['module_id']] = [
                    'completed_lessons' => (int)$progress['completed_lessons'],
                    'earned_xp' => (int)$progress['earned_xp']
                ];
            }
        }
        
        // Format modules for response
        $formattedModules = [];
        foreach ($modules as $module) {
            $moduleId = $module['id'];
            $lessonCount = (int)$module['lesson_count'];
            $completedLessons = $userProgress[$moduleId]['completed_lessons'] ?? 0;
            $earnedXp = $userProgress[$moduleId]['earned_xp'] ?? 0;
            
            $progressPercentage = $lessonCount > 0 ? round(($completedLessons / $lessonCount) * 100, 1) : 0;
            
            $formattedModules[] = [
                'id' => $moduleId,
                'slug' => $module['slug'],
                'title' => $module['title'],
                'description' => $module['description'],
                'category' => $module['category'],
                'icon' => $module['icon'],
                'color' => $module['color'],
                'difficulty' => $module['difficulty'],
                'estimated_hours' => (int)$module['estimated_hours'],
                'lesson_count' => $lessonCount,
                'total_xp' => (int)$module['total_xp'],
                'difficulty_breakdown' => [
                    'easy' => (int)$module['easy_lessons'],
                    'medium' => (int)$module['medium_lessons'],
                    'hard' => (int)$module['hard_lessons']
                ],
                'user_progress' => [
                    'completed_lessons' => $completedLessons,
                    'earned_xp' => $earnedXp,
                    'progress_percentage' => $progressPercentage,
                    'is_started' => $completedLessons > 0,
                    'is_completed' => $completedLessons >= $lessonCount && $lessonCount > 0
                ]
            ];
        }
        
        sendResponse([
            'success' => true,
            'modules' => $formattedModules,
            'total_modules' => count($formattedModules),
            'user_authenticated' => $user !== null
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching modules: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch modules'], 500);
    }
}

function handleGetModule($pdo, $moduleSlug) {
    try {
        // Get module details
        $moduleStmt = $pdo->prepare("
            SELECT * FROM modules 
            WHERE slug = ? AND is_active = TRUE
        ");
        $moduleStmt->execute([$moduleSlug]);
        $module = $moduleStmt->fetch();
        
        if (!$module) {
            sendResponse(['error' => 'Module not found'], 404);
        }
        
        // Get lessons for this module
        $lessonsStmt = $pdo->prepare("
            SELECT 
                l.*,
                CASE 
                    WHEN ulc.id IS NOT NULL THEN TRUE 
                    ELSE FALSE 
                END as is_completed,
                ulc.completed_at,
                ulc.xp_earned as earned_xp
            FROM lessons l
            LEFT JOIN user_lesson_completions ulc ON l.id = ulc.lesson_id 
                AND ulc.user_id = ?
            WHERE l.module_id = ? AND l.is_active = TRUE
            ORDER BY l.order_index, l.created_at
        ");
        
        $user = getAuthenticatedUser($pdo);
        $userId = $user ? $user['id'] : null;
        
        $lessonsStmt->execute([$userId, $module['id']]);
        $lessons = $lessonsStmt->fetchAll();
        
        // Format lessons
        $formattedLessons = [];
        $totalLessons = count($lessons);
        $completedLessons = 0;
        $totalXp = 0;
        $earnedXp = 0;
        
        foreach ($lessons as $lesson) {
            $isCompleted = (bool)$lesson['is_completed'];
            if ($isCompleted) {
                $completedLessons++;
                $earnedXp += (int)$lesson['earned_xp'];
            }
            $totalXp += (int)$lesson['xp_reward'];
            
            $formattedLessons[] = [
                'id' => $lesson['id'],
                'slug' => $lesson['slug'],
                'title' => $lesson['title'],
                'description' => $lesson['description'],
                'difficulty' => $lesson['difficulty'],
                'duration_minutes' => (int)$lesson['duration_minutes'],
                'xp_reward' => (int)$lesson['xp_reward'],
                'order_index' => (int)$lesson['order_index'],
                'learning_objectives' => json_decode($lesson['learning_objectives'] ?? '[]', true),
                'is_completed' => $isCompleted,
                'completed_at' => $lesson['completed_at'],
                'earned_xp' => $isCompleted ? (int)$lesson['earned_xp'] : 0,
                'is_locked' => false // TODO: Implement prerequisite logic
            ];
        }
        
        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 1) : 0;
        
        sendResponse([
            'success' => true,
            'module' => [
                'id' => $module['id'],
                'slug' => $module['slug'],
                'title' => $module['title'],
                'description' => $module['description'],
                'category' => $module['category'],
                'icon' => $module['icon'],
                'color' => $module['color'],
                'difficulty' => $module['difficulty'],
                'estimated_hours' => (int)$module['estimated_hours'],
                'lessons' => $formattedLessons,
                'stats' => [
                    'total_lessons' => $totalLessons,
                    'completed_lessons' => $completedLessons,
                    'total_xp' => $totalXp,
                    'earned_xp' => $earnedXp,
                    'progress_percentage' => $progressPercentage,
                    'is_started' => $completedLessons > 0,
                    'is_completed' => $completedLessons >= $totalLessons && $totalLessons > 0
                ]
            ],
            'user_authenticated' => $user !== null
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching module: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch module'], 500);
    }
}
?>