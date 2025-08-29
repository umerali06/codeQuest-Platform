<?php
/**
 * Learning Paths API
 * Handles learning path data and user progress tracking
 */

// This file is included by api/index.php, so $pdo is already available
// Also $pathParts, $requestMethod are available from the router

$method = $requestMethod;

// Get user ID from session or token
$userId = getUserIdFromSession();

switch ($method) {
    case 'GET':
        if (isset($pathParts[1]) && $pathParts[1] !== '') {
            // Get specific learning path
            getLearningPath($pdo, $pathParts[1], $userId);
        } else {
            // Get all learning paths
            getAllLearningPaths($pdo, $userId);
        }
        break;
        
    case 'POST':
        if (isset($pathParts[1]) && $pathParts[1] === 'enroll') {
            // Enroll user in learning path
            enrollInPath($pdo, $userId);
        } else {
            // Create new learning path (admin only)
            createLearningPath($pdo);
        }
        break;
        
    case 'PUT':
        if (isset($pathParts[1]) && $pathParts[1] === 'progress') {
            // Update user progress
            updatePathProgress($pdo, $userId);
        }
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
        break;
}

function getUserIdFromSession() {
    // For development, return the actual test user ID from database
    // In production, this would validate JWT tokens or session data
    
    // Method 1: Check session
    if (isset($_SESSION['user_id'])) {
        return $_SESSION['user_id'];
    }
    
    // Method 2: Check for Authorization header
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        // Parse JWT or session token here
        // For now, return the test user
        return '68ad2f3400028ae2b8e5_user_1';
    }
    
    // Method 3: For development, return the test user ID
    return '68ad2f3400028ae2b8e5_user_1';
}

