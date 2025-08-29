<?php
/**
 * Lesson Progress API
 * Handles lesson completion and progress tracking
 */

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $pdo = new PDO($dsn, $username, $password, $options);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // Get user ID from session or token
    $userId = getUserId();
    
    switch ($method) {
        case 'POST':
            if (isset($pathParts[2]) && $pathParts[2] === 'complete') {
                // Complete a lesson
                completeLesson($pdo, $userId);
            }
            break;
            
        case 'GET':
            if (isset($pathParts[2]) && $pathParts[2] === 'progress') {
                // Get user progress for a module or path
                getUserProgress($pdo, $userId);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    error_log("Lesson Progress API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function getUserId() {
    // Simple session-based user ID for now
    // In production, this would validate JWT tokens or session data
    if (isset($_SESSION['user_id'])) {
        return $_SESSION['user_id'];
    }
    
    // Check for Authorization header
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        // Parse JWT or session token here
        // For now, return a test user ID
        return 'test-user-id';
    }
    
    return null;
}

function completeLesson($pdo, $userId) {
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $lessonId = $input['lesson_id'] ?? null;
    $moduleId = $input['module_id'] ?? null;
    
    if (!$lessonId) {
        http_response_code(400);
        echo json_encode(['error' => 'Lesson ID is required']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Get lesson details
        $lessonSql = "SELECT * FROM lessons WHERE id = ?";
        $stmt = $pdo->prepare($lessonSql);
        $stmt->execute([$lessonId]);
        $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$lesson) {
            throw new Exception('Lesson not found');
        }
        
        // Check if already completed
        $checkSql = "SELECT id FROM user_lesson_completions WHERE user_id = ? AND lesson_id = ?";
        $stmt = $pdo->prepare($checkSql);
        $stmt->execute([$userId, $lessonId]);
        
        if ($stmt->fetch()) {
            echo json_encode([
                'success' => true,
                'message' => 'Lesson already completed'
            ]);
            $pdo->rollback();
            return;
        }
        
        // Mark lesson as completed
        $completeSql = "
            INSERT INTO user_lesson_completions (id, user_id, lesson_id, xp_earned, completed_at)
            VALUES (UUID(), ?, ?, ?, NOW())
        ";
        $stmt = $pdo->prepare($completeSql);
        $stmt->execute([$userId, $lessonId, $lesson['xp_reward']]);
        
        // Update user total XP
        $updateXpSql = "
            UPDATE user_progress 
            SET total_xp = total_xp + ?,
                updated_at = NOW()
            WHERE user_id = ?
        ";
        $stmt = $pdo->prepare($updateXpSql);
        $stmt->execute([$lesson['xp_reward'], $userId]);
        
        // Update category-specific progress
        $category = $lesson['category'] ?? 'general';
        updateCategoryProgress($pdo, $userId, $category, $lesson['xp_reward']);
        
        // Update learning path progress if applicable
        if ($moduleId) {
            updateModuleProgress($pdo, $userId, $moduleId);
            updateLearningPathProgress($pdo, $userId, $moduleId);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Lesson completed successfully',
            'xp_earned' => $lesson['xp_reward']
        ]);
        
    } catch (Exception $e) {
        $pdo->rollback();
        error_log("Error completing lesson: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to complete lesson']);
    }
}

function updateCategoryProgress($pdo, $userId, $category, $xpEarned) {
    try {
        $categoryColumn = $category . '_xp';
        $lessonsColumn = $category . '_lessons';
        
        // Update category XP and lesson count
        $sql = "
            UPDATE user_progress 
            SET {$categoryColumn} = {$categoryColumn} + ?,
                {$lessonsColumn} = {$lessonsColumn} + 1,
                updated_at = NOW()
            WHERE user_id = ?
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$xpEarned, $userId]);
        
        // Calculate and update category progress percentage
        calculateCategoryProgress($pdo, $userId, $category);
        
    } catch (Exception $e) {
        error_log("Error updating category progress: " . $e->getMessage());
    }
}

function calculateCategoryProgress($pdo, $userId, $category) {
    try {
        // Get total lessons in category
        $totalSql = "SELECT COUNT(*) as total FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.category = ?";
        $stmt = $pdo->prepare($totalSql);
        $stmt->execute([$category]);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        if ($total == 0) return;
        
        // Get completed lessons in category
        $completedSql = "
            SELECT COUNT(*) as completed 
            FROM user_lesson_completions ulc
            JOIN lessons l ON ulc.lesson_id = l.id
            JOIN modules m ON l.module_id = m.id
            WHERE ulc.user_id = ? AND m.category = ?
        ";
        $stmt = $pdo->prepare($completedSql);
        $stmt->execute([$userId, $category]);
        $completed = $stmt->fetch(PDO::FETCH_ASSOC)['completed'];
        
        $progressPercentage = round(($completed / $total) * 100, 2);
        
        // Update progress percentage
        $progressColumn = $category . '_progress';
        $updateSql = "
            UPDATE user_progress 
            SET {$progressColumn} = ?
            WHERE user_id = ?
        ";
        $stmt = $pdo->prepare($updateSql);
        $stmt->execute([$progressPercentage, $userId]);
        
    } catch (Exception $e) {
        error_log("Error calculating category progress: " . $e->getMessage());
    }
}

