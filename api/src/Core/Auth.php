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

    public function __construct()
    {
        try {
            $this->logger = new Logger();
            $this->initializeAppwrite();
        } catch (Exception $e) {
            $this->logger->error('Failed to initialize Auth: ' . $e->getMessage());
            // Don't throw here, let the methods handle it gracefully
        }
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

    // Getter methods for Appwrite services
    public function getAccountService()
    {
        if (!$this->client) {
            throw new Exception('Appwrite client not initialized');
        }
        return $this->account;
    }

    public function getUsersService()
    {
        if (!$this->client) {
            throw new Exception('Appwrite client not initialized');
        }
        return $this->users;
    }

    public function getTeamsService()
    {
        if (!$this->client) {
            throw new Exception('Appwrite client not initialized');
        }
        return $this->teams;
    }

    public function getDatabasesService()
    {
        if (!$this->client) {
            throw new Exception('Appwrite client not initialized');
        }
        return new \Appwrite\Services\Databases($this->client);
    }
}
