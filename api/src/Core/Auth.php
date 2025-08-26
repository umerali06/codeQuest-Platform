<?php

namespace CodeQuest\Core;

use Appwrite\Client;
use Appwrite\Services\Account;
use Appwrite\Services\Users;
use Appwrite\Services\Teams;
use Exception;

class Auth
{
    private $client;
    private $account;
    private $users;
    private $teams;
    private $logger;
    private $database;

    public function __construct()
    {
        $this->logger = new Logger();
        $this->database = Database::getInstance();
        $this->initializeAppwrite();
    }

    private function initializeAppwrite()
    {
        try {
            $endpoint = $_ENV['APPWRITE_ENDPOINT'] ?? 'https://cloud.appwrite.io/v1';
            $projectId = $_ENV['APPWRITE_PROJECT_ID'] ?? '';
            $apiKey = $_ENV['APPWRITE_API_KEY'] ?? '';

            if (empty($projectId) || empty($apiKey)) {
                throw new Exception('Appwrite configuration is incomplete');
            }

            $this->client = new Client();
            $this->client
                ->setEndpoint($endpoint)
                ->setProject($projectId)
                ->setKey($apiKey);

            $this->account = new Account($this->client);
            $this->users = new Users($this->client);
            $this->teams = new Teams($this->client);

            $this->logger->info('Appwrite client initialized successfully');
        } catch (Exception $e) {
            $this->logger->error('Failed to initialize Appwrite client: ' . $e->getMessage());
            throw $e;
        }
    }

    public function verifyJWT($jwt)
    {
        try {
            if (empty($jwt)) {
                throw new Exception('JWT token is required');
            }

            // Verify JWT with Appwrite
            $session = $this->account->getSession($jwt);
            
            if (!$session) {
                throw new Exception('Invalid JWT token');
            }

            $userId = $session['userId'];
            $user = $this->users->get($userId);

            // Mirror user in local database if not exists
            $this->mirrorUser($user);

            return [
                'user_id' => $userId,
                'email' => $user['email'],
                'username' => $user['username'] ?? null,
                'full_name' => $user['name'] ?? null,
                'avatar_url' => $user['avatar'] ?? null,
                'verified' => $user['emailVerification'] ?? false,
                'session' => $session
            ];

        } catch (Exception $e) {
            $this->logger->error('JWT verification failed: ' . $e->getMessage());
            throw new Exception('Authentication failed: ' . $e->getMessage());
        }
    }

    private function mirrorUser($appwriteUser)
    {
        try {
            $userId = $appwriteUser['$id'];
            
            // Check if user already exists
            $existingUser = $this->database->fetch(
                'SELECT id FROM users WHERE appwrite_id = ?',
                [$userId]
            );

            if (!$existingUser) {
                // Create new user
                $this->database->execute(
                    'INSERT INTO users (id, appwrite_id, username, email, full_name, avatar_url, created_at) 
                     VALUES (UUID(), ?, ?, ?, ?, ?, NOW())',
                    [
                        $userId,
                        $appwriteUser['username'] ?? $appwriteUser['email'],
                        $appwriteUser['email'],
                        $appwriteUser['name'] ?? null,
                        $appwriteUser['avatar'] ?? null
                    ]
                );
                
                $this->logger->info('New user mirrored from Appwrite: ' . $userId);
            } else {
                // Update existing user
                $this->database->execute(
                    'UPDATE users SET username = ?, email = ?, full_name = ?, avatar_url = ?, updated_at = NOW() 
                     WHERE appwrite_id = ?',
                    [
                        $appwriteUser['username'] ?? $appwriteUser['email'],
                        $appwriteUser['email'],
                        $appwriteUser['name'] ?? null,
                        $appwriteUser['avatar'] ?? null,
                        $userId
                    ]
                );
            }

        } catch (Exception $e) {
            $this->logger->error('Failed to mirror user: ' . $e->getMessage());
            // Don't throw - this shouldn't break authentication
        }
    }

    public function getUserById($userId)
    {
        try {
            return $this->database->fetch(
                'SELECT * FROM users WHERE id = ?',
                [$userId]
            );
        } catch (Exception $e) {
            $this->logger->error('Failed to get user by ID: ' . $e->getMessage());
            return null;
        }
    }

    public function getUserByAppwriteId($appwriteId)
    {
        try {
            return $this->database->fetch(
                'SELECT * FROM users WHERE appwrite_id = ?',
                [$appwriteId]
            );
        } catch (Exception $e) {
            $this->logger->error('Failed to get user by Appwrite ID: ' . $e->getMessage());
            return null;
        }
    }

    public function updateUserProfile($userId, $data)
    {
        try {
            $allowedFields = ['username', 'full_name', 'country', 'timezone'];
            $updates = [];
            $params = [];

            foreach ($data as $field => $value) {
                if (in_array($field, $allowedFields) && !empty($value)) {
                    $updates[] = "{$field} = ?";
                    $params[] = $value;
                }
            }

            if (empty($updates)) {
                return false;
            }

            $params[] = $userId;
            $sql = 'UPDATE users SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = ?';
            
            return $this->database->execute($sql, $params) > 0;

        } catch (Exception $e) {
            $this->logger->error('Failed to update user profile: ' . $e->getMessage());
            return false;
        }
    }

    public function isAuthenticated($jwt)
    {
        try {
            $this->verifyJWT($jwt);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    public function getCurrentUser($jwt)
    {
        try {
            return $this->verifyJWT($jwt);
        } catch (Exception $e) {
            return null;
        }
    }
}
