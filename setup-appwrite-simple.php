<?php
/**
 * Simple Appwrite Database Setup Script
 * Compatible with Appwrite SDK 13.0
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

    // Create attributes for user_progress collection (without defaults for compatibility)
    echo "\n🔧 Creating attributes for user_progress collection...\n";
    
    $stringAttributes = [
        ['key' => 'user_id', 'size' => 255, 'required' => true],
        ['key' => 'level_title', 'size' => 100, 'required' => false],
    ];

    $integerAttributes = [
        'total_xp', 'level', 'streak', 'html_xp', 'css_xp', 'javascript_xp',
        'html_lessons', 'css_lessons', 'javascript_lessons'
    ];

    $floatAttributes = [
        'html_progress', 'css_progress', 'javascript_progress'
    ];

    // Create string attributes
    foreach ($stringAttributes as $attr) {
        try {
            $databases->createStringAttribute(
                databaseId: $databaseId,
                collectionId: 'user_progress',
                key: $attr['key'],
                size: $attr['size'],
                required: $attr['required']
            );
            echo "  ✅ Created string attribute: {$attr['key']}\n";
            sleep(1);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "  ℹ️  Attribute {$attr['key']} already exists\n";
            } else {
                echo "  ❌ Failed to create attribute {$attr['key']}: " . $e->getMessage() . "\n";
            }
        }
    }

    // Create integer attributes
    foreach ($integerAttributes as $key) {
        try {
            $databases->createIntegerAttribute(
                databaseId: $databaseId,
                collectionId: 'user_progress',
                key: $key,
                required: false
            );
            echo "  ✅ Created integer attribute: $key\n";
            sleep(1);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "  ℹ️  Attribute $key already exists\n";
            } else {
                echo "  ❌ Failed to create attribute $key: " . $e->getMessage() . "\n";
            }
        }
    }

    // Create float attributes
    foreach ($floatAttributes as $key) {
        try {
            $databases->createFloatAttribute(
                databaseId: $databaseId,
                collectionId: 'user_progress',
                key: $key,
                required: false
            );
            echo "  ✅ Created float attribute: $key\n";
            sleep(1);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "  ℹ️  Attribute $key already exists\n";
            } else {
                echo "  ❌ Failed to create attribute $key: " . $e->getMessage() . "\n";
            }
        }
    }

    // Create datetime attribute
    try {
        $databases->createDatetimeAttribute(
            databaseId: $databaseId,
            collectionId: 'user_progress',
            key: 'last_login',
            required: false
        );
        echo "  ✅ Created datetime attribute: last_login\n";
        sleep(1);
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  ℹ️  Attribute last_login already exists\n";
        } else {
            echo "  ❌ Failed to create attribute last_login: " . $e->getMessage() . "\n";
        }
    }

    // Create indexes
    echo "\n🔍 Creating indexes...\n";
    try {
        // Skip index creation for now - can be done manually in Appwrite Console
        echo "ℹ️  Skipping index creation (can be done manually in Appwrite Console)\n";
    } catch (Exception $e) {
        echo "❌ Failed to create index: " . $e->getMessage() . "\n";
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
    echo "\n🏅 Creating attributes for user_achievements collection...\n";
    
    $achievementStringAttrs = [
        ['key' => 'user_id', 'size' => 255],
        ['key' => 'achievement_id', 'size' => 255],
    ];

    foreach ($achievementStringAttrs as $attr) {
        try {
            $databases->createStringAttribute(
                databaseId: $databaseId,
                collectionId: 'user_achievements',
                key: $attr['key'],
                size: $attr['size'],
                required: true
            );
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

    // Create earned_at datetime attribute
    try {
        $databases->createDatetimeAttribute(
            databaseId: $databaseId,
            collectionId: 'user_achievements',
            key: 'earned_at',
            required: true
        );
        echo "  ✅ Created achievement attribute: earned_at\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  ℹ️  Achievement attribute earned_at already exists\n";
        } else {
            echo "  ❌ Failed to create achievement attribute earned_at: " . $e->getMessage() . "\n";
        }
    }

    echo "\n🎉 Appwrite setup completed successfully!\n";
    echo "\n📋 Summary:\n";
    echo "  - Database: codequest_db\n";
    echo "  - Collections: user_progress, user_achievements\n";
    echo "  - Project ID: {$_ENV['APPWRITE_PROJECT_ID']}\n";
    echo "  - Endpoint: {$_ENV['APPWRITE_ENDPOINT']}\n";
    echo "\n✅ Your CodeQuest application is now ready to use Appwrite!\n";
    echo "\n⚠️  IMPORTANT: Don't forget to set up permissions in the Appwrite Console:\n";
    echo "  1. Go to your Appwrite project dashboard\n";
    echo "  2. Navigate to Databases → codequest_db\n";
    echo "  3. For each collection (user_progress, user_achievements):\n";
    echo "     - Click on the collection\n";
    echo "     - Go to Settings → Permissions\n";
    echo "     - Add permission for 'users' (authenticated users) for Create, Read, Update, Delete\n";

} catch (Exception $e) {
    echo "❌ Error setting up Appwrite: " . $e->getMessage() . "\n";
    echo "Please check your Appwrite configuration and API key.\n";
    exit(1);
}
?>