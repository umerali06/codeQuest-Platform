<?php

namespace CodeQuest\Controllers;

use CodeQuest\Core\Database;
use CodeQuest\Core\Logger;
use CodeQuest\Core\Auth;
use Exception;

class GameController
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

    public function saveResult($params = [])
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
            $requiredFields = ['game_type', 'score', 'max_score'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field])) {
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

            // Prepare game result data
            $gameData = [
                'user_id' => $localUser['id'],
                'game_type' => $input['game_type'],
                'score' => (int)$input['score'],
                'max_score' => (int)$input['max_score'],
                'time_spent' => (int)($input['time_spent'] ?? 0),
                'game_data' => json_encode($input['game_data'] ?? [])
            ];

            // Insert game result
            $gameResultId = $this->database->insert('game_results', $gameData);

            if (!$gameResultId) {
                throw new Exception('Failed to save game result');
            }

            // Update user statistics
            $this->updateGameStatistics($localUser['id'], $gameData);

            $this->logger->info('Game result saved', [
                'user_id' => $localUser['id'],
                'game_type' => $input['game_type'],
                'score' => $input['score'],
                'max_score' => $input['max_score']
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Game result saved successfully',
                'data' => [
                    'game_result_id' => $gameResultId,
                    'score' => $gameData['score'],
                    'max_score' => $gameData['max_score']
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Save game result failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to save game result'
            ]);
        }
    }

    public function getLeaderboard($params = [])
    {
        try {
            $gameType = $params[0] ?? 'all';
            $limit = min((int)($params[1] ?? 50), 100); // Max 100 results
            
            $sql = 'SELECT u.username, u.avatar_url, 
                           COUNT(gr.id) as games_played,
                           AVG(gr.score) as avg_score,
                           MAX(gr.score) as best_score,
                           SUM(gr.time_spent) as total_time
                    FROM users u
                    JOIN game_results gr ON u.id = gr.user_id';
            
            $sqlParams = [];
            
            if ($gameType !== 'all') {
                $sql .= ' WHERE gr.game_type = ?';
                $sqlParams[] = $gameType;
            }
            
            $sql .= ' GROUP BY u.id
                      ORDER BY best_score DESC, avg_score DESC
                      LIMIT ?';
            $sqlParams[] = $limit;

            $leaderboard = $this->database->fetchAll($sql, $sqlParams);

            echo json_encode([
                'success' => true,
                'data' => [
                    'game_type' => $gameType,
                    'leaderboard' => $leaderboard
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get leaderboard failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve leaderboard'
            ]);
        }
    }

    public function getUserGameStats($params = [])
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

            // Get user's game statistics
            $gameStats = $this->database->fetchAll(
                'SELECT game_type,
                        COUNT(*) as games_played,
                        AVG(score) as avg_score,
                        MAX(score) as best_score,
                        MIN(score) as worst_score,
                        SUM(time_spent) as total_time,
                        AVG(time_spent) as avg_time
                 FROM game_results
                 WHERE user_id = ?
                 GROUP BY game_type
                 ORDER BY games_played DESC',
                [$localUser['id']]
            );

            // Get overall stats
            $overallStats = $this->database->fetch(
                'SELECT COUNT(*) as total_games,
                        AVG(score) as overall_avg_score,
                        MAX(score) as overall_best_score,
                        SUM(time_spent) as total_time_spent
                 FROM game_results
                 WHERE user_id = ?',
                [$localUser['id']]
            );

            echo json_encode([
                'success' => true,
                'data' => [
                    'overall' => $overallStats,
                    'by_game_type' => $gameStats
                ]
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get user game stats failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve game statistics'
            ]);
        }
    }

    public function getRecentGames($params = [])
    {
        try {
            $limit = min((int)($params[0] ?? 20), 50); // Max 50 results
            
            $recentGames = $this->database->fetchAll(
                'SELECT gr.*, u.username, u.avatar_url
                 FROM game_results gr
                 JOIN users u ON gr.user_id = u.id
                 ORDER BY gr.created_at DESC
                 LIMIT ?',
                [$limit]
            );

            echo json_encode([
                'success' => true,
                'data' => $recentGames
            ]);

        } catch (Exception $e) {
            $this->logger->error('Get recent games failed: ' . $e->getMessage());
            
            http_response_code(500);
            echo json_encode([
                'error' => 'Internal Server Error',
                'message' => 'Failed to retrieve recent games'
            ]);
        }
    }

    private function updateGameStatistics($userId, $gameData)
    {
        try {
            // Update user statistics
            $this->database->update(
                'user_statistics',
                [
                    'games_played' => 'games_played + 1'
                ],
                'user_id = ?',
                [$userId]
            );

            // Calculate XP based on performance
            $scorePercentage = $gameData['score'] / $gameData['max_score'];
            $baseXP = 10;
            $performanceBonus = (int)($scorePercentage * 20); // Up to 20 bonus XP
            $timeBonus = max(0, 10 - (int)($gameData['time_spent'] / 60)); // Up to 10 bonus XP for speed
            
            $totalXP = $baseXP + $performanceBonus + $timeBonus;

            // Update XP
            $this->database->update(
                'user_statistics',
                [
                    'total_xp' => "total_xp + {$totalXP}"
                ],
                'user_id = ?',
                [$userId]
            );

            // Check if user should level up
            $this->checkLevelUp($userId);

        } catch (Exception $e) {
            $this->logger->error('Update game statistics failed: ' . $e->getMessage());
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

                $this->logger->info('User leveled up from game', [
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
