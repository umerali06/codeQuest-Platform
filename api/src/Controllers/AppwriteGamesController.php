<?php

namespace CodeQuest\Controllers;

use Exception;
use Appwrite\Query;

class AppwriteGamesController
{
    private $auth;
    private $databaseId;
    private $collectionId;

    public function __construct()
    {
        try {
            $this->auth = new \CodeQuest\Core\Auth();
            $this->databaseId = 'codequest_db';
            $this->collectionId = 'games';
        } catch (Exception $e) {
            error_log('Failed to initialize Games Controller: ' . $e->getMessage());
            $this->auth = null;
        }
    }

    public function getAllGames()
    {
        try {
            if (!$this->auth) {
                return [
                    'success' => true,
                    'data' => $this->getSampleGames()
                ];
            }

            // Set a timeout for Appwrite operations
            set_time_limit(10); // 10 seconds max
            
            $databases = $this->auth->getDatabasesService();
            
            // Get all active games from Appwrite
            $games = $databases->listDocuments(
                $this->databaseId,
                $this->collectionId,
                [
                    'queries' => [
                        Query::equal('is_active', true)
                    ]
                ]
            );

            if (empty($games['documents'])) {
                return [
                    'success' => true,
                    'data' => $this->getSampleGames()
                ];
            }

            // Transform to expected format
            $formattedGames = array_map(function($game) {
                return [
                    'id' => $game['$id'],
                    'title' => $game['title'],
                    'description' => $game['description'],
                    'category' => $game['category'],
                    'difficulty' => $game['difficulty'],
                    'players' => $game['players'] ?? 0,
                    'rating' => $game['rating'] ?? 4.0,
                    'icon' => $game['icon'] ?? $this->getDefaultIcon($game['category']),
                    'game_url' => $game['game_url'] ?? '',
                    'instructions' => $game['instructions'] ?? '',
                    'max_score' => $game['max_score'] ?? 1000,
                    'time_limit' => $game['time_limit'] ?? 300,
                    'is_active' => $game['is_active'] ?? true
                ];
            }, $games['documents']);

            return [
                'success' => true,
                'data' => $formattedGames
            ];

        } catch (Exception $e) {
            error_log('Failed to get games from Appwrite: ' . $e->getMessage());
            
            // Return sample games as fallback
            return [
                'success' => true,
                'data' => $this->getSampleGames()
            ];
        }
    }

    public function getGamesByCategory($category)
    {
        try {
            if (!$this->auth) {
                $sampleGames = $this->getSampleGames();
                $filteredGames = array_filter($sampleGames, function($game) use ($category) {
                    return $game['category'] === $category;
                });
                return [
                    'success' => true,
                    'data' => array_values($filteredGames)
                ];
            }

            // Set a timeout for Appwrite operations
            set_time_limit(10); // 10 seconds max
            
            $databases = $this->auth->getDatabasesService();
            
            // Get games by category from Appwrite
            $games = $databases->listDocuments(
                $this->databaseId,
                $this->collectionId,
                [
                    'queries' => [
                        Query::equal('category', $category),
                        Query::equal('is_active', true)
                    ]
                ]
            );

            if (empty($games['documents'])) {
                return [
                    'success' => true,
                    'data' => []
                ];
            }

            // Transform to expected format
            $formattedGames = array_map(function($game) {
                return [
                    'id' => $game['$id'],
                    'title' => $game['title'],
                    'description' => $game['description'],
                    'category' => $game['category'],
                    'difficulty' => $game['difficulty'],
                    'players' => $game['players'] ?? 0,
                    'rating' => $game['rating'] ?? 4.0,
                    'icon' => $game['icon'] ?? $this->getDefaultIcon($game['category']),
                    'game_url' => $game['game_url'] ?? '',
                    'instructions' => $game['instructions'] ?? '',
                    'max_score' => $game['max_score'] ?? 1000,
                    'time_limit' => $game['time_limit'] ?? 300,
                    'is_active' => $game['is_active'] ?? true
                ];
            }, $games['documents']);

            return [
                'success' => true,
                'data' => $formattedGames
            ];

        } catch (Exception $e) {
            error_log('Failed to get games by category from Appwrite: ' . $e->getMessage());
            
            // Return sample games as fallback
            $sampleGames = $this->getSampleGames();
            $filteredGames = array_filter($sampleGames, function($game) use ($category) {
                return $game['category'] === $category;
            });
            return [
                'success' => true,
                'data' => array_values($filteredGames)
            ];
        }
    }

