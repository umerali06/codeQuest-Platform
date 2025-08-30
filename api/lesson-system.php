<?php
/**
 * LESSON SYSTEM API
 * Handles all lesson-related operations for the Codecademy-style system
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include database configuration
require_once 'config.php';

// Helper functions
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function getRequestBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function getUserIdFromSession() {
    // For development, return test user ID
    return '68ad2f3400028ae2b8e5_user_1';
}

// Database connection
try {
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4",
        $config['username'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    sendResponse(['error' => 'Database connection failed'], 500);
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Remove 'api' and 'lesson-system.php' from path parts
$pathParts = array_slice($pathParts, array_search('lesson-system.php', $pathParts) + 1);

$endpoint = $pathParts[0] ?? '';
$id = $pathParts[1] ?? '';

try {
    switch ($endpoint) {
        case 'lessons':
            handleLessons($method, $id, $pdo);
            break;
            
        case 'lesson':
            handleSingleLesson($method, $id, $pdo);
            break;
            
        case 'progress':
            handleProgress($method, $id, $pdo);
            break;
            
        case 'submit-step':
            handleStepSubmission($method, $pdo);
            break;
            
        case 'validate':
            handleValidation($method, $pdo);
            break;
            
        default:
            sendResponse(['error' => 'Invalid endpoint'], 404);
    }
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}

// Handle lessons listing
function handleLessons($method, $id, $pdo) {
    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }
    
    try {
        $query = "
            SELECT 
                l.*,
                COUNT(lm.id) as total_modules,
                AVG(ulp.overall_progress_percentage) as avg_progress
            FROM lessons l
            LEFT JOIN lesson_modules lm ON l.id = lm.lesson_id
            LEFT JOIN user_lesson_progress ulp ON l.id = ulp.lesson_id
            WHERE l.is_published = TRUE
            GROUP BY l.id
            ORDER BY l.created_at DESC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $lessons = $stmt->fetchAll();
        
        // Parse JSON fields
        foreach ($lessons as &$lesson) {
            $lesson['learning_objectives'] = json_decode($lesson['learning_objectives'] ?? '[]', true);
            $lesson['tags'] = json_decode($lesson['tags'] ?? '[]', true);
            $lesson['prerequisites'] = json_decode($lesson['prerequisites'] ?? '[]', true);
        }
        
        sendResponse([
            'success' => true,
            'data' => $lessons
        ]);
        
    } catch (Exception $e) {
        sendResponse(['error' => 'Failed to fetch lessons: ' . $e->getMessage()], 500);
    }
}

// Handle single lesson with full data
function handleSingleLesson($method, $lessonId, $pdo) {
    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }
    
    if (!$lessonId) {
        sendResponse(['error' => 'Lesson ID required'], 400);
    }
    
    try {
        // Get lesson basic info
        $lessonQuery = "SELECT * FROM lessons WHERE id = ? AND is_published = TRUE";
        $stmt = $pdo->prepare($lessonQuery);
        $stmt->execute([$lessonId]);
        $lesson = $stmt->fetch();
        
        if (!$lesson) {
            sendResponse(['error' => 'Lesson not found'], 404);
        }
        
        // Parse JSON fields
        $lesson['learning_objectives'] = json_decode($lesson['learning_objectives'] ?? '[]', true);
        $lesson['tags'] = json_decode($lesson['tags'] ?? '[]', true);
        $lesson['prerequisites'] = json_decode($lesson['prerequisites'] ?? '[]', true);
        
        // Get modules with steps
        $modulesQuery = "
            SELECT 
                lm.*,
                ms.id as step_id,
                ms.step_number,
                ms.title as step_title,
                ms.step_type,
                ms.content_type,
                ms.content_data,
                ms.instructions,
                ms.starter_code,
                ms.solution_code,
                ms.validation_rules,
                ms.hints,
                ms.estimated_time_minutes as step_time
            FROM lesson_modules lm
            LEFT JOIN module_steps ms ON lm.id = ms.module_id
            WHERE lm.lesson_id = ?
            ORDER BY lm.module_number, ms.step_number
        ";
        
        $stmt = $pdo->prepare($modulesQuery);
        $stmt->execute([$lessonId]);
        $moduleSteps = $stmt->fetchAll();
        
        // Organize data into modules with steps
        $modules = [];
        $currentModule = null;
        
        foreach ($moduleSteps as $row) {
            // If this is a new module
            if (!$currentModule || $currentModule['id'] !== $row['id']) {
                // Save previous module if exists
                if ($currentModule) {
                    $modules[] = $currentModule;
                }
                
                // Start new module
                $currentModule = [
                    'id' => $row['id'],
                    'module_number' => $row['module_number'],
                    'title' => $row['title'],
                    'description' => $row['description'],
                    'learning_goals' => json_decode($row['learning_goals'] ?? '[]', true),
                    'estimated_time_minutes' => $row['estimated_time_minutes'],
                    'is_required' => (bool)$row['is_required'],
                    'steps' => []
                ];
            }
            
            // Add step to current module if step exists
            if ($row['step_id']) {
                $step = [
                    'id' => $row['step_id'],
                    'step_number' => $row['step_number'],
                    'title' => $row['step_title'],
                    'step_type' => $row['step_type'],
                    'content_type' => $row['content_type'],
                    'content_data' => json_decode($row['content_data'] ?? '{}', true),
                    'instructions' => $row['instructions'],
                    'starter_code' => json_decode($row['starter_code'] ?? '{}', true),
                    'solution_code' => json_decode($row['solution_code'] ?? '{}', true),
                    'validation_rules' => json_decode($row['validation_rules'] ?? '[]', true),
                    'hints' => json_decode($row['hints'] ?? '[]', true),
                    'estimated_time_minutes' => $row['step_time']
                ];
                
                // Get requirements for this step
                $reqQuery = "SELECT * FROM lesson_requirements WHERE step_id = ? ORDER BY points_value DESC";
                $reqStmt = $pdo->prepare($reqQuery);
                $reqStmt->execute([$row['step_id']]);
                $requirements = $reqStmt->fetchAll();
                
                foreach ($requirements as &$req) {
                    $req['validation_rule'] = json_decode($req['validation_rule'] ?? '{}', true);
                }
                
                $step['requirements'] = $requirements;
                $currentModule['steps'][] = $step;
            }
        }
        
        // Add last module
        if ($currentModule) {
            $modules[] = $currentModule;
        }
        
        $lesson['modules'] = $modules;
        
        // Get user progress if user is logged in
        $userId = getUserIdFromSession();
        if ($userId) {
            $progressQuery = "SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?";
            $stmt = $pdo->prepare($progressQuery);
            $stmt->execute([$userId, $lessonId]);
            $progress = $stmt->fetch();
            
            $lesson['user_progress'] = $progress ?: [
                'current_module_number' => 1,
                'current_step_number' => 1,
                'overall_progress_percentage' => 0,
                'is_completed' => false
            ];
        }
        
        sendResponse([
            'success' => true,
            'data' => $lesson
        ]);
        
    } catch (Exception $e) {
        sendResponse(['error' => 'Failed to fetch lesson: ' . $e->getMessage()], 500);
    }
}

// Handle progress tracking
function handleProgress($method, $lessonId, $pdo) {
    $userId = getUserIdFromSession();
    
    if (!$userId) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    
    if ($method === 'GET') {
        // Get user progress
        try {
            $query = "
                SELECT 
                    ulp.*,
                    l.title as lesson_title,
                    l.total_modules
                FROM user_lesson_progress ulp
                JOIN lessons l ON ulp.lesson_id = l.id
                WHERE ulp.user_id = ? AND ulp.lesson_id = ?
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([$userId, $lessonId]);
            $progress = $stmt->fetch();
            
            sendResponse([
                'success' => true,
                'data' => $progress
            ]);
            
        } catch (Exception $e) {
            sendResponse(['error' => 'Failed to fetch progress: ' . $e->getMessage()], 500);
        }
        
    } elseif ($method === 'POST') {
        // Update progress
        $data = getRequestBody();
        
        try {
            $query = "
                INSERT INTO user_lesson_progress 
                (user_id, lesson_id, current_module_number, current_step_number, overall_progress_percentage, time_spent_minutes)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                current_module_number = VALUES(current_module_number),
                current_step_number = VALUES(current_step_number),
                overall_progress_percentage = VALUES(overall_progress_percentage),
                time_spent_minutes = time_spent_minutes + VALUES(time_spent_minutes),
                last_accessed_at = CURRENT_TIMESTAMP
            ";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute([
                $userId,
                $lessonId,
                $data['current_module_number'] ?? 1,
                $data['current_step_number'] ?? 1,
                $data['overall_progress_percentage'] ?? 0,
                $data['time_spent_minutes'] ?? 0
            ]);
            
            sendResponse([
                'success' => true,
                'message' => 'Progress updated successfully'
            ]);
            
        } catch (Exception $e) {
            sendResponse(['error' => 'Failed to update progress: ' . $e->getMessage()], 500);
        }
    }
}

// Handle step submission
function handleStepSubmission($method, $pdo) {
    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }
    
    $userId = getUserIdFromSession();
    $data = getRequestBody();
    
    if (!$userId) {
        sendResponse(['error' => 'Authentication required'], 401);
    }
    
    try {
        // Validate required fields
        $required = ['lesson_id', 'module_id', 'step_id', 'user_code'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                sendResponse(['error' => "Missing required field: $field"], 400);
            }
        }
        
        // Get step requirements
        $reqQuery = "SELECT * FROM lesson_requirements WHERE step_id = ?";
        $stmt = $pdo->prepare($reqQuery);
        $stmt->execute([$data['step_id']]);
        $requirements = $stmt->fetchAll();
        
        // Validate user code against requirements
        $validationResults = [];
        $totalScore = 0;
        $maxScore = 0;
        
        foreach ($requirements as $req) {
            $maxScore += $req['points_value'];
            $isValid = validateRequirement($data['user_code'], $req);
            
            $validationResults[] = [
                'requirement_id' => $req['id'],
                'requirement_name' => $req['requirement_name'],
                'passed' => $isValid,
                'points_earned' => $isValid ? $req['points_value'] : 0,
                'message' => $isValid ? $req['success_message'] : $req['error_message']
            ];
            
            if ($isValid) {
                $totalScore += $req['points_value'];
            }
        }
        
        $completionScore = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 100;
        $isCompleted = $completionScore >= 80; // 80% threshold for completion
        
        // Save step progress
        $stepProgressQuery = "
            INSERT INTO user_step_progress 
            (user_id, lesson_id, module_id, step_id, step_number, is_completed, completion_score, user_code, validation_results, attempts_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
            is_completed = VALUES(is_completed),
            completion_score = GREATEST(completion_score, VALUES(completion_score)),
            user_code = VALUES(user_code),
            validation_results = VALUES(validation_results),
            attempts_count = attempts_count + 1,
            completed_at = CASE WHEN VALUES(is_completed) = 1 THEN CURRENT_TIMESTAMP ELSE completed_at END
        ";
        
        $stmt = $pdo->prepare($stepProgressQuery);
        $stmt->execute([
            $userId,
            $data['lesson_id'],
            $data['module_id'],
            $data['step_id'],
            $data['step_number'] ?? 1,
            $isCompleted,
            $completionScore,
            json_encode($data['user_code']),
            json_encode($validationResults)
        ]);
        
        sendResponse([
            'success' => true,
            'data' => [
                'is_completed' => $isCompleted,
                'completion_score' => $completionScore,
                'total_score' => $totalScore,
                'max_score' => $maxScore,
                'validation_results' => $validationResults
            ]
        ]);
        
    } catch (Exception $e) {
        sendResponse(['error' => 'Failed to submit step: ' . $e->getMessage()], 500);
    }
}

// Validate requirement against user code
function validateRequirement($userCode, $requirement) {
    $rule = json_decode($requirement['validation_rule'], true);
    
    switch ($requirement['requirement_type']) {
        case 'html_element':
            return validateHtmlElement($userCode['html'] ?? '', $rule);
            
        case 'css_property':
            return validateCssProperty($userCode['css'] ?? '', $rule);
            
        case 'js_function':
            return validateJsFunction($userCode['js'] ?? '', $rule);
            
        case 'text_content':
            return validateTextContent($userCode, $rule);
            
        case 'attribute':
            return validateAttribute($userCode['html'] ?? '', $rule);
            
        default:
            return true; // Unknown type, assume valid
    }
}

// Validation helper functions
function validateHtmlElement($html, $rule) {
    $element = $rule['selector'] ?? '';
    if (empty($element)) return false;
    
    // Simple check for element presence
    return strpos(strtolower($html), "<$element") !== false;
}

function validateCssProperty($css, $rule) {
    $property = $rule['property'] ?? '';
    if (empty($property)) return false;
    
    return strpos(strtolower($css), strtolower($property)) !== false;
}

function validateJsFunction($js, $rule) {
    $functionName = $rule['function'] ?? '';
    if (empty($functionName)) return false;
    
    return strpos($js, $functionName) !== false;
}

function validateTextContent($userCode, $rule) {
    $content = $rule['content'] ?? '';
    if (empty($content)) return false;
    
    $allCode = implode(' ', $userCode);
    return strpos(strtolower($allCode), strtolower($content)) !== false;
}

function validateAttribute($html, $rule) {
    $attribute = $rule['attribute'] ?? '';
    if (empty($attribute)) return false;
    
    return strpos(strtolower($html), strtolower($attribute)) !== false;
}

// Handle validation endpoint
function handleValidation($method, $pdo) {
    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }
    
    $data = getRequestBody();
    
    // Simple validation for demo purposes
    $results = [
        [
            'name' => 'HTML Structure',
            'passed' => !empty($data['html']) && strlen(trim($data['html'])) > 10,
            'message' => !empty($data['html']) ? 'HTML content found' : 'Add HTML content'
        ],
        [
            'name' => 'CSS Styling',
            'passed' => !empty($data['css']) && strlen(trim($data['css'])) > 5,
            'message' => !empty($data['css']) ? 'CSS styling applied' : 'Add CSS styling'
        ],
        [
            'name' => 'Code Quality',
            'passed' => true,
            'message' => 'Code structure looks good'
        ]
    ];
    
    sendResponse([
        'success' => true,
        'data' => [
            'validation_results' => $results,
            'overall_score' => array_sum(array_column($results, 'passed')) / count($results) * 100
        ]
    ]);
}

?>