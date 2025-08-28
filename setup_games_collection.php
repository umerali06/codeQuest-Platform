<?php
/**
 * Setup Games Collection in Appwrite
 * Creates the games collection and seeds it with sample data
 */

require_once 'vendor/autoload.php';
require_once 'api/src/Core/Auth.php';

use CodeQuest\Core\Auth;

try {
    echo "Setting up Games Collection in Appwrite...\n";
    
    $auth = new Auth();
    $databases = $auth->getDatabasesService();
    $databaseId = 'codequest_db';
    $collectionId = 'games';
    
    // Check if database exists
    try {
        $database = $databases->get($databaseId);
        echo "Database '{$databaseId}' found.\n";
    } catch (Exception $e) {
        echo "Database '{$databaseId}' not found. Creating...\n";
        $database = $databases->create($databaseId, 'CodeQuest Database');
        echo "Database '{$databaseId}' created successfully.\n";
    }
    
    // Check if collection exists
    try {
        $collection = $databases->getCollection($databaseId, $collectionId);
        echo "Collection '{$collectionId}' found.\n";
        
        // Ask if user wants to recreate
        echo "Collection already exists. Do you want to delete and recreate it? (y/N): ";
        $handle = fopen("php://stdin", "r");
        $line = fgets($handle);
        fclose($handle);
        
        if (trim(strtolower($line)) === 'y') {
            echo "Deleting existing collection...\n";
            $databases->deleteCollection($databaseId, $collectionId);
            echo "Collection deleted.\n";
        } else {
            echo "Keeping existing collection. Exiting.\n";
            exit(0);
        }
    } catch (Exception $e) {
        echo "Collection '{$collectionId}' not found. Creating...\n";
    }
    
    // Create collection
    echo "Creating collection '{$collectionId}'...\n";
    $collection = $databases->createCollection($databaseId, $collectionId, 'Games Collection');
    echo "Collection '{$collectionId}' created successfully.\n";
    
    // Create attributes
    echo "Creating collection attributes...\n";
    
    // Title attribute
    $databases->createStringAttribute($databaseId, $collectionId, 'title', 255, true);
    echo "Created 'title' attribute.\n";
    
    // Description attribute
    $databases->createStringAttribute($databaseId, $collectionId, 'description', 1000, true);
    echo "Created 'description' attribute.\n";
    
    // Category attribute
    $databases->createStringAttribute($databaseId, $collectionId, 'category', 50, true);
    echo "Created 'category' attribute.\n";
    
    // Difficulty attribute
    $databases->createStringAttribute($databaseId, $collectionId, 'difficulty', 50, true);
    echo "Created 'difficulty' attribute.\n";
    
    // Players attribute
    $databases->createIntegerAttribute($databaseId, $collectionId, 'players', true);
    echo "Created 'players' attribute.\n";
    
    // Rating attribute
    $databases->createFloatAttribute($databaseId, $collectionId, 'rating', true);
    echo "Created 'rating' attribute.\n";
    
    // Icon attribute
    $databases->createStringAttribute($databaseId, $collectionId, 'icon', 10, true);
    echo "Created 'icon' attribute.\n";
    
    // Game URL attribute
    $databases->createStringAttribute($databaseId, $collectionId, 'game_url', 500, false);
    echo "Created 'game_url' attribute.\n";
    
    // Instructions attribute
    $databases->createStringAttribute($databaseId, $collectionId, 'instructions', 1000, false);
    echo "Created 'instructions' attribute.\n";
    
    // Max Score attribute
    $databases->createIntegerAttribute($databaseId, $collectionId, 'max_score', true);
    echo "Created 'max_score' attribute.\n";
    
    // Time Limit attribute
    $databases->createIntegerAttribute($databaseId, $collectionId, 'time_limit', true);
    echo "Created 'time_limit' attribute.\n";
    
    // Is Active attribute
    $databases->createBooleanAttribute($databaseId, $collectionId, 'is_active', true);
    echo "Created 'is_active' attribute.\n";
    
    echo "All attributes created successfully.\n";
    
    // Wait a moment for attributes to be ready
    echo "Waiting for attributes to be ready...\n";
    sleep(5);
    
    // Seed with sample data
    echo "Seeding collection with sample data...\n";
    
    $sampleGames = [
        [
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
            'time_limit' => 300,
            'is_active' => true
        ],
        [
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
            'time_limit' => 600,
            'is_active' => true
        ],
        [
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
            'time_limit' => 180,
            'is_active' => true
        ],
        [
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
            'time_limit' => 900,
            'is_active' => true
        ],
        [
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
            'time_limit' => 1200,
            'is_active' => true
        ],
        [
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
            'time_limit' => 240,
            'is_active' => true
        ]
    ];
    
    foreach ($sampleGames as $game) {
        try {
            $databases->createDocument($databaseId, $collectionId, 'unique()', $game);
            echo "Created game: {$game['title']}\n";
        } catch (Exception $e) {
            echo "Failed to create game '{$game['title']}': " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nGames collection setup completed successfully!\n";
    echo "Total games created: " . count($sampleGames) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