    public function getGame($gameId)
    {
        try {
            if (!$this->auth) {
                $sampleGames = $this->getSampleGames();
                foreach ($sampleGames as $game) {
                    if ($game['id'] === $gameId || $game['title'] === $gameId) {
                        return [
                            'success' => true,
                            'data' => $game
                        ];
                    }
                }
                return [
                    'success' => false,
                    'message' => 'Game not found'
                ];
            }

            // Set a timeout for Appwrite operations
            set_time_limit(10); // 10 seconds max
            
            $databases = $this->auth->getDatabasesService();
            
            // Get specific game from Appwrite
            $games = $databases->listDocuments(
                $this->databaseId,
                $this->collectionId,
                [
                    'queries' => [
                        Query::equal('$id', $gameId)
                    ]
                ]
            );

            if (empty($games['documents'])) {
                // Try to find by title
                $games = $databases->listDocuments(
                    $this->databaseId,
                    $this->collectionId,
                    [
                        'queries' => [
                            Query::equal('title', $gameId)
                        ]
                    ]
                );
            }

            if (empty($games['documents'])) {
                return [
                    'success' => false,
                    'message' => 'Game not found'
                ];
            }

            $game = $games['documents'][0];
            
            // Transform to expected format
            $formattedGame = [
                'id' => $game['$id'],
                'title' => $game['title'],
                'description' => $game['description'],
                'category' => $game['category'],
                'difficulty' => $game['difficulty'],
                'players' => $game['players'] ?? 0,
                'rating' => $game['rating'] ?? 4.0,
                'icon' => $game['icon'] ?? $this->getDefaultIcon($game['category']),
                'game_url' => $game['game_url'] ?? '',
                'instructions' => $game['instructions'] ?? '',
                'max_score' => $game['max_score'] ?? 1000,
                'time_limit' => $game['time_limit'] ?? 300,
                'is_active' => $game['is_active'] ?? true
            ];

            return [
                'success' => true,
                'data' => $formattedGame
            ];

        } catch (Exception $e) {
            error_log('Failed to get game from Appwrite: ' . $e->getMessage());
            
            // Return sample game as fallback
            $sampleGames = $this->getSampleGames();
            foreach ($sampleGames as $game) {
                if ($game['id'] === $gameId || $game['title'] === $gameId) {
                    return [
                        'success' => true,
                        'data' => $game
                    ];
                }
            }
            return [
                'success' => false,
                'message' => 'Game not found'
            ];
        }
    }

    private function getDefaultIcon($category)
    {
        switch ($category) {
            case 'speed':
                return '⚡';
            case 'bugfix':
                return '🐛';
            case 'memory':
                return '🧠';
            case 'puzzle':
                return '🧩';
            case 'algorithm':
                return '📊';
            default:
                return '🎮';
        }
    }

    // Fallback sample games
    private function getSampleGames()
    {
        return [
            [
                'id' => 'speed-coding-1',
                'title' => 'Speed Coding Challenge',
                'description' => 'Complete coding challenges as fast as possible. Race against the clock and other players!',
                'category' => 'speed',
                'difficulty' => 'Medium',
                'players' => 1250,
                'rating' => 4.2,
                'icon' => '⚡',
                'game_url' => '#',
                'instructions' => 'Write code quickly to solve the given problem within the time limit.',
                'max_score' => 1000,
                'time_limit' => 300
            ],
            [
                'id' => 'bug-hunt-1',
                'title' => 'Bug Hunter',
                'description' => 'Find and fix bugs in the provided code. Test your debugging skills!',
                'category' => 'bugfix',
                'difficulty' => 'Hard',
                'players' => 890,
                'rating' => 4.5,
                'icon' => '🐛',
                'game_url' => '#',
                'instructions' => 'Identify and fix all bugs in the code to make it work correctly.',
                'max_score' => 1000,
                'time_limit' => 600
            ],
            [
                'id' => 'memory-game-1',
                'title' => 'Code Memory',
                'description' => 'Test your memory by remembering code patterns and sequences.',
                'category' => 'memory',
                'difficulty' => 'Easy',
                'players' => 2100,
                'rating' => 4.0,
                'icon' => '🧠',
                'game_url' => '#',
                'instructions' => 'Memorize the code pattern and reproduce it correctly.',
                'max_score' => 1000,
                'time_limit' => 180
            ],
            [
                'id' => 'code-puzzle-1',
                'title' => 'Code Puzzle',
                'description' => 'Solve complex coding puzzles that require creative thinking.',
                'category' => 'puzzle',
                'difficulty' => 'Hard',
                'players' => 750,
                'rating' => 4.7,
                'icon' => '🧩',
                'game_url' => '#',
                'instructions' => 'Think outside the box to solve these challenging coding puzzles.',
                'max_score' => 1000,
                'time_limit' => 900
            ],
            [
                'id' => 'algorithm-race-1',
                'title' => 'Algorithm Race',
                'description' => 'Optimize algorithms for speed and efficiency. Compete for the best solution!',
                'category' => 'algorithm',
                'difficulty' => 'Expert',
                'players' => 450,
                'rating' => 4.8,
                'icon' => '📊',
                'game_url' => '#',
                'instructions' => 'Write the most efficient algorithm to solve the given problem.',
                'max_score' => 1000,
                'time_limit' => 1200
            ],
            [
                'id' => 'speed-coding-2',
                'title' => 'Quick HTML Builder',
                'description' => 'Build HTML structures quickly under time pressure.',
                'category' => 'speed',
                'difficulty' => 'Easy',
                'players' => 1800,
                'rating' => 4.1,
                'icon' => '⚡',
                'game_url' => '#',
                'instructions' => 'Create HTML markup as fast as possible while maintaining quality.',
                'max_score' => 1000,
                'time_limit' => 240
            ]
        ];
    }
}
