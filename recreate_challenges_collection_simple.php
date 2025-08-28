<?php
/**
 * Recreate Challenges Collection with Simplified Attributes
 * This script creates a streamlined collection structure within Appwrite limits
 */

require_once __DIR__ . '/vendor/autoload.php';

use CodeQuest\Core\Auth;

echo "🔧 Recreating Challenges Collection (Simplified) in Appwrite\n";
echo "===========================================================\n\n";

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
    
    // Create essential attributes only
    echo "🔧 Creating collection attributes...\n";
    
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
    
    // Combined code fields to reduce attribute count
    $databases->createStringAttribute($databaseId, $collectionId, 'starter_code', 15000, false);
    echo "  ✅ starter_code (string, 15000 chars - combined HTML/CSS/JS)\n";
    
    $databases->createStringAttribute($databaseId, $collectionId, 'solution_code', 15000, false);
    echo "  ✅ solution_code (string, 15000 chars - combined HTML/CSS/JS)\n";
    
    $databases->createBooleanAttribute($databaseId, $collectionId, 'is_active', true);
    echo "  ✅ is_active (boolean)\n";
    
    echo "\n🔍 Creating indexes...\n";
    
    // Create essential indexes
    $databases->createIndex($databaseId, $collectionId, 'difficulty_index', \Appwrite\Enums\IndexType::KEY(), ['difficulty']);
    echo "  ✅ difficulty_index\n";
    
    $databases->createIndex($databaseId, $collectionId, 'category_index', \Appwrite\Enums\IndexType::KEY(), ['category']);
    echo "  ✅ category_index\n";
    
    echo "\n🎉 Challenges collection recreated successfully!\n";
    echo "📋 Simplified collection structure:\n";
    echo "  • title (string, required)\n";
    echo "  • description (string)\n";
    echo "  • difficulty (enum: beginner, intermediate, advanced, expert)\n";
    echo "  • category (enum: html, css, javascript, responsive, accessibility, fullstack)\n";
    echo "  • xp_reward (integer)\n";
    echo "  • time_limit_minutes (integer)\n";
    echo "  • starter_code (string - combined HTML/CSS/JS)\n";
    echo "  • solution_code (string - combined HTML/CSS/JS)\n";
    echo "  • is_active (boolean)\n";
    
    echo "\n✅ Ready for seeding challenges data!\n";
    
} catch (Exception $e) {
    echo "❌ Failed to recreate collection: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
