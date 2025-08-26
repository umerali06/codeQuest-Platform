<?php

namespace CodeQuest\Controllers;

use CodeQuest\Core\Auth;
use CodeQuest\Core\Database;
use CodeQuest\Core\Logger;
use Exception;

class UserController
{
    private $auth;
    private $database;
    private $logger;

    public function __construct()
    {
        $this->auth = new Auth();
        $this->database = Database::getInstance();
        $this->logger = new Logger();
    }

    public function getCurrentUser($params = [])
    {
        try {
            // Require authentication
            $appwriteUser = $this->auth->requireAuth();
            
            // Get local user data
            $localUser = $this->database->fetch(
                'SELECT u.*, us.* FROM users u 
                 LEFT JOIN user_statistics us ON u.id = us.user_id 
                 WHERE u.appwrite_id = ?',
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

            // Return user data (excluding sensitive information)
            $userData = [
                'id' => $localUser['id'],
                'username' => $localUser['username'],
                'email' => $localUser['email'],
                'avatar_url' => $localUser['avatar_url'],
                'created_at' => $localUser['created_at'],
                'statistics' => [
                    'total_xp' => $localUser['total_xp'] ?? 0,
                    'level' => $localUser['level'] ?? 1,
                    'level_title' => $localUser['level_title'] ?? 'Beginner',
                    'streak_days' => $localUser['streak_days'] ?? 0,
                    'lessons_completed' => $localUser['lessons_completed'] ?? 0,
                    'challenges_completed' => $localUser['challenges_completed'] ?? 0,
                    'games_played' => $localUser['games_played'] ?? 0
                ]
            ];

            echo json_encode([
                'success' => true,
                'data' => $userData
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get current user failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve user data'
            ]);
        }
    }

    public function updateProfile($params = [])
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

            // Validate input
            $allowedFields = ['username', 'avatar_url'];
            $updateData = array_intersect_key($input, array_flip($allowedFields));
            
            if (empty($updateData)) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'No valid fields to update'
                ]);
                return;
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

            // Update user profile
            $this->database->update(
                'users',
                $updateData,
                'id = ?',
                [$localUser['id']]
            );

            $this->logger->info('User profile updated: ' . $localUser['id']);

            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);

        } catch (Exception $e) {
            $this->logger->error('Update profile failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to update profile'
            ]);
        }
    }

    public function getProgress($params = [])
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

            // Get user progress
            $progress = $this->database->fetchAll(
                'SELECT p.*, l.title as lesson_title, m.title as module_title, m.slug as module_slug
                 FROM progress p
                 JOIN lessons l ON p.lesson_id = l.id
                 JOIN modules m ON l.module_id = m.id
                 WHERE p.user_id = ?
                 ORDER BY p.updated_at DESC',
                [$localUser['id']]
            );

            echo json_encode([
                'success' => true,
                'data' => $progress
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get progress failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve progress data'
            ]);
        }
    }
}
