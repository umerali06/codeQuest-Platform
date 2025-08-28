<?php

namespace CodeQuest\Core;

/**
 * Appwrite Collections Configuration
 * Defines all collections and their attributes for the CodeQuest platform
 */
class AppwriteCollections
{
    private $auth;
    
    public function __construct()
    {
        $this->auth = new Auth();
    }
    
    /**
     * Initialize all collections
     */
    public function initializeCollections()
    {
        try {
            $this->createGamesCollection();
            $this->createModulesCollection();
            $this->createLessonsCollection();
            $this->createChallengesCollection();
            $this->createUserProgressCollection();
            $this->createGameResultsCollection();
            $this->createUserStatisticsCollection();
            $this->createAIInteractionsCollection();
            
            return true;
        } catch (\Exception $e) {
            error_log('Failed to initialize Appwrite collections: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Create Games collection
     */
    private function createGamesCollection()
    {
        try {
            $databases = $this->auth->getDatabasesService();
            
            // Create database if it doesn't exist
            try {
                $database = $databases->create('codequest', 'CodeQuest Platform');
            } catch (\Exception $e) {
                // Database might already exist
                $database = $databases->get('codequest');
            }
            
            // Create games collection
            try {
                $collection = $databases->createCollection(
                    $database['$id'],
                    'games',
                    'Coding Games'
                );
                
                // Create attributes
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'title', 200, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'description', 1000, false);
                $databases->createEnumAttribute($database['$id'], $collection['$id'], 'category', ['speed', 'puzzle', 'bugfix', 'algorithm', 'memory'], true);
                $databases->createEnumAttribute($database['$id'], $collection['$id'], 'difficulty', ['beginner', 'intermediate', 'advanced', 'expert'], true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'xp_reward', true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'icon', 10, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'color', 7, false);
                $databases->createBooleanAttribute($database['$id'], $collection['$id'], 'is_active', true);
                
                // Create indexes
                $databases->createIndex($database['$id'], $collection['$id'], 'category_index', \Appwrite\Enums\IndexType::KEY(), ['category']);
                $databases->createIndex($database['$id'], $collection['$id'], 'difficulty_index', \Appwrite\Enums\IndexType::KEY(), ['difficulty']);
                $databases->createIndex($database['$id'], $collection['$id'], 'active_index', \Appwrite\Enums\IndexType::KEY(), ['is_active']);
                
            } catch (\Exception $e) {
                // Collection might already exist
                error_log('Games collection setup: ' . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            error_log('Failed to create games collection: ' . $e->getMessage());
        }
    }
    
    /**
     * Create Modules collection
     */
    private function createModulesCollection()
    {
        try {
            $databases = $this->auth->getDatabasesService();
            $database = $databases->get('codequest');
            
            try {
                $collection = $databases->createCollection(
                    $database['$id'],
                    'modules',
                    'Learning Modules'
                );
                
                // Create attributes
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'slug', 50, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'title', 100, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'description', 1000, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'icon', 10, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'color', 7, false);
                $databases->createEnumAttribute($database['$id'], $collection['$id'], 'difficulty', ['beginner', 'intermediate', 'advanced', 'expert'], true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'estimated_hours', true);
                $databases->createBooleanAttribute($database['$id'], $collection['$id'], 'is_active', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'sort_order', true);
                
                // Create indexes
                $databases->createIndex($database['$id'], $collection['$id'], 'slug_index', \Appwrite\Enums\IndexType::KEY(), ['slug']);
                $databases->createIndex($database['$id'], $collection['$id'], 'active_index', \Appwrite\Enums\IndexType::KEY(), ['is_active']);
                
            } catch (\Exception $e) {
                error_log('Modules collection setup: ' . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            error_log('Failed to create modules collection: ' . $e->getMessage());
        }
    }
    
    /**
     * Create Lessons collection
     */
    private function createLessonsCollection()
    {
        try {
            $databases = $this->auth->getDatabasesService();
            $database = $databases->get('codequest');
            
            try {
                $collection = $databases->createCollection(
                    $database['$id'],
                    'lessons',
                    'Learning Lessons'
                );
                
                // Create attributes
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'module_id', 36, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'slug', 100, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'title', 200, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'description', 1000, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'content_md', 10000, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'video_url', 500, false);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'duration_minutes', true);
                $databases->createEnumAttribute($database['$id'], $collection['$id'], 'difficulty', ['beginner', 'intermediate', 'advanced', 'expert'], true);
                $databases->createBooleanAttribute($database['$id'], $collection['$id'], 'is_active', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'sort_order', true);
                
                // Create indexes
                $databases->createIndex($database['$id'], $collection['$id'], 'module_id_index', \Appwrite\Enums\IndexType::KEY(), ['module_id']);
                $databases->createIndex($database['$id'], $collection['$id'], 'slug_index', \Appwrite\Enums\IndexType::KEY(), ['slug']);
                
            } catch (\Exception $e) {
                error_log('Lessons collection setup: ' . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            error_log('Failed to create lessons collection: ' . $e->getMessage());
        }
    }
    
    /**
     * Create Challenges collection
     */
    private function createChallengesCollection()
    {
        try {
            $databases = $this->auth->getDatabasesService();
            $database = $databases->get('codequest');
            
            try {
                $collection = $databases->createCollection(
                    $database['$id'],
                    'challenges',
                    'Coding Challenges'
                );
                
                // Create attributes
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'lesson_id', 36, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'title', 200, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'description', 1000, false);
                $databases->createEnumAttribute($database['$id'], $collection['$id'], 'difficulty', ['beginner', 'intermediate', 'advanced', 'expert'], true);
                $databases->createEnumAttribute($database['$id'], $collection['$id'], 'category', ['html', 'css', 'javascript', 'responsive', 'accessibility', 'fullstack'], true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'xp_reward', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'time_limit_minutes', true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'starter_code_html', 10000, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'starter_code_css', 10000, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'starter_code_js', 10000, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'solution_code_html', 10000, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'solution_code_css', 10000, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'solution_code_js', 10000, false);
                $databases->createBooleanAttribute($database['$id'], $collection['$id'], 'is_active', true);
                
                // Create indexes
                $databases->createIndex($database['$id'], $collection['$id'], 'lesson_id_index', \Appwrite\Enums\IndexType::KEY(), ['lesson_id']);
                $databases->createIndex($database['$id'], $collection['$id'], 'difficulty_index', \Appwrite\Enums\IndexType::KEY(), ['difficulty']);
                $databases->createIndex($database['$id'], $collection['$id'], 'category_index', \Appwrite\Enums\IndexType::KEY(), ['category']);
                
            } catch (\Exception $e) {
                error_log('Challenges collection setup: ' . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            error_log('Failed to create challenges collection: ' . $e->getMessage());
        }
    }
    
    /**
     * Create User Progress collection
     */
    private function createUserProgressCollection()
    {
        try {
            $databases = $this->auth->getDatabasesService();
            $database = $databases->get('codequest');
            
            try {
                $collection = $databases->createCollection(
                    $database['$id'],
                    'user_progress',
                    'User Learning Progress'
                );
                
                // Create attributes
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'user_id', 36, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'lesson_id', 36, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'challenge_id', 36, false);
                $databases->createEnumAttribute($database['$id'], $collection['$id'], 'status', ['not_started', 'in_progress', 'completed', 'failed'], true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'time_spent_seconds', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'attempts_count', true);
                $databases->createFloatAttribute($database['$id'], $collection['$id'], 'best_score', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'xp_earned', true);
                
                // Create indexes
                $databases->createIndex($database['$id'], $collection['$id'], 'user_id_index', \Appwrite\Enums\IndexType::KEY(), ['user_id']);
                $databases->createIndex($database['$id'], $collection['$id'], 'lesson_id_index', \Appwrite\Enums\IndexType::KEY(), ['lesson_id']);
                $databases->createIndex($database['$id'], $collection['$id'], 'challenge_id_index', \Appwrite\Enums\IndexType::KEY(), ['challenge_id']);
                
            } catch (\Exception $e) {
                error_log('User Progress collection setup: ' . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            error_log('Failed to create user progress collection: ' . $e->getMessage());
        }
    }
    
    /**
     * Create Game Results collection
     */
    private function createGameResultsCollection()
    {
        try {
            $databases = $this->auth->getDatabasesService();
            $database = $databases->get('codequest');
            
            try {
                $collection = $databases->createCollection(
                    $database['$id'],
                    'game_results',
                    'Game Results and Scores'
                );
                
                // Create attributes
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'user_id', 36, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'game_id', 36, true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'score', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'time_taken_seconds', true);
                $databases->createFloatAttribute($database['$id'], $collection['$id'], 'accuracy', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'xp_earned', true);
                
                // Create indexes
                $databases->createIndex($database['$id'], $collection['$id'], 'user_id_index', \Appwrite\Enums\IndexType::KEY(), ['user_id']);
                $databases->createIndex($database['$id'], $collection['$id'], 'game_id_index', \Appwrite\Enums\IndexType::KEY(), ['game_id']);
                $databases->createIndex($database['$id'], $collection['$id'], 'score_index', \Appwrite\Enums\IndexType::KEY(), ['score']);
                
            } catch (\Exception $e) {
                error_log('Game Results collection setup: ' . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            error_log('Failed to create game results collection: ' . $e->getMessage());
        }
    }
    
    /**
     * Create User Statistics collection
     */
    private function createUserStatisticsCollection()
    {
        try {
            $databases = $this->auth->getDatabasesService();
            $database = $databases->get('codequest');
            
            try {
                $collection = $databases->createCollection(
                    $database['$id'],
                    'user_statistics',
                    'User Statistics and Metrics'
                );
                
                // Create attributes
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'user_id', 36, true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'total_xp', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'current_level', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'current_streak', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'longest_streak', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'lessons_completed', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'challenges_completed', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'games_played', true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'total_time_spent_seconds', true);
                
                // Create indexes
                $databases->createIndex($database['$id'], $collection['$id'], 'user_id_index', \Appwrite\Enums\IndexType::KEY(), ['user_id']);
                $databases->createIndex($database['$id'], $collection['$id'], 'total_xp_index', \Appwrite\Enums\IndexType::KEY(), ['total_xp']);
                $databases->createIndex($database['$id'], $collection['$id'], 'level_index', \Appwrite\Enums\IndexType::KEY(), ['current_level']);
                
            } catch (\Exception $e) {
                error_log('User Statistics collection setup: ' . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            error_log('Failed to create user statistics collection: ' . $e->getMessage());
        }
    }
    
    /**
     * Create AI Interactions collection
     */
    private function createAIInteractionsCollection()
    {
        try {
            $databases = $this->auth->getDatabasesService();
            $database = $databases->get('codequest');
            
            try {
                $collection = $databases->createCollection(
                    $database['$id'],
                    'ai_interactions',
                    'AI Assistant Interactions'
                );
                
                // Create attributes
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'user_id', 36, true);
                $databases->createEnumAttribute($database['$id'], $collection['$id'], 'context_type', ['lesson', 'challenge', 'game', 'general'], true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'context_id', 36, false);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'prompt', 10000, true);
                $databases->createStringAttribute($database['$id'], $collection['$id'], 'response', 10000, true);
                $databases->createIntegerAttribute($database['$id'], $collection['$id'], 'tokens_used', true);
                $databases->createFloatAttribute($database['$id'], $collection['$id'], 'cost_usd', true);
                
                // Create indexes
                $databases->createIndex($database['$id'], $collection['$id'], 'user_id_index', \Appwrite\Enums\IndexType::KEY(), ['user_id']);
                $databases->createIndex($database['$id'], $collection['$id'], 'context_type_index', \Appwrite\Enums\IndexType::KEY(), ['context_type']);
                
            } catch (\Exception $e) {
                error_log('AI Interactions collection setup: ' . $e->getMessage());
            }
            
        } catch (\Exception $e) {
            error_log('Failed to create AI interactions collection: ' . $e->getMessage());
        }
    }
}
