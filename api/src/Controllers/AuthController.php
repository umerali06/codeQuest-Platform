<?php

namespace CodeQuest\Controllers;

use CodeQuest\Core\Auth;
use CodeQuest\Core\Logger;
use Exception;

class AuthController
{
    private $auth;
    private $logger;

    public function __construct()
    {
        $this->auth = new Auth();
        $this->logger = new Logger();
    }

    public function register($params = [])
    {
        try {
            // Get request body
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Bad Request',
                    'message' => 'Invalid JSON data'
                ]);
                return;
            }

            // Validate required fields
            $requiredFields = ['username', 'email', 'password'];
            foreach ($requiredFields as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Bad Request',
                        'message' => "Field '$field' is required"
                    ]);
                    return;
                }
            }

            // Validate email format
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Bad Request',
                    'message' => 'Invalid email format'
                ]);
                return;
            }

            // Validate password strength
            if (strlen($input['password']) < 8) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Bad Request',
                    'message' => 'Password must be at least 8 characters long'
                ]);
                return;
            }

            // Use Appwrite to create user
            $appwriteUser = $this->createAppwriteUser($input);
            
            if (!$appwriteUser) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Internal Server Error',
                    'message' => 'Failed to create user in Appwrite'
                ]);
                return;
            }

            // Get the created user data
            $userData = [
                'id' => $appwriteUser['$id'],
                'username' => $input['username'],
                'email' => $input['email'],
                'full_name' => $input['username'],
                'created_at' => date('c')
            ];

            $this->logger->info('User registered successfully via Appwrite', [
                'user_id' => $appwriteUser['$id'],
                'username' => $input['username'],
                'email' => $input['email']
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => $userData
            ]);

        } catch (Exception $e) {
            $this->logger->error('Registration failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Internal Server Error',
                'message' => 'Failed to register user: ' . $e->getMessage()
            ]);
        }
    }

    private function createAppwriteUser($input)
    {
        try {
            // Create user in Appwrite
            $users = $this->auth->getUsersService();
            
            // Appwrite users->create() signature: create(userId, email, phone, password, name)
            // We'll let Appwrite generate the userId automatically and skip phone
            $user = $users->create(
                'unique()', // Let Appwrite generate unique ID
                $input['email'], // email parameter
                null, // phone parameter - set to null since we don't want to store it
                $input['password'], // password parameter
                $input['username'] // name parameter
            );

            return $user;
        } catch (Exception $e) {
            $this->logger->error('Appwrite user creation failed: ' . $e->getMessage());
            
            // Check if it's a duplicate user error
            if (strpos($e->getMessage(), 'already exists') !== false || 
                strpos($e->getMessage(), 'duplicate') !== false) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'error' => 'Conflict',
                    'message' => 'User with this email or username already exists'
                ]);
                exit;
            }
            
            return null;
        }
    }

    public function login($params = [])
    {
        try {
            // Get request body
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Debug logging
            $this->logger->info('Login attempt received', [
                'raw_input' => file_get_contents('php://input'),
                'parsed_input' => $input,
                'email' => $input['email'] ?? 'NOT_SET',
                'password_length' => isset($input['password']) ? strlen($input['password']) : 'NOT_SET'
            ]);
            
            if (!$input) {
                $this->logger->error('Login failed: Invalid JSON data');
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Bad Request',
                    'message' => 'Invalid JSON data'
                ]);
                return;
            }

            // Validate required fields
            if (empty($input['email']) || empty($input['password'])) {
                $this->logger->error('Login failed: Missing required fields', [
                    'email_empty' => empty($input['email']),
                    'password_empty' => empty($input['password'])
                ]);
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Bad Request',
                    'message' => 'Email and password are required'
                ]);
                return;
            }

            $this->logger->info('Attempting Appwrite authentication', [
                'email' => $input['email']
            ]);

            // Use Appwrite to authenticate user
            $session = $this->authenticateWithAppwrite($input['email'], $input['password']);
            
            if (!$session) {
                $this->logger->error('Login failed: Appwrite authentication failed', [
                    'email' => $input['email']
                ]);
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Unauthorized',
                    'message' => 'Invalid email or password'
                ]);
                return;
            }

            $this->logger->info('Appwrite authentication successful', [
                'user_id' => $session['userId'],
                'email' => $input['email']
            ]);

            // Get user data from Appwrite
            $userData = $this->getAppwriteUserData($session['userId']);
            
            if (!$userData) {
                $this->logger->error('Login failed: Could not retrieve user data', [
                    'user_id' => $session['userId']
                ]);
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Internal Server Error',
                    'message' => 'Failed to retrieve user data'
                ]);
                return;
            }

            $this->logger->info('User logged in successfully via Appwrite', [
                'user_id' => $session['userId'],
                'email' => $input['email']
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'data' => $userData,
                'session' => $session
            ]);

        } catch (Exception $e) {
            $this->logger->error('Login failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Internal Server Error',
                'message' => 'Failed to login: ' . $e->getMessage()
            ]);
        }
    }

    private function authenticateWithAppwrite($email, $password)
    {
        try {
            $account = $this->auth->getAccountService();
            
            // Create email session using the correct method name
            $session = $account->createEmailPasswordSession($email, $password);
            
            return [
                'sessionId' => $session['$id'],
                'userId' => $session['userId'],
                'expire' => $session['expire']
            ];
        } catch (Exception $e) {
            $this->logger->error('Appwrite authentication failed: ' . $e->getMessage());
            return null;
        }
    }

    private function getAppwriteUserData($userId)
    {
        try {
            $users = $this->auth->getUsersService();
            $user = $users->get($userId);
            
            // Handle Appwrite timestamp properly
            $createdAt = null;
            if (isset($user['$createdAt'])) {
                // Appwrite timestamp might be a string or integer
                if (is_numeric($user['$createdAt'])) {
                    $createdAt = date('c', (int)$user['$createdAt']);
                } else {
                    // If it's already a string, use it as is
                    $createdAt = $user['$createdAt'];
                }
            } else {
                $createdAt = date('c'); // Use current time if not available
            }
            
            return [
                'id' => $user['$id'],
                'username' => $user['username'] ?? $user['email'],
                'email' => $user['email'],
                'full_name' => $user['name'] ?? $user['username'] ?? $user['email'],
                'avatar_url' => $user['avatar'] ?? null,
                'created_at' => $createdAt
            ];
        } catch (Exception $e) {
            $this->logger->error('Failed to get Appwrite user data: ' . $e->getMessage());
            return null;
        }
    }

    public function logout($params = [])
    {
        try {
            // Get session ID from request
            $input = json_decode(file_get_contents('php://input'), true);
            $sessionId = $input['sessionId'] ?? null;
            
            if ($sessionId) {
                // Delete session in Appwrite
                $account = $this->auth->getAccountService();
                $account->deleteSession($sessionId);
            }

            $this->logger->info('User logged out successfully');
            
            echo json_encode([
                'success' => true,
                'message' => 'Logout successful'
            ]);

        } catch (Exception $e) {
            $this->logger->error('Logout failed: ' . $e->getMessage());
            
            // Still return success for logout
            echo json_encode([
                'success' => true,
                'message' => 'Logout successful'
            ]);
        }
    }

    public function verifyToken($params = [])
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $jwt = $input['token'] ?? null;
            
            if (!$jwt) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Bad Request',
                    'message' => 'Token is required'
                ]);
                return;
            }

            $userData = $this->auth->verifyJWT($jwt);
            
            echo json_encode([
                'success' => true,
                'message' => 'Token verified successfully',
                'data' => $userData
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Unauthorized',
                'message' => 'Invalid token'
            ]);
        }
    }

    public function refreshToken($params = [])
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $sessionId = $input['sessionId'] ?? null;
            
            if (!$sessionId) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Bad Request',
                    'message' => 'Session ID is required'
                ]);
                return;
            }

            // Refresh session in Appwrite
            $account = $this->auth->getAccountService();
            $session = $account->updateSession($sessionId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'sessionId' => $session['$id'],
                    'expire' => $session['expire']
                ]
            ]);

        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Unauthorized',
                'message' => 'Failed to refresh token'
            ]);
        }
    }
}
