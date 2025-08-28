<?php
/**
 * Simple Challenge Seeding
 * Basic script to add challenges to the collection
 */

require_once __DIR__ . '/vendor/autoload.php';

use CodeQuest\Core\Auth;

echo "🌱 Simple Challenge Seeding\n";
echo "===========================\n\n";

try {
    $auth = new Auth();
    $databases = $auth->getDatabasesService();
    
    $databaseId = 'codequest';
    $collectionId = 'challenges';
    
    echo "✅ Appwrite client initialized\n\n";
    
    // Simple challenge data
    $challenge = [
        'title' => 'Create Your First HTML Page',
        'description' => 'Create a simple HTML page with a heading and paragraph.',
        'difficulty' => 'beginner',
        'category' => 'html',
        'xp_reward' => 10,
        'is_active' => true
    ];
    
    echo "📝 Creating challenge: {$challenge['title']}\n";
    
    $result = $databases->createDocument(
        $databaseId,
        $collectionId,
        'unique()',
        $challenge
    );
    
    echo "✅ Challenge created successfully!\n";
    echo "  ID: {$result['$id']}\n";
    echo "  Title: {$result['title']}\n";
    
    // Verify it was created
    echo "\n🔍 Verifying challenge...\n";
    $verification = $databases->listDocuments($databaseId, $collectionId);
    echo "✅ Found " . count($verification['documents']) . " challenges in collection\n";
    
    foreach ($verification['documents'] as $doc) {
        echo "  • {$doc['title']} ({$doc['difficulty']} - {$doc['category']})\n";
    }
    
} catch (Exception $e) {
    echo "❌ Failed: " . $e->getMessage() . "\n";
}
?>
