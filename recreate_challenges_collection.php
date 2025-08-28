<?php
/**
 * Recreate Challenges Collection with Correct Attributes
 * This script will delete and recreate the challenges collection with proper structure
 */

require_once __DIR__ . '/vendor/autoload.php';

use CodeQuest\Core\Auth;

echo "🔧 Recreating Challenges Collection in Appwrite\n";
echo "==============================================\n\n";

try {
    // Initialize Appwrite client
    $auth = new Auth();
    $databases = $auth->getDatabasesService();
    
    $databaseId = 'codequest';
    $collectionId = 'challenges';
    
    echo "✅ Appwrite client initialized\n";
    
    // Check if collection exists and delete it
    try {
        echo "🗑️  Deleting existing challenges collection...\n";
        $databases->deleteCollection($databaseId, $collectionId);
        echo "✅ Existing collection deleted\n\n";
    } catch (Exception $e) {
        echo "ℹ️  Collection doesn't exist or already deleted: " . $e->getMessage() . "\n\n";
    }
    
    // Create new collection
    echo "🏗️  Creating new challenges collection...\n";
    $collection = $databases->createCollection(
        $databaseId,
        $collectionId,
        'Coding Challenges'
    );
    echo "✅ Collection created with ID: {$collection['$id']}\n\n";
    
    // Create attributes
    echo "🔧 Creating collection attributes...\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'lesson_id', 36, false);
    echo "  ✅ lesson_id (string, 36 chars)\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'title', 200, true);
    echo "  ✅ title (string, 200 chars, required)\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'description', 1000, false);
    echo "  ✅ description (string, 1000 chars)\n";
    
    $databases->createEnumAttribute($databaseId, $collectionId, 'difficulty', ['beginner', 'intermediate', 'advanced', 'expert'], true);
    echo "  ✅ difficulty (enum: beginner, intermediate, advanced, expert)\n";
    
    $databases->createEnumAttribute($databaseId, $collectionId, 'category', ['html', 'css', 'javascript', 'responsive', 'accessibility', 'fullstack'], true);
    echo "  ✅ category (enum: html, css, javascript, responsive, accessibility, fullstack)\n";
    
    $databases->createIntegerAttribute($databaseId, $collectionId, 'xp_reward', true);
    echo "  ✅ xp_reward (integer)\n";
    
    $databases->createIntegerAttribute($databaseId, $collectionId, 'time_limit_minutes', true);
    echo "  ✅ time_limit_minutes (integer)\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'starter_code_html', 10000, false);
    echo "  ✅ starter_code_html (string, 10000 chars)\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'starter_code_css', 10000, false);
    echo "  ✅ starter_code_css (string, 10000 chars)\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'starter_code_js', 10000, false);
    echo "  ✅ starter_code_js (string, 10000 chars)\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'solution_code_html', 10000, false);
    echo "  ✅ solution_code_html (string, 10000 chars)\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'solution_code_css', 10000, false);
    echo "  ✅ solution_code_css (string, 10000 chars)\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'solution_code_js', 10000, false);
    echo "  ✅ solution_code_js (string, 10000 chars)\n";
    
    $databases->createBooleanAttribute($databaseId, $collectionId, 'is_active', true);
    echo "  ✅ is_active (boolean)\n";
    
    echo "\n🔍 Creating indexes...\n";
    
    // Create indexes
    $databases->createIndex($databaseId, $collectionId, 'lesson_id_index', \Appwrite\Enums\IndexType::KEY(), ['lesson_id']);
    echo "  ✅ lesson_id_index\n";
    
    $databases->createIndex($databaseId, $collectionId, 'difficulty_index', \Appwrite\Enums\IndexType::KEY(), ['difficulty']);
    echo "  ✅ difficulty_index\n";
    
    $databases->createIndex($databaseId, $collectionId, 'category_index', \Appwrite\Enums\IndexType::KEY(), ['category']);
    echo "  ✅ category_index\n";
    
    echo "\n🎉 Challenges collection recreated successfully!\n";
    echo "📋 Collection structure:\n";
    echo "  • lesson_id (string)\n";
    echo "  • title (string, required)\n";
    echo "  • description (string)\n";
    echo "  • difficulty (enum: beginner, intermediate, advanced, expert)\n";
    echo "  • category (enum: html, css, javascript, responsive, accessibility, fullstack)\n";
    echo "  • xp_reward (integer)\n";
    echo "  • time_limit_minutes (integer)\n";
    echo "  • starter_code_html (string)\n";
    echo "  • starter_code_css (string)\n";
    echo "  • starter_code_js (string)\n";
    echo "  • solution_code_html (string)\n";
    echo "  • solution_code_css (string)\n";
    echo "  • solution_code_js (string)\n";
    echo "  • is_active (boolean)\n";
    
    echo "\n✅ Ready for seeding challenges data!\n";
    
} catch (Exception $e) {
    echo "❌ Failed to recreate collection: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
