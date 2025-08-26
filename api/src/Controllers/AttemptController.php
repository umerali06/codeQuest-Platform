<?php

namespace CodeQuest\Controllers;

use CodeQuest\Core\Database;
use CodeQuest\Core\Logger;
use CodeQuest\Core\Auth;
use Exception;

class AttemptController
{
    private $database;
    private $logger;
    private $auth;

    public function __construct()
    {
        $this->database = Database::getInstance();
        $this->logger = new Logger();
        $this->auth = new Auth();
    }

    public function submitAttempt($params = [])
    {
        try {
            // Require authentication
            $appwriteUser = $this->auth->requireAuth();
            
            // Get request body
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Invalid JSON data'
                ]);
                return;
            }

            // Validate required fields
            $requiredFields = ['challenge_id', 'submitted_code'];
            foreach ($requiredFields as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode([
                        'error' => 'Bad Request',
                        'message' => "Field '{$field}' is required"
                    ]);
                    return;
                }
            }

            // Get local user ID
            $localUser = $this->database->fetch(
                'SELECT id FROM users WHERE appwrite_id = ?',
                [$appwriteUser['$id']]
            );

            if (!$localUser) {
                http_response_code(404);
                echo json_encode([
                    'error' => 'User not found',
                    'message' => 'User profile not found in local database'
                ]);
                return;
            }

            // Validate challenge exists
            $challenge = $this->database->fetch(
                'SELECT * FROM challenges WHERE id = ? AND is_active = 1',
                [$input['challenge_id']]
            );

            if (!$challenge) {
                http_response_code(404);
                echo json_encode([
                    'error' => 'Challenge not found',
                    'message' => 'Challenge with specified ID not found'
                ]);
                return;
            }

            // Prepare attempt data
            $attemptData = [
                'user_id' => $localUser['id'],
                'challenge_id' => $input['challenge_id'],
                'submitted_code' => $input['submitted_code'],
                'lint_report' => json_encode($input['lint_report'] ?? []),
                'test_results' => json_encode($input['test_results'] ?? []),
                'score' => $input['score'] ?? 0,
                'max_score' => $input['max_score'] ?? 100,
                'execution_time_ms' => $input['execution_time_ms'] ?? null,
                'memory_usage_kb' => $input['memory_usage_kb'] ?? null,
                'status' => $input['status'] ?? 'completed',
                'error_message' => $input['error_message'] ?? null
            ];

            // Insert attempt record
            $attemptId = $this->database->insert('attempts', $attemptData);

            if (!$attemptId) {
                throw new Exception('Failed to save attempt');
            }

            // Update user statistics if attempt was successful
            if (($attemptData['score'] ?? 0) > 0) {
                $this->updateUserStatistics($localUser['id'], $challenge['points']);
            }

            $this->logger->info('Challenge attempt submitted', [
                'user_id' => $localUser['id'],
                'challenge_id' => $input['challenge_id'],
                'score' => $attemptData['score']
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Attempt submitted successfully',
                'data' => [
                    'attempt_id' => $attemptId,
                    'score' => $attemptData['score'],
                    'max_score' => $attemptData['max_score']
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Submit attempt failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to submit attempt'
            ]);
        }
    }

    public function getUserAttempts($params = [])
    {
        try {
            // Require authentication
            $appwriteUser = $this->auth->requireAuth();
            
            // Get local user ID
            $localUser = $this->database->fetch(
                'SELECT id FROM users WHERE appwrite_id = ?',
                [$appwriteUser['$id']]
            );

            if (!$localUser) {
                http_response_code(404);
                echo json_encode([
                    'error' => 'User not found',
                    'message' => 'User profile not found in local database'
                ]);
                return;
            }

            // Get user's challenge attempts
            $attempts = $this->database->fetchAll(
                'SELECT a.*, c.title as challenge_title, c.points as challenge_points,
                        l.title as lesson_title, m.title as module_title
                 FROM attempts a
                 JOIN challenges c ON a.challenge_id = c.id
                 JOIN lessons l ON c.lesson_id = l.id
                 JOIN modules m ON l.module_id = m.id
                 WHERE a.user_id = ?
                 ORDER BY a.created_at DESC
                 LIMIT 50',
                [$localUser['id']]
            );

            echo json_encode([
                'success' => true,
                'data' => $attempts
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get user attempts failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve attempts'
            ]);
        }
    }

    public function getChallengeAttempts($params = [])
    {
        try {
            $challengeId = $params[0] ?? null;
            
            if (!$challengeId) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Challenge ID is required'
                ]);
                return;
            }

            // Get all attempts for a specific challenge
            $attempts = $this->database->fetchAll(
                'SELECT a.*, u.username
                 FROM attempts a
                 JOIN users u ON a.user_id = u.id
                 WHERE a.challenge_id = ?
                 ORDER BY a.score DESC, a.execution_time_ms ASC
                 LIMIT 100',
                [$challengeId]
            );

            echo json_encode([
                'success' => true,
                'data' => $attempts
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get challenge attempts failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve challenge attempts'
            ]);
        }
    }

    private function updateUserStatistics($userId, $pointsEarned)
    {
        try {
            // Update user statistics
            $this->database->update(
                'user_statistics',
                [
                    'total_xp' => "total_xp + {$pointsEarned}",
                    'challenges_completed' => 'challenges_completed + 1'
                ],
                'user_id = ?',
                [$userId]
            );

            // Check if user should level up
            $this->checkLevelUp($userId);

        } catch (Exception $e) {
            $this->logger->error('Update user statistics failed: ' . $e->getMessage());
        }
    }

    private function checkLevelUp($userId)
    {
        try {
            $stats = $this->database->fetch(
                'SELECT total_xp, level FROM user_statistics WHERE user_id = ?',
                [$userId]
            );

            if (!$stats) return;

            $currentLevel = $stats['level'];
            $totalXP = $stats['total_xp'];
            
            // Simple level calculation: every 100 XP = 1 level
            $newLevel = min(floor($totalXP / 100) + 1, 100);
            
            if ($newLevel > $currentLevel) {
                $levelTitles = [
                    1 => 'Beginner', 5 => 'Apprentice', 10 => 'Student',
                    20 => 'Scholar', 30 => 'Expert', 50 => 'Master',
                    75 => 'Grandmaster', 100 => 'Legend'
                ];
                
                $levelTitle = 'Beginner';
                foreach ($levelTitles as $level => $title) {
                    if ($newLevel >= $level) {
                        $levelTitle = $title;
                    }
                }

                $this->database->update(
                    'user_statistics',
                    [
                        'level' => $newLevel,
                        'level_title' => $levelTitle
                    ],
                    'user_id = ?',
                    [$userId]
                );

                $this->logger->info('User leveled up', [
                    'user_id' => $userId,
                    'old_level' => $currentLevel,
                    'new_level' => $newLevel,
                    'title' => $levelTitle
                ]);
            }

        } catch (Exception $e) {
            $this->logger->error('Check level up failed: ' . $e->getMessage());
        }
    }
}
