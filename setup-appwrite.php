<?php
/**
 * Appwrite Database Setup Script
 * This script creates the required database and collections in your Appwrite project
 */

require_once __DIR__ . '/vendor/autoload.php';

use Appwrite\Client;
use Appwrite\Services\Databases;
use Appwrite\ID;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Appwrite configuration
$client = new Client();
$client
    ->setEndpoint($_ENV['APPWRITE_ENDPOINT'])
    ->setProject($_ENV['APPWRITE_PROJECT_ID'])
    ->setKey($_ENV['APPWRITE_API_KEY']);

$databases = new Databases($client);

echo "🚀 Setting up Appwrite database for CodeQuest...\n\n";

try {
    // Create database
    $databaseId = 'codequest_db';
    
    echo "📊 Creating database: $databaseId\n";
    try {
        $database = $databases->create(
            databaseId: $databaseId,
            name: 'CodeQuest Database'
        );
        echo "✅ Database created successfully!\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "ℹ️  Database already exists, continuing...\n";
        } else {
            throw $e;
        }
    }

    // Create user_progress collection
    echo "\n📋 Creating user_progress collection...\n";
    try {
        $userProgressCollection = $databases->createCollection(
            databaseId: $databaseId,
            collectionId: 'user_progress',
            name: 'User Progress'
        );
        echo "✅ User progress collection created!\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "ℹ️  User progress collection already exists, continuing...\n";
        } else {
            throw $e;
        }
    }

    // Create attributes for user_progress collection
    echo "\n🔧 Creating attributes for user_progress collection...\n";
    
    $attributes = [
        ['key' => 'user_id', 'type' => 'string', 'size' => 255, 'required' => true],
        ['key' => 'total_xp', 'type' => 'integer', 'required' => true, 'default' => 0],
        ['key' => 'level', 'type' => 'integer', 'required' => true, 'default' => 1],
        ['key' => 'level_title', 'type' => 'string', 'size' => 100, 'required' => true, 'default' => 'Beginner'],
        ['key' => 'streak', 'type' => 'integer', 'required' => true, 'default' => 0],
        ['key' => 'html_xp', 'type' => 'integer', 'required' => true, 'default' => 0],
        ['key' => 'css_xp', 'type' => 'integer', 'required' => true, 'default' => 0],
        ['key' => 'javascript_xp', 'type' => 'integer', 'required' => true, 'default' => 0],
        ['key' => 'html_lessons', 'type' => 'integer', 'required' => true, 'default' => 0],
        ['key' => 'css_lessons', 'type' => 'integer', 'required' => true, 'default' => 0],
        ['key' => 'javascript_lessons', 'type' => 'integer', 'required' => true, 'default' => 0],
        ['key' => 'html_progress', 'type' => 'double', 'required' => true, 'default' => 0.0],
        ['key' => 'css_progress', 'type' => 'double', 'required' => true, 'default' => 0.0],
        ['key' => 'javascript_progress', 'type' => 'double', 'required' => true, 'default' => 0.0],
        ['key' => 'last_login', 'type' => 'datetime', 'required' => false],
    ];

    foreach ($attributes as $attr) {
        try {
            switch ($attr['type']) {
                case 'string':
                    if (isset($attr['default'])) {
                        $databases->createStringAttribute(
                            databaseId: $databaseId,
                            collectionId: 'user_progress',
                            key: $attr['key'],
                            size: $attr['size'],
                            required: $attr['required'],
                            default: $attr['default']
                        );
                    } else {
                        $databases->createStringAttribute(
                            databaseId: $databaseId,
                            collectionId: 'user_progress',
                            key: $attr['key'],
                            size: $attr['size'],
                            required: $attr['required']
                        );
                    }
                    break;
                case 'integer':
                    if (isset($attr['default'])) {
                        $databases->createIntegerAttribute(
                            databaseId: $databaseId,
                            collectionId: 'user_progress',
                            key: $attr['key'],
                            required: $attr['required'],
                            default: $attr['default']
                        );
                    } else {
                        $databases->createIntegerAttribute(
                            databaseId: $databaseId,
                            collectionId: 'user_progress',
                            key: $attr['key'],
                            required: $attr['required']
                        );
                    }
                    break;
                case 'double':
                    if (isset($attr['default'])) {
                        $databases->createFloatAttribute(
                            databaseId: $databaseId,
                            collectionId: 'user_progress',
                            key: $attr['key'],
                            required: $attr['required'],
                            default: $attr['default']
                        );
                    } else {
                        $databases->createFloatAttribute(
                            databaseId: $databaseId,
                            collectionId: 'user_progress',
                            key: $attr['key'],
                            required: $attr['required']
                        );
                    }
                    break;
                case 'datetime':
                    $databases->createDatetimeAttribute(
                        databaseId: $databaseId,
                        collectionId: 'user_progress',
                        key: $attr['key'],
                        required: $attr['required']
                    );
                    break;
            }
            echo "  ✅ Created attribute: {$attr['key']}\n";
            
            // Wait a bit between attribute creations to avoid rate limits
            sleep(1);
            
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "  ℹ️  Attribute {$attr['key']} already exists\n";
            } else {
                echo "  ❌ Failed to create attribute {$attr['key']}: " . $e->getMessage() . "\n";
            }
        }
    }

    // Create indexes
    echo "\n🔍 Creating indexes...\n";
    try {
        $databases->createIndex(
            databaseId: $databaseId,
            collectionId: 'user_progress',
            key: 'user_id_index',
            type: 'key',
            attributes: ['user_id']
        );
        echo "✅ Created user_id index\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "ℹ️  Index already exists\n";
        } else {
            echo "❌ Failed to create index: " . $e->getMessage() . "\n";
        }
    }

    // Create user_achievements collection
    echo "\n🏆 Creating user_achievements collection...\n";
    try {
        $achievementsCollection = $databases->createCollection(
            databaseId: $databaseId,
            collectionId: 'user_achievements',
            name: 'User Achievements'
        );
        echo "✅ User achievements collection created!\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "ℹ️  User achievements collection already exists\n";
        } else {
            throw $e;
        }
    }

    // Create attributes for user_achievements
    $achievementAttributes = [
        ['key' => 'user_id', 'type' => 'string', 'size' => 255, 'required' => true],
        ['key' => 'achievement_id', 'type' => 'string', 'size' => 255, 'required' => true],
        ['key' => 'earned_at', 'type' => 'datetime', 'required' => true],
    ];

    foreach ($achievementAttributes as $attr) {
        try {
            switch ($attr['type']) {
                case 'string':
                    $databases->createStringAttribute(
                        databaseId: $databaseId,
                        collectionId: 'user_achievements',
                        key: $attr['key'],
                        size: $attr['size'],
                        required: $attr['required']
                    );
                    break;
                case 'datetime':
                    $databases->createDatetimeAttribute(
                        databaseId: $databaseId,
                        collectionId: 'user_achievements',
                        key: $attr['key'],
                        required: $attr['required']
                    );
                    break;
            }
            echo "  ✅ Created achievement attribute: {$attr['key']}\n";
            sleep(1);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "  ℹ️  Achievement attribute {$attr['key']} already exists\n";
            } else {
                echo "  ❌ Failed to create achievement attribute {$attr['key']}: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "\n🎉 Appwrite setup completed successfully!\n";
    echo "\n📋 Summary:\n";
    echo "  - Database: codequest_db\n";
    echo "  - Collections: user_progress, user_achievements\n";
    echo "  - Project ID: {$_ENV['APPWRITE_PROJECT_ID']}\n";
    echo "  - Endpoint: {$_ENV['APPWRITE_ENDPOINT']}\n";
    echo "\n✅ Your CodeQuest application is now ready to use Appwrite!\n";

} catch (Exception $e) {
    echo "❌ Error setting up Appwrite: " . $e->getMessage() . "\n";
    echo "Please check your Appwrite configuration and API key.\n";
    exit(1);
}
?>