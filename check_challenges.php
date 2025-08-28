<?php
/**
 * Check Current Challenges in Appwrite
 * This script lists all challenges currently in the collection
 */

require_once __DIR__ . '/vendor/autoload.php';

use CodeQuest\Core\Auth;

echo "🔍 Checking Current Challenges in Appwrite\n";
echo "=========================================\n\n";

try {
    // Initialize Appwrite client
    $auth = new Auth();
    $databases = $auth->getDatabasesService();
    
    $databaseId = 'codequest';
    $collectionId = 'challenges';
    
    echo "✅ Appwrite client initialized\n\n";
    
    // Get all challenges
    echo "📋 Fetching challenges from collection...\n";
    $challenges = $databases->listDocuments($databaseId, $collectionId);
    
    if (empty($challenges['documents'])) {
        echo "❌ No challenges found in the collection\n";
    } else {
        echo "✅ Found " . count($challenges['documents']) . " challenges:\n\n";
        
        foreach ($challenges['documents'] as $index => $challenge) {
            echo "Challenge #" . ($index + 1) . ":\n";
            echo "  ID: {$challenge['$id']}\n";
            echo "  Title: {$challenge['title']}\n";
            echo "  Description: " . substr($challenge['description'], 0, 100) . "...\n";
            echo "  Difficulty: {$challenge['difficulty']}\n";
            echo "  Category: {$challenge['category']}\n";
            echo "  XP Reward: {$challenge['xp_reward']}\n";
            echo "  Time Limit: {$challenge['time_limit_minutes']} minutes\n";
            echo "  Active: " . ($challenge['is_active'] ? 'Yes' : 'No') . "\n";
            
            // Show available attributes
            echo "  Available attributes: " . implode(', ', array_keys($challenge)) . "\n";
            echo "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Failed to check challenges: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
