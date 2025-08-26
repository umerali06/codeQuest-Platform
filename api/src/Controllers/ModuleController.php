<?php

namespace CodeQuest\Controllers;

use CodeQuest\Core\Database;
use CodeQuest\Core\Logger;
use Exception;

class ModuleController
{
    private $database;
    private $logger;

    public function __construct()
    {
        $this->database = Database::getInstance();
        $this->logger = new Logger();
    }

    public function getModules($params = [])
    {
        try {
            // Get all active modules with lesson counts
            $modules = $this->database->fetchAll(
                'SELECT m.*, 
                        COUNT(l.id) as lesson_count,
                        SUM(CASE WHEN l.difficulty = "beginner" THEN 1 ELSE 0 END) as beginner_lessons,
                        SUM(CASE WHEN l.difficulty = "intermediate" THEN 1 ELSE 0 END) as intermediate_lessons,
                        SUM(CASE WHEN l.difficulty = "advanced" THEN 1 ELSE 0 END) as advanced_lessons
                 FROM modules m
                 LEFT JOIN lessons l ON m.id = l.module_id AND l.is_active = 1
                 WHERE m.is_active = 1
                 GROUP BY m.id
                 ORDER BY m.order_index ASC'
            );

            // Format module data
            foreach ($modules as &$module) {
                $module['lesson_count'] = (int)$module['lesson_count'];
                $module['beginner_lessons'] = (int)$module['beginner_lessons'];
                $module['intermediate_lessons'] = (int)$module['intermediate_lessons'];
                $module['advanced_lessons'] = (int)$module['advanced_lessons'];
                
                // Add estimated duration
                $module['estimated_duration'] = $this->calculateModuleDuration($module['id']);
            }

            echo json_encode([
                'success' => true,
                'data' => $modules
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get modules failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve modules'
            ]);
        }
    }

    public function getModule($params = [])
    {
        try {
            $slug = $params[0] ?? null;
            
            if (!$slug) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Module slug is required'
                ]);
                return;
            }

            // Get module details
            $module = $this->database->fetch(
                'SELECT * FROM modules WHERE slug = ? AND is_active = 1',
                [$slug]
            );

            if (!$module) {
                http_response_code(404);
                echo json_encode([
                    'error' => 'Module not found',
                    'message' => 'Module with specified slug not found'
                ]);
                return;
            }

            // Get lessons for this module
            $lessons = $this->database->fetchAll(
                'SELECT id, slug, title, description, difficulty, order_index, estimated_duration
                 FROM lessons 
                 WHERE module_id = ? AND is_active = 1
                 ORDER BY order_index ASC',
                [$module['id']]
            );

            // Add lesson progress if user is authenticated
            $module['lessons'] = $lessons;
            $module['total_lessons'] = count($lessons);
            $module['estimated_duration'] = $this->calculateModuleDuration($module['id']);

            echo json_encode([
                'success' => true,
                'data' => $module
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get module failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve module'
            ]);
        }
    }

    private function calculateModuleDuration($moduleId)
    {
        try {
            $result = $this->database->fetch(
                'SELECT SUM(estimated_duration) as total_duration 
                 FROM lessons 
                 WHERE module_id = ? AND is_active = 1',
                [$moduleId]
            );

            return (int)($result['total_duration'] ?? 0);
        } catch (Exception $e) {
            $this->logger->error('Calculate module duration failed: ' . $e->getMessage());
            return 0;
        }
    }

    public function getModuleProgress($params = [])
    {
        try {
            $slug = $params[0] ?? null;
            
            if (!$slug) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Module slug is required'
                ]);
                return;
            }

            // Get module ID
            $module = $this->database->fetch(
                'SELECT id FROM modules WHERE slug = ? AND is_active = 1',
                [$slug]
            );

            if (!$module) {
                http_response_code(404);
                echo json_encode([
                    'error' => 'Module not found',
                    'message' => 'Module with specified slug not found'
                ]);
                return;
            }

            // Get lessons with progress
            $lessons = $this->database->fetchAll(
                'SELECT l.id, l.slug, l.title, l.difficulty, l.order_index,
                        COALESCE(p.status, "not_started") as progress_status,
                        COALESCE(p.xp_earned, 0) as xp_earned,
                        COALESCE(p.time_spent, 0) as time_spent
                 FROM lessons l
                 LEFT JOIN progress p ON l.id = p.lesson_id
                 WHERE l.module_id = ? AND l.is_active = 1
                 ORDER BY l.order_index ASC',
                [$module['id']]
            );

            // Calculate module progress
            $totalLessons = count($lessons);
            $completedLessons = count(array_filter($lessons, fn($l) => $l['progress_status'] === 'completed'));
            $inProgressLessons = count(array_filter($lessons, fn($l) => $l['progress_status'] === 'in_progress'));
            
            $progress = [
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedLessons,
                'in_progress_lessons' => $inProgressLessons,
                'not_started_lessons' => $totalLessons - $completedLessons - $inProgressLessons,
                'completion_percentage' => $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 1) : 0,
                'lessons' => $lessons
            ];

            echo json_encode([
                'success' => true,
                'data' => $progress
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get module progress failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve module progress'
            ]);
        }
    }
}
