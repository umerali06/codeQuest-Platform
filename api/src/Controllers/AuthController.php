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

    public function login($params = [])
    {
        try {
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
            if (empty($input['email']) || empty($input['password'])) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Email and password are required'
                ]);
                return;
            }

            // This endpoint is for client-side authentication
            // The actual login should be handled by Appwrite SDK on the frontend
            // This endpoint can be used for additional validation or logging
            
            $this->logger->info('Login attempt', [
                'email' => $input['email'],
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Login endpoint - use Appwrite SDK for authentication',
                'data' => [
                    'auth_method' => 'appwrite_sdk',
                    'note' => 'Authentication should be handled client-side using Appwrite SDK'
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Login failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to process login request'
            ]);
        }
    }

    public function register($params = [])
    {
        try {
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
            $requiredFields = ['username', 'email', 'password'];
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

            // Validate email format
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Invalid email format'
                ]);
                return;
            }

            // Validate password strength
            if (strlen($input['password']) < 8) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'Bad Request',
                    'message' => 'Password must be at least 8 characters long'
                ]);
                return;
            }

            // This endpoint is for client-side registration
            // The actual registration should be handled by Appwrite SDK on the frontend
            // This endpoint can be used for additional validation or logging
            
            $this->logger->info('Registration attempt', [
                'username' => $input['username'],
                'email' => $input['email'],
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Registration endpoint - use Appwrite SDK for account creation',
                'data' => [
                    'auth_method' => 'appwrite_sdk',
                    'note' => 'Account creation should be handled client-side using Appwrite SDK'
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Registration failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to process registration request'
            ]);
        }
    }

    public function logout($params = [])
    {
        try {
            // This endpoint is for client-side logout
            // The actual logout should be handled by Appwrite SDK on the frontend
            // This endpoint can be used for additional cleanup or logging
            
            $this->logger->info('Logout request', [
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Logout endpoint - use Appwrite SDK for session management',
                'data' => [
                    'auth_method' => 'appwrite_sdk',
                    'note' => 'Session management should be handled client-side using Appwrite SDK'
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Logout failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to process logout request'
            ]);
        }
    }

    public function verifyToken($params = [])
    {
        try {
            // Get JWT from Authorization header
            $headers = getallheaders();
            $jwt = null;

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
                    'message' => 'No authentication token provided'
                ]);
                return;
            }

            // Verify JWT using Auth class
            $user = $this->auth->verifyJWT($jwt);
            
            if (!$user) {
                http_response_code(401);
                echo json_encode([
                    'error' => 'Unauthorized',
                    'message' => 'Invalid or expired authentication token'
                ]);
                return;
            }

            echo json_encode([
                'success' => true,
                'message' => 'Token verified successfully',
                'data' => [
                    'user_id' => $user['$id'],
                    'email' => $user['email'],
                    'name' => $user['name'] ?? null,
                    'verified' => true
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Token verification failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to verify authentication token'
            ]);
        }
    }

    public function refreshToken($params = [])
    {
        try {
            // Get current JWT from Authorization header
            $headers = getallheaders();
            $jwt = null;

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
                    'message' => 'No authentication token provided'
                ]);
                return;
            }

            // Verify current JWT
            $user = $this->auth->verifyJWT($jwt);
            
            if (!$user) {
                http_response_code(401);
                echo json_encode([
                    'error' => 'Unauthorized',
                    'message' => 'Invalid or expired authentication token'
                ]);
                return;
            }

            // Note: Appwrite handles token refresh automatically
            // This endpoint can be used for additional validation or logging
            
            $this->logger->info('Token refresh request', [
                'user_id' => $user['$id'],
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Token refresh endpoint - Appwrite handles refresh automatically',
                'data' => [
                    'auth_method' => 'appwrite_sdk',
                    'note' => 'Token refresh is handled automatically by Appwrite SDK',
                    'user_id' => $user['$id']
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Token refresh failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to process token refresh request'
            ]);
        }
    }
}
