<?php
/**
 * Seed Challenges with Minimal Attributes
 * This script seeds challenges using only the basic attributes that exist
 */

require_once __DIR__ . '/vendor/autoload.php';

use CodeQuest\Core\Auth;

echo "🌱 Seeding Challenges with Minimal Structure\n";
echo "===========================================\n\n";

try {
    // Initialize Appwrite client
    $auth = new Auth();
    $databases = $auth->getDatabasesService();
    
    $databaseId = 'codequest';
    $collectionId = 'challenges';
    
    echo "✅ Appwrite client initialized\n\n";
    
    // Define challenges with minimal structure (only essential attributes)
    $challenges = [
        [
            'title' => 'Create Your First HTML Page',
            'description' => 'Create a simple HTML page with a heading and paragraph using semantic HTML elements.',
            'difficulty' => 'beginner',
            'category' => 'html',
            'xp_reward' => 10,
            'is_active' => true
        ],
        [
            'title' => 'Style Your HTML',
            'description' => 'Add CSS styling to make your HTML page look beautiful and professional.',
            'difficulty' => 'beginner',
            'category' => 'css',
            'xp_reward' => 15,
            'is_active' => true
        ],
        [
            'title' => 'Add Interactivity',
            'description' => 'Use JavaScript to add a button that changes text when clicked.',
            'difficulty' => 'beginner',
            'category' => 'javascript',
            'xp_reward' => 20,
            'is_active' => true
        ],
        [
            'title' => 'Form Validation',
            'description' => 'Implement client-side form validation with JavaScript.',
            'difficulty' => 'intermediate',
            'category' => 'javascript',
            'xp_reward' => 60,
            'is_active' => true
        ],
        [
            'title' => 'CSS Grid Dashboard',
            'description' => 'Design a dashboard layout using CSS Grid.',
            'difficulty' => 'intermediate',
            'category' => 'css',
            'xp_reward' => 70,
            'is_active' => true
        ]
    ];
    
    echo "📝 Found " . count($challenges) . " challenges to seed\n\n";
    
    // Clear existing challenges first
    try {
        echo "🧹 Clearing existing challenges...\n";
        $existingChallenges = $databases->listDocuments($databaseId, $collectionId);
        
        foreach ($existingChallenges['documents'] as $challenge) {
            $databases->deleteDocument($databaseId, $collectionId, $challenge['$id']);
            echo "  - Deleted: {$challenge['title']}\n";
        }
        echo "✅ Existing challenges cleared\n\n";
    } catch (Exception $e) {
        echo "ℹ️  No existing challenges to clear\n\n";
    }
    
    // Seed new challenges
    echo "🌱 Seeding new challenges...\n";
    $successCount = 0;
    
    foreach ($challenges as $challenge) {
        try {
            $databases->createDocument(
                $databaseId,
                $collectionId,
                'unique()',
                $challenge
            );
            echo "  ✅ {$challenge['title']} - {$challenge['difficulty']} ({$challenge['category']})\n";
            $successCount++;
        } catch (Exception $e) {
            echo "  ❌ Failed to create '{$challenge['title']}': " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n🎉 Seeding completed!\n";
    echo "📊 Successfully seeded: {$successCount}/" . count($challenges) . " challenges\n";
    
    if ($successCount === count($challenges)) {
        echo "✅ All challenges seeded successfully!\n";
        echo "\nThe challenges collection now contains:\n";
        foreach ($challenges as $challenge) {
            echo "  • {$challenge['title']} ({$challenge['difficulty']} - {$challenge['category']})\n";
        }
        
        echo "\n🔍 Verifying challenges...\n";
        try {
            $verification = $databases->listDocuments($databaseId, $collectionId);
            echo "✅ Verification: Found " . count($verification['documents']) . " challenges in collection\n";
        } catch (Exception $e) {
            echo "⚠️  Verification failed: " . $e->getMessage() . "\n";
        }
    } else {
        echo "⚠️  Some challenges failed to seed. Check the errors above.\n";
    }
    
} catch (Exception $e) {
    echo "❌ Seeding failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
