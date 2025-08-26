<?php

namespace CodeQuest\Controllers;

use CodeQuest\Core\Database;
use CodeQuest\Core\Logger;
use Exception;

class LessonController
{
    private $database;
    private $logger;

    public function __construct()
    {
        $this->database = Database::getInstance();
        $this->logger = new Logger();
    }

    public function getLesson($params = [])
    {
        try {
            $slug = $params[0] ?? null;
            
            if (!$slug) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Lesson slug is required'
                ]);
                return;
            }

            // Get lesson details with module info
            $lesson = $this->database->fetch(
                'SELECT l.*, m.title as module_title, m.slug as module_slug, m.color as module_color
                 FROM lessons l
                 JOIN modules m ON l.module_id = m.id
                 WHERE l.slug = ? AND l.is_active = 1',
                [$slug]
            );

            if (!$lesson) {
                http_response_code(404);
                echo json_encode([
                    'error' => 'Lesson not found',
                    'message' => 'Lesson with specified slug not found'
                ]);
                return;
            }

            // Get challenges for this lesson
            $challenges = $this->database->fetchAll(
                'SELECT id, title, description, difficulty, points, time_limit
                 FROM challenges 
                 WHERE lesson_id = ? AND is_active = 1
                 ORDER BY id ASC',
                [$lesson['id']]
            );

            // Get next and previous lessons
            $navigation = $this->getLessonNavigation($lesson['module_id'], $lesson['order_index']);

            // Format lesson data
            $lessonData = [
                'id' => $lesson['id'],
                'slug' => $lesson['slug'],
                'title' => $lesson['title'],
                'description' => $lesson['description'],
                'content_md' => $lesson['content_md'],
                'starter_code' => $lesson['starter_code'],
                'test_spec_json' => json_decode($lesson['test_spec_json'], true),
                'difficulty' => $lesson['difficulty'],
                'estimated_duration' => $lesson['estimated_duration'],
                'module' => [
                    'title' => $lesson['module_title'],
                    'slug' => $lesson['module_slug'],
                    'color' => $lesson['module_color']
                ],
                'challenges' => $challenges,
                'navigation' => $navigation
            ];

            echo json_encode([
                'success' => true,
                'data' => $lessonData
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get lesson failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve lesson'
            ]);
        }
    }

    private function getLessonNavigation($moduleId, $currentOrder)
    {
        try {
            // Get previous lesson
            $prevLesson = $this->database->fetch(
                'SELECT slug, title FROM lessons 
                 WHERE module_id = ? AND order_index < ? AND is_active = 1
                 ORDER BY order_index DESC LIMIT 1',
                [$moduleId, $currentOrder]
            );

            // Get next lesson
            $nextLesson = $this->database->fetch(
                'SELECT slug, title FROM lessons 
                 WHERE module_id = ? AND order_index > ? AND is_active = 1
                 ORDER BY order_index ASC LIMIT 1',
                [$moduleId, $currentOrder]
            );

            return [
                'previous' => $prevLesson ? [
                    'slug' => $prevLesson['slug'],
                    'title' => $prevLesson['title']
                ] : null,
                'next' => $nextLesson ? [
                    'slug' => $nextLesson['slug'],
                    'title' => $nextLesson['title']
                ] : null
            ];

        } catch (Exception $e) {
            $this->logger->error('Get lesson navigation failed: ' . $e->getMessage());
            return ['previous' => null, 'next' => null];
        }
    }

    public function getLessonProgress($params = [])
    {
        try {
            $slug = $params[0] ?? null;
            
            if (!$slug) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Lesson slug is required'
                ]);
                return;
            }

            // Get lesson ID
            $lesson = $this->database->fetch(
                'SELECT id FROM lessons WHERE slug = ? AND is_active = 1',
                [$slug]
            );

            if (!$lesson) {
                http_response_code(404);
                echo json_encode([
                    'error' => 'Lesson not found',
                    'message' => 'Lesson with specified slug not found'
                ]);
                return;
            }

            // Get lesson progress
            $progress = $this->database->fetch(
                'SELECT status, xp_earned, time_spent, completed_at
                 FROM progress 
                 WHERE lesson_id = ?',
                [$lesson['id']]
            );

            // Get challenge attempts for this lesson
            $challenges = $this->database->fetchAll(
                'SELECT c.id, c.title, c.difficulty, c.points,
                        COALESCE(MAX(a.score), 0) as best_score,
                        COUNT(a.id) as attempt_count,
                        COALESCE(MAX(a.created_at), NULL) as last_attempt
                 FROM challenges c
                 LEFT JOIN attempts a ON c.id = a.challenge_id
                 WHERE c.lesson_id = ? AND c.is_active = 1
                 GROUP BY c.id
                 ORDER BY c.id ASC',
                [$lesson['id']]
            );

            $progressData = [
                'lesson_id' => $lesson['id'],
                'status' => $progress ? $progress['status'] : 'not_started',
                'xp_earned' => $progress ? (int)$progress['xp_earned'] : 0,
                'time_spent' => $progress ? (int)$progress['time_spent'] : 0,
                'completed_at' => $progress ? $progress['completed_at'] : null,
                'challenges' => $challenges,
                'total_challenges' => count($challenges),
                'completed_challenges' => count(array_filter($challenges, fn($c) => $c['best_score'] > 0))
            ];

            echo json_encode([
                'success' => true,
                'data' => $progressData
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get lesson progress failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve lesson progress'
            ]);
        }
    }

    public function markLessonComplete($params = [])
    {
        try {
            $slug = $params[0] ?? null;
            
            if (!$slug) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Lesson slug is required'
                ]);
                return;
            }

            // Get lesson ID
            $lesson = $this->database->fetch(
                'SELECT id, estimated_duration FROM lessons WHERE slug = ? AND is_active = 1',
                [$slug]
            );

            if (!$lesson) {
                http_response_code(404);
                echo json_encode([
                    'error' => 'Lesson not found',
                    'message' => 'Lesson with specified slug not found'
                ]);
                return;
            }

            // Calculate XP based on lesson difficulty and completion
            $xpEarned = $this->calculateLessonXP($lesson['estimated_duration']);

            // Update or create progress record
            $existingProgress = $this->database->fetch(
                'SELECT id FROM progress WHERE lesson_id = ?',
                [$lesson['id']]
            );

            if ($existingProgress) {
                $this->database->update(
                    'progress',
                    [
                        'status' => 'completed',
                        'xp_earned' => $xpEarned,
                        'completed_at' => date('Y-m-d H:i:s')
                    ],
                    'id = ?',
                    [$existingProgress['id']]
                );
            } else {
                $this->database->insert('progress', [
                    'lesson_id' => $lesson['id'],
                    'status' => 'completed',
                    'xp_earned' => $xpEarned,
                    'completed_at' => date('Y-m-d H:i:s')
                ]);
            }

            $this->logger->info('Lesson marked complete: ' . $lesson['id']);

            echo json_encode([
                'success' => true,
                'message' => 'Lesson marked as complete',
                'data' => [
                    'xp_earned' => $xpEarned,
                    'completed_at' => date('Y-m-d H:i:s')
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Mark lesson complete failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to mark lesson as complete'
            ]);
        }
    }

    private function calculateLessonXP($duration)
    {
        // Base XP for completing a lesson
        $baseXP = 25;
        
        // Bonus XP for longer lessons
        $durationBonus = min(($duration / 15) * 10, 25);
        
        return (int)($baseXP + $durationBonus);
    }
}
