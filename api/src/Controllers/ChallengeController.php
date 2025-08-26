<?php

namespace CodeQuest\Controllers;

use CodeQuest\Core\Database;
use CodeQuest\Core\Logger;
use Exception;

class ChallengeController
{
    private $database;
    private $logger;

    public function __construct()
    {
        $this->database = Database::getInstance();
        $this->logger = new Logger();
    }

    public function getChallenges($params = [])
    {
        try {
            $sql = "SELECT c.*, l.title as lesson_title, l.slug as lesson_slug 
                    FROM challenges c 
                    JOIN lessons l ON c.lesson_id = l.id 
                    WHERE c.is_active = 1 
                    ORDER BY l.order_index, c.difficulty, c.title";
            
            $challenges = $this->database->query($sql)->fetchAll();
            
            return [
                'success' => true,
                'data' => $challenges
            ];
        } catch (Exception $e) {
            $this->logger->error('Failed to get challenges: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to load challenges'
            ];
        }
    }

    public function getChallenge($params = [])
    {
        try {
            $challengeId = $params['id'] ?? null;
            
            if (!$challengeId) {
                return [
                    'success' => false,
                    'message' => 'Challenge ID is required'
                ];
            }
            
            $sql = "SELECT c.*, l.title as lesson_title, l.slug as lesson_slug 
                    FROM challenges c 
                    JOIN lessons l ON c.lesson_id = l.id 
                    WHERE c.id = ? AND c.is_active = 1";
            
            $challenge = $this->database->query($sql, [$challengeId])->fetch();
            
            if (!$challenge) {
                return [
                    'success' => false,
                    'message' => 'Challenge not found'
                ];
            }
            
            return [
                'success' => true,
                'data' => $challenge
            ];
            
        } catch (Exception $e) {
            $this->logger->error('Failed to get challenge: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to load challenge'
            ];
        }
    }

    public function getRandomChallenge($params = [])
    {
        try {
            $sql = "SELECT c.*, l.title as lesson_title, l.slug as lesson_slug 
                    FROM challenges c 
                    JOIN lessons l ON c.lesson_id = l.id 
                    WHERE c.is_active = 1 
                    ORDER BY RAND() 
                    LIMIT 1";
            
            $challenge = $this->database->query($sql)->fetch();
            
            if (!$challenge) {
                return [
                    'success' => false,
                    'message' => 'No challenges available'
                ];
            }
            
            return [
                'success' => true,
                'data' => $challenge
            ];
            
        } catch (Exception $e) {
            $this->logger->error('Failed to get random challenge: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to load random challenge'
            ];
        }
    }
}