function updateModuleProgress($pdo, $userId, $moduleId) {
    try {
        // Calculate module completion percentage
        $totalSql = "SELECT COUNT(*) as total FROM lessons WHERE module_id = ?";
        $stmt = $pdo->prepare($totalSql);
        $stmt->execute([$moduleId]);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        if ($total == 0) return;
        
        $completedSql = "
            SELECT COUNT(*) as completed 
            FROM user_lesson_completions ulc
            JOIN lessons l ON ulc.lesson_id = l.id
            WHERE ulc.user_id = ? AND l.module_id = ?
        ";
        $stmt = $pdo->prepare($completedSql);
        $stmt->execute([$userId, $moduleId]);
        $completed = $stmt->fetch(PDO::FETCH_ASSOC)['completed'];
        
        $progressPercentage = round(($completed / $total) * 100, 2);
        $isCompleted = $progressPercentage >= 100;
        
        // Update or insert module progress
        $sql = "
            INSERT INTO user_module_progress (id, user_id, module_id, progress_percentage, is_completed, updated_at)
            VALUES (UUID(), ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            progress_percentage = VALUES(progress_percentage),
            is_completed = VALUES(is_completed),
            updated_at = NOW()
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId, $moduleId, $progressPercentage, $isCompleted]);
        
    } catch (Exception $e) {
        error_log("Error updating module progress: " . $e->getMessage());
    }
}

function updateLearningPathProgress($pdo, $userId, $moduleId) {
    try {
        // Find learning paths that contain this module
        $pathsSql = "
            SELECT DISTINCT lpm.path_id 
            FROM learning_path_modules lpm 
            WHERE lpm.module_id = ?
        ";
        $stmt = $pdo->prepare($pathsSql);
        $stmt->execute([$moduleId]);
        $paths = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($paths as $pathId) {
            // Calculate path progress
            $totalModulesSql = "SELECT COUNT(*) as total FROM learning_path_modules WHERE path_id = ?";
            $stmt = $pdo->prepare($totalModulesSql);
            $stmt->execute([$pathId]);
            $totalModules = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            if ($totalModules == 0) continue;
            
            $completedModulesSql = "
                SELECT COUNT(DISTINCT lpm.module_id) as completed
                FROM learning_path_modules lpm
                JOIN user_module_progress ump ON lpm.module_id = ump.module_id
                WHERE lpm.path_id = ? AND ump.user_id = ? AND ump.is_completed = TRUE
            ";
            $stmt = $pdo->prepare($completedModulesSql);
            $stmt->execute([$pathId, $userId]);
            $completedModules = $stmt->fetch(PDO::FETCH_ASSOC)['completed'];
            
            $progressPercentage = round(($completedModules / $totalModules) * 100, 2);
            $isCompleted = $progressPercentage >= 100;
            
            // Update path progress
            $updatePathSql = "
                INSERT INTO user_learning_path_progress 
                (id, user_id, path_id, progress_percentage, completed_modules, total_modules, updated_at)
                VALUES (UUID(), ?, ?, ?, ?, ?, NOW())
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
            
            $stmt = $pdo->prepare($updatePathSql);
            $stmt->execute([$userId, $pathId, $progressPercentage, $completedModules, $totalModules]);
        }
        
    } catch (Exception $e) {
        error_log("Error updating learning path progress: " . $e->getMessage());
    }
}

function getUserProgress($pdo, $userId) {
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }
    
    try {
        // Get overall user progress
        $progressSql = "SELECT * FROM user_progress WHERE user_id = ?";
        $stmt = $pdo->prepare($progressSql);
        $stmt->execute([$userId]);
        $progress = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get learning path progress
        $pathProgressSql = "
            SELECT lp.slug, lp.title, ulpp.*
            FROM user_learning_path_progress ulpp
            JOIN learning_paths lp ON ulpp.path_id = lp.id
            WHERE ulpp.user_id = ?
        ";
        $stmt = $pdo->prepare($pathProgressSql);
        $stmt->execute([$userId]);
        $pathProgress = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'progress' => $progress,
            'path_progress' => $pathProgress
        ]);
        
    } catch (Exception $e) {
        error_log("Error getting user progress: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get progress']);
    }
}
?>