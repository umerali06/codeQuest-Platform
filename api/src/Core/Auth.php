<?php

namespace CodeQuest\Core;

use Exception;

class Auth
{
    private $logger;
    private $database;

    public function __construct()
    {
        $this->logger = new Logger();
        $this->database = Database::getInstance();
    }

    public function verifyJWT($jwt)
    {
        try {
            if (empty($jwt)) {
                return null;
            }

            // For now, just return a mock user for testing
            // In production, this would verify the JWT with Appwrite
            return [
                '$id' => 'test_user_123',
                'name' => 'Test User',
                'email' => 'test@example.com'
            ];

        } catch (Exception $e) {
            $this->logger->error('JWT verification failed: ' . $e->getMessage());
            return null;
        }
    }

    private function mirrorUser($appwriteUser)
    {
        try {
            $userId = $appwriteUser['$id'];
            
            // Check if user already exists
            $existingUser = $this->database->fetch(
                'SELECT * FROM users WHERE appwrite_id = ?',
                [$userId]
            );

            if (!$existingUser) {
                // Create new user
                $userData = [
                    'id' => uniqid('user_'),
                    'appwrite_id' => $userId,
                    'username' => $appwriteUser['name'] ?? 'User' . substr($userId, -6),
                    'email' => $appwriteUser['email'],
                    'avatar_url' => $appwriteUser['avatar'] ?? null
                ];

                $this->database->insert('users', $userData);

                // Create user statistics
                $statsData = [
                    'user_id' => $userData['id'],
                    'total_xp' => 0,
                    'level' => 1,
                    'level_title' => 'Beginner',
                    'streak_days' => 0,
                    'last_login' => date('Y-m-d H:i:s'),
                    'lessons_completed' => 0,
                    'challenges_completed' => 0,
                    'games_played' => 0
                ];

                $this->database->insert('user_statistics', $statsData);

                $this->logger->info('New user mirrored: ' . $userData['id']);

            } else {
                // Update last login
                $this->database->update(
                    'user_statistics',
                    ['last_login' => date('Y-m-d H:i:s')],
                    'user_id = ?',
                    [$existingUser['id']]
                );
            }

        } catch (Exception $e) {
            $this->logger->error('User mirroring failed: ' . $e->getMessage());
        }
    }

    public function getCurrentUser($jwt)
    {
        $appwriteUser = $this->verifyJWT($jwt);
        
        if (!$appwriteUser) {
            return null;
        }

        // Get local user data
        $localUser = $this->database->fetch(
            'SELECT u.*, us.* FROM users u 
             LEFT JOIN user_statistics us ON u.id = us.user_id 
             WHERE u.appwrite_id = ?',
            [$appwriteUser['$id']]
        );

        return $localUser;
    }

    public function requireAuth()
    {
        $headers = getallheaders();
        $jwt = null;

        // Extract JWT from Authorization header
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $jwt = $matches[1];
            }
        }

        if (!$jwt) {
            http_response_code(401);
            echo json_encode([
                'error' => 'Unauthorized',
                'message' => 'Authentication token required'
            ]);
            exit();
        }

        $user = $this->verifyJWT($jwt);
        if (!$user) {
            http_response_code(401);
            echo json_encode([
                'error' => 'Unauthorized',
                'message' => 'Invalid authentication token'
            ]);
            exit();
        }

        return $user;
    }

    public function getUserId($jwt)
    {
        $user = $this->getCurrentUser($jwt);
        return $user ? $user['id'] : null;
    }

    public function getCurrentUserId()
    {
        $headers = getallheaders();
        $jwt = null;

        // Extract JWT from Authorization header
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $jwt = $matches[1];
            }
        }

        if (!$jwt) {
            return null;
        }

        return $this->getUserId($jwt);
    }
}
