<?php
/**
 * Check Available Attributes
 * This script checks what attributes are actually available in the challenges collection
 */

require_once __DIR__ . '/vendor/autoload.php';

use CodeQuest\Core\Auth;

echo "🔍 Checking Available Attributes in Challenges Collection\n";
echo "=======================================================\n\n";

try {
    $auth = new Auth();
    $databases = $auth->getDatabasesService();
    
    $databaseId = 'codequest';
    $collectionId = 'challenges';
    
    echo "✅ Appwrite client initialized\n\n";
    
    // Get collection attributes
    echo "🔧 Getting collection attributes...\n";
    try {
        $attributes = $databases->listAttributes($databaseId, $collectionId);
        
        if (empty($attributes['attributes'])) {
            echo "❌ No attributes found in collection\n";
        } else {
            echo "✅ Found " . count($attributes['attributes']) . " attributes:\n\n";
            
            foreach ($attributes['attributes'] as $attr) {
                echo "  • {$attr['key']} ({$attr['type']})";
                if (isset($attr['required']) && $attr['required']) {
                    echo " - required";
                }
                if (isset($attr['size'])) {
                    echo " - max {$attr['size']} chars";
                }
                if (isset($attr['array']) && $attr['array']) {
                    echo " - array";
                }
                echo "\n";
            }
        }
    } catch (Exception $e) {
        echo "❌ Could not get attributes: " . $e->getMessage() . "\n";
    }
    
    // Try to create a test document with only basic attributes
    echo "\n🧪 Testing document creation with basic attributes...\n";
    try {
        $testDoc = $databases->createDocument(
            $databaseId,
            $collectionId,
            'unique()',
            [
                'title' => 'Test Challenge',
                'description' => 'This is a test challenge',
                'difficulty' => 'beginner',
                'category' => 'html',
                'xp_reward' => 10
            ]
        );
        echo "✅ Test document created successfully!\n";
        echo "  ID: {$testDoc['$id']}\n";
        
        // Clean up test document
        $databases->deleteDocument($databaseId, $collectionId, $testDoc['$id']);
        echo "  🧹 Test document cleaned up\n";
        
    } catch (Exception $e) {
        echo "❌ Test document creation failed: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Failed to check collection: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
?>