function getAllLearningPaths($pdo, $userId) {
    try {
        $sql = "
            SELECT 
                lp.*,
                COALESCE(ulpp.progress_percentage, 0) as user_progress,
                COALESCE(ulpp.completed_modules, 0) as completed_modules,
                COALESCE(ulpp.xp_earned, 0) as xp_earned,
                COALESCE(ulpp.started_at, NULL) as started_at,
                COALESCE(ulpp.completed_at, NULL) as completed_at,
                CASE 
                    WHEN ulpp.completed_at IS NOT NULL THEN 'completed'
                    WHEN ulpp.started_at IS NOT NULL THEN 'in_progress'
                    ELSE 'not_started'
                END as status
            FROM learning_paths lp
            LEFT JOIN user_learning_path_progress ulpp ON lp.id = ulpp.path_id AND ulpp.user_id = ?
            WHERE lp.is_active = TRUE
            ORDER BY lp.order_index ASC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $paths = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate dynamic data for each path
        foreach ($paths as &$path) {
            $pathStats = calculatePathStats($pdo, $path['id'], $userId);
            $path['progress_percentage'] = $pathStats['progress_percentage'];
            $path['completed_modules'] = $pathStats['completed_modules'];
            $path['total_modules'] = $pathStats['total_modules'];
            $path['estimated_hours'] = $pathStats['estimated_hours'];
            $path['user_progress'] = $pathStats['progress_percentage'];
        }
        
        sendResponse([
            'success' => true,
            'paths' => $paths
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching learning paths: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch learning paths'], 500);
    }
}

function getLearningPath($pdo, $pathIdentifier, $userId) {
    try {
        // Check if identifier is UUID (contains hyphens) or slug
        $isUuid = strpos($pathIdentifier, '-') !== false;
        
        $sql = "
            SELECT 
                lp.*,
                COALESCE(ulpp.progress_percentage, 0) as user_progress,
                COALESCE(ulpp.completed_modules, 0) as completed_modules,
                COALESCE(ulpp.xp_earned, 0) as xp_earned,
                COALESCE(ulpp.started_at, NULL) as started_at,
                COALESCE(ulpp.completed_at, NULL) as completed_at,
                CASE 
                    WHEN ulpp.completed_at IS NOT NULL THEN 'completed'
                    WHEN ulpp.started_at IS NOT NULL THEN 'in_progress'
                    ELSE 'not_started'
                END as status
            FROM learning_paths lp
            LEFT JOIN user_learning_path_progress ulpp ON lp.id = ulpp.path_id AND ulpp.user_id = ?
            WHERE " . ($isUuid ? "lp.id = ?" : "lp.slug = ?") . " AND lp.is_active = TRUE
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId, $pathIdentifier]);
        $path = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$path) {
            sendResponse(['error' => 'Learning path not found'], 404);
            return;
        }
        
        // Get modules in this path
        $modulesSql = "
            SELECT 
                m.*,
                lpm.order_index as path_order,
                lpm.is_required,
                CASE 
                    WHEN ulc.lesson_id IS NOT NULL THEN TRUE
                    ELSE FALSE
                END as is_completed
            FROM learning_path_modules lpm
            JOIN modules m ON lpm.module_id = m.id
            LEFT JOIN user_lesson_completions ulc ON m.id = ulc.lesson_id AND ulc.user_id = ?
            WHERE lpm.path_id = ?
            ORDER BY lpm.order_index ASC
        ";
        
        $stmt = $pdo->prepare($modulesSql);
        $stmt->execute([$userId, $path['id']]);
        $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $path['modules'] = $modules;
        
        // Calculate dynamic progress
        $pathProgress = calculatePathProgress($pdo, $path['id'], $userId);
        $path['progress_percentage'] = $pathProgress['progress_percentage'];
        $path['completed_modules'] = $pathProgress['completed_modules'];
        $path['total_modules'] = $pathProgress['total_modules'];
        
        sendResponse([
            'success' => true,
            'path' => $path
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching learning path: " . $e->getMessage());
        sendResponse(['error' => 'Failed to fetch learning path'], 500);
    }
}

function calculatePathStats($pdo, $pathId, $userId) {
    try {
        // Get modules and lessons in this path with their stats
        $statsSql = "
            SELECT 
                COUNT(DISTINCT lpm.module_id) as total_modules,
                COUNT(DISTINCT l.id) as total_lessons,
                SUM(DISTINCT l.duration_minutes) as total_duration_minutes,
                COUNT(DISTINCT ulc.lesson_id) as completed_lessons,
                COUNT(DISTINCT CASE WHEN ulc.lesson_id IS NOT NULL THEN lpm.module_id END) as completed_modules
            FROM learning_path_modules lpm
            LEFT JOIN lessons l ON l.module_id = lpm.module_id AND l.is_active = TRUE
            LEFT JOIN user_lesson_completions ulc ON l.id = ulc.lesson_id AND ulc.user_id = ?
            WHERE lpm.path_id = ?
        ";
        
        $stmt = $pdo->prepare($statsSql);
        $stmt->execute([$userId, $pathId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $totalModules = (int)$stats['total_modules'];
        $completedModules = (int)$stats['completed_modules'];
        $totalLessons = (int)$stats['total_lessons'];
        $completedLessons = (int)$stats['completed_lessons'];
        $totalDurationMinutes = (int)$stats['total_duration_minutes'];
        
        // Calculate progress percentage based on lessons completed
        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0;
        
        // Convert minutes to hours (rounded up)
        $estimatedHours = $totalDurationMinutes > 0 ? ceil($totalDurationMinutes / 60) : 0;
        
        return [
            'progress_percentage' => $progressPercentage,
            'completed_modules' => $completedModules,
            'total_modules' => $totalModules,
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'estimated_hours' => $estimatedHours
        ];
        
    } catch (Exception $e) {
        error_log("Error calculating path stats: " . $e->getMessage());
        return [
            'progress_percentage' => 0,
            'completed_modules' => 0,
            'total_modules' => 0,
            'completed_lessons' => 0,
            'total_lessons' => 0,
            'estimated_hours' => 0
        ];
    }
}

function calculatePathProgress($pdo, $pathId, $userId) {
    $stats = calculatePathStats($pdo, $pathId, $userId);
    return [
        'progress_percentage' => $stats['progress_percentage'],
        'completed_modules' => $stats['completed_modules'],
        'total_modules' => $stats['total_modules']
    ];
}

function enrollInPath($pdo, $userId) {
    if (!$userId) {
        sendResponse(['error' => 'Authentication required'], 401);
        return;
    }
    
    $input = getRequestBody();
    $pathId = $input['path_id'] ?? null;
    
    if (!$pathId) {
        sendResponse(['error' => 'Path ID is required'], 400);
        return;
    }
    
    try {
        // Check if already enrolled
        $checkSql = "SELECT id FROM user_learning_path_progress WHERE user_id = ? AND path_id = ?";
        $stmt = $pdo->prepare($checkSql);
        $stmt->execute([$userId, $pathId]);
        
        if ($stmt->fetch()) {
            sendResponse([
                'success' => true,
                'message' => 'Already enrolled in this path'
            ]);
            return;
        }
        
        // Get path info
        $pathSql = "SELECT total_modules FROM learning_paths WHERE id = ?";
        $stmt = $pdo->prepare($pathSql);
        $stmt->execute([$pathId]);
        $path = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$path) {
            sendResponse(['error' => 'Learning path not found'], 404);
            return;
        }
        
        // Generate UUID
        $uuid = generateUuid();
        
        // Enroll user
        $enrollSql = "
            INSERT INTO user_learning_path_progress 
            (id, user_id, path_id, total_modules, started_at) 
            VALUES (?, ?, ?, ?, NOW())
        ";
        
        $stmt = $pdo->prepare($enrollSql);
        $stmt->execute([$uuid, $userId, $pathId, $path['total_modules']]);
        
        sendResponse([
            'success' => true,
            'message' => 'Successfully enrolled in learning path'
        ]);
        
    } catch (Exception $e) {
        error_log("Error enrolling in path: " . $e->getMessage());
        sendResponse(['error' => 'Failed to enroll in learning path'], 500);
    }
}

function updatePathProgress($pdo, $userId) {
    if (!$userId) {
        sendResponse(['error' => 'Authentication required'], 401);
        return;
    }
    
    $input = getRequestBody();
    $pathId = $input['path_id'] ?? null;
    
    if (!$pathId) {
        sendResponse(['error' => 'Path ID is required'], 400);
        return;
    }
    
    try {
        // Calculate current progress
        $progress = calculatePathProgress($pdo, $pathId, $userId);
        
        // Generate UUID
        $uuid = generateUuid();
        
        // Update or insert progress record
        $sql = "
            INSERT INTO user_learning_path_progress 
            (id, user_id, path_id, progress_percentage, completed_modules, total_modules, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            progress_percentage = VALUES(progress_percentage),
            completed_modules = VALUES(completed_modules),
            total_modules = VALUES(total_modules),
            updated_at = NOW(),
            completed_at = CASE 
                WHEN VALUES(progress_percentage) >= 100 AND completed_at IS NULL THEN NOW()
                WHEN VALUES(progress_percentage) < 100 THEN NULL
                ELSE completed_at
            END
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $uuid,
            $userId, 
            $pathId, 
            $progress['progress_percentage'],
            $progress['completed_modules'],
            $progress['total_modules']
        ]);
        
        sendResponse([
            'success' => true,
            'progress' => $progress
        ]);
        
    } catch (Exception $e) {
        error_log("Error updating path progress: " . $e->getMessage());
        sendResponse(['error' => 'Failed to update progress'], 500);
    }
}

function createLearningPath($pdo) {
    // Admin only functionality - implement as needed
    sendResponse(['error' => 'Not implemented'], 501);
}



// Helper functions for request handling
if (!function_exists('getRequestBody')) {
    function getRequestBody() {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?: [];
    }
}

if (!function_exists('sendResponse')) {
    function sendResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
?>